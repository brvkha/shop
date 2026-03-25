# Restart backend with FSRS fixes
# Run this script to deploy the fixed backend

Write-Host "=== FSRS Fix Deployment ===" -ForegroundColor Cyan

# Get Java process on port 8080
$javaProcesses = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($javaProcesses) {
    $pid = $javaProcesses | Select-Object -First 1
    Write-Host "Stopping old backend (PID: $pid)..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Building new JAR..." -ForegroundColor Yellow
cd C:\Workspace\FPT\github\KhaLeo\backend

# Try to remove lock first
if (Test-Path "target\flashcard-backend-0.1.0-SNAPSHOT.jar.original") {
    Remove-Item -Force "target\flashcard-backend-0.1.0-SNAPSHOT.jar.original" -ErrorAction SilentlyContinue
}

# Build
mvn package -DskipTests -q

# Wait for build
Start-Sleep -Seconds 2

Write-Host "Starting new backend..." -ForegroundColor Green
java -jar target\flashcard-backend-0.1.0-SNAPSHOT.jar

Write-Host ""
Write-Host "Backend started! Navigate to http://localhost:5173/admin/fsrs-test" -ForegroundColor Green
