#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_URI="${1:-}"
SERVICE_NAME="${2:-flashcard-backend}"
TARGET_JAR_PATH="${3:-/opt/khaleo/flashcard-backend/app.jar}"
RUNTIME_ENV_PATH="${RUNTIME_ENV_PATH:-/opt/khaleo/flashcard-backend/runtime-secrets.env}"
DB_SECRET_ID="${DB_SECRET_ID:-}"
JWT_SECRET_ID="${JWT_SECRET_ID:-}"
SES_SECRET_ID="${SES_SECRET_ID:-}"

if [[ -z "${ARTIFACT_URI}" ]]; then
  echo "Usage: deploy-via-ssm.sh <s3://bucket/key> [service-name] [target-jar-path]" >&2
  exit 1
fi

sudo mkdir -p "$(dirname "${TARGET_JAR_PATH}")"

fetch_secret() {
  local secret_id="$1"
  if [[ -z "${secret_id}" ]]; then
    return 0
  fi
  aws secretsmanager get-secret-value --secret-id "${secret_id}" --query SecretString --output text
}

write_runtime_env() {
  local db_secret jwt_secret ses_secret
  db_secret="$(fetch_secret "${DB_SECRET_ID}")"
  jwt_secret="$(fetch_secret "${JWT_SECRET_ID}")"
  ses_secret="$(fetch_secret "${SES_SECRET_ID}")"

  sudo install -d -m 0755 "$(dirname "${RUNTIME_ENV_PATH}")"
  {
    echo "# Generated during deploy at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    [[ -n "${db_secret}" ]] && echo "DB_CREDENTIALS_JSON=${db_secret}"
    [[ -n "${jwt_secret}" ]] && echo "JWT_SECRET_VALUE=${jwt_secret}"
    [[ -n "${ses_secret}" ]] && echo "SES_CREDENTIALS_JSON=${ses_secret}"
  } | sudo tee "${RUNTIME_ENV_PATH}" >/dev/null
}

write_runtime_env
sudo aws s3 cp "${ARTIFACT_URI}" "${TARGET_JAR_PATH}"
sudo systemctl daemon-reload
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl is-active --quiet "${SERVICE_NAME}"
echo "Deployment completed for ${SERVICE_NAME} using ${ARTIFACT_URI}"