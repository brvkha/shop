#!/usr/bin/env bash
set -euo pipefail

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

ARTIFACT_URI="${1:-}"
SERVICE_NAME="${2:-flashcard-backend}"
TARGET_JAR_PATH="${3:-/opt/khaleo/flashcard-backend/current.jar}"
BASE_DIR="$(dirname "$TARGET_JAR_PATH")"
CURRENT_JAR="$TARGET_JAR_PATH"
NEW_JAR="${BASE_DIR}/new.jar"
BACKUP_JAR="${BASE_DIR}/backup.jar"
RUNTIME_ENV_PATH="${RUNTIME_ENV_PATH:-${BASE_DIR}/runtime-secrets.env}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/actuator/health}"
DB_SECRET_ID="${DB_SECRET_ID:-}"

[[ -z "$ARTIFACT_URI" ]] && fail "Missing artifact"
[[ "$ARTIFACT_URI" == s3://* ]] || fail "Artifact must be s3://"

require_command aws
require_command java
require_command systemctl
require_command curl

select_python() {
  if command -v python3 >/dev/null 2>&1; then
    echo "python3"
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    echo "python"
    return 0
  fi
  fail "Missing python runtime to parse secret JSON"
}

fetch_secret_string() {
  local secret_id="$1"
  aws secretsmanager get-secret-value --secret-id "$secret_id" --query SecretString --output text
}

emit_db_runtime_env() {
  local db_secret_json="$1"
  local py_cmd
  py_cmd="$(select_python)"

  "$py_cmd" - "$db_secret_json" <<'PY'
import json
import sys

raw = sys.argv[1].strip()
if not raw:
    raise SystemExit("DB secret is empty")

secret = json.loads(raw)

def pick(*keys):
    for key in keys:
        value = secret.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
        if isinstance(value, (int, float)):
            return str(value)
    return ""

jdbc_url = pick("jdbc_url", "jdbcUrl", "url")
host = pick("host", "hostname", "endpoint")
port = pick("port") or "3306"
db_name = pick("dbname", "dbName", "database", "database_name")
username = pick("username", "user")
password = pick("password", "pass")

if not jdbc_url and host and db_name:
    jdbc_url = f"jdbc:mysql://{host}:{port}/{db_name}?useSSL=true&requireSSL=true&verifyServerCertificate=true"

if not jdbc_url:
    raise SystemExit("DB secret missing JDBC URL or host/database fields")

if "localhost" in jdbc_url or "127.0.0.1" in jdbc_url:
    raise SystemExit("DB URL must not point to localhost")

if not username or not password:
    raise SystemExit("DB secret missing username/password")

print(f"DB_URL={jdbc_url}")
print(f"DB_USERNAME={username}")
print(f"DB_PASSWORD={password}")
PY
}

write_runtime_env() {
  local tmp_file
  tmp_file="$(mktemp)"

  {
    echo "DB_SECRET_ID=${DB_SECRET_ID}"
    echo "JWT_SECRET_ID=${JWT_SECRET_ID:-}"
    echo "SES_SECRET_ID=${SES_SECRET_ID:-}"
  } >"$tmp_file"

  if [[ -n "$DB_SECRET_ID" ]]; then
    local db_secret_json
    db_secret_json="$(fetch_secret_string "$DB_SECRET_ID")"
    emit_db_runtime_env "$db_secret_json" >>"$tmp_file"
  fi

  sudo mkdir -p "$(dirname "$RUNTIME_ENV_PATH")"
  sudo install -m 600 "$tmp_file" "$RUNTIME_ENV_PATH"
  rm -f "$tmp_file"
}

trap 'fail "Failed at line $LINENO"' ERR

sudo mkdir -p "$BASE_DIR"

# ======================
# 1. DOWNLOAD NEW VERSION
# ======================
log "Downloading new artifact..."
sudo aws s3 cp "$ARTIFACT_URI" "$NEW_JAR"

# ======================
# 2. BACKUP CURRENT
# ======================
if [[ -f "$CURRENT_JAR" ]]; then
  log "Backing up current version..."
  sudo cp "$CURRENT_JAR" "$BACKUP_JAR"
fi

# ======================
# 3. SWAP VERSION
# ======================
log "Switching to new version..."
sudo mv "$NEW_JAR" "$CURRENT_JAR"

log "Writing runtime environment from secrets..."
write_runtime_env

# ======================
# 4. ENSURE SERVICE
# ======================
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if ! sudo test -f "$UNIT_FILE"; then
  log "Creating systemd service..."

  cat <<EOF | sudo tee "$UNIT_FILE" >/dev/null
[Unit]
Description=KhaLeo Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=${BASE_DIR}
EnvironmentFile=-${RUNTIME_ENV_PATH}
ExecStart=/usr/bin/java -jar ${CURRENT_JAR}
Restart=always
RestartSec=5
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
fi

# ======================
# 5. RESTART SERVICE
# ======================
log "Restarting service..."
sudo systemctl restart "$SERVICE_NAME" || sudo systemctl start "$SERVICE_NAME"

# ======================
# 6. HEALTH CHECK
# ======================
log "Waiting for service health..."

# Increased timeout to 120 seconds (60 * 2s)
for i in {1..90}; do
  if curl -fs "$HEALTH_URL" | grep -q "UP"; then
    log "Service is healthy ✅"
    exit 0
  fi
  sleep 2
done

# ======================
# 7. ROLLBACK
# ======================
log "Health check failed ❌ → rolling back..."

if [[ -f "$BACKUP_JAR" ]]; then
  sudo cp "$BACKUP_JAR" "$CURRENT_JAR"
  sudo systemctl restart "$SERVICE_NAME"
  log "Rollback completed"
else
  fail "No backup available"
fi

fail "Deployment failed after rollback"