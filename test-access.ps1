#!/usr/bin/env powershell
# Test infrastructure access

Write-Host "=== Checking Route53 Records ===" -ForegroundColor Cyan
aws route53 list-resource-record-sets --hosted-zone-id Z09479913APS5DRNMZYZ3 --output json | `
  jq '.ResourceRecordSets[] | select(.Name | contains("khaleoshop.click")) | {Name: .Name, Type: .Type, Target: (.AliasTarget.DNSName // .ResourceRecords[0].Value)}'

Write-Host "`n=== Testing Frontend Access ===" -ForegroundColor Cyan
$frontend = "https://khaleoshop.click/"
Write-Host "Testing: $frontend"
try {
  $response = Invoke-WebRequest -Uri $frontend -UseBasicParsing -TimeoutSec 10
  Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
  Write-Host "Content-Type: $($response.Headers['Content-Type'])"
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Backend Access ===" -ForegroundColor Cyan
$backend = "https://api.khaleoshop.click/actuator/health"
Write-Host "Testing: $backend"
try {
  $response = Invoke-WebRequest -Uri $backend -UseBasicParsing -TimeoutSec 10
  Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
  $body = $response.Content | ConvertFrom-Json
  Write-Host "Health Status: $($body.status)"
} catch {
  Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Checking S3 Bucket Policy ===" -ForegroundColor Cyan
aws s3api get-bucket-policy --bucket khaleo-frontend-prod | jq '.Policy | fromjson'
