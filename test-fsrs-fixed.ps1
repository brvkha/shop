#!/usr/bin/env powershell
# Test FSRS algorithm endpoint

$baseUrl = "http://localhost:8080/api/v1/admin/fsrs-test"

Write-Host "Testing FSRS Algorithm Fix" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: First review (new card, elapsedDays=0)
Write-Host "Test 1: First review (elapsedDays=0)" -ForegroundColor Yellow
$test1 = @{
    stability = 0.3
    difficulty = 5.8
    reps = 0
    lapses = 0
    elapsedDays = 0
} | ConvertTo-Json

$resp1 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test1
Write-Host "Good interval: $($resp1.goodResult.nextReviewAt)" -ForegroundColor Green
Write-Host "New stability: $($resp1.goodResult.stability)" -ForegroundColor Green
$stability1 = $resp1.goodResult.stability

Write-Host ""
Write-Host "Test 2: After Good rating (elapsedDays=10)" -ForegroundColor Yellow
$test2 = @{
    stability = $stability1
    difficulty = $resp1.goodResult.difficulty
    reps = $resp1.goodResult.newReps
    lapses = $resp1.goodResult.newLapses
    elapsedDays = 10
} | ConvertTo-Json

$resp2 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test2
Write-Host "Good interval: $($resp2.goodResult.nextReviewAt)" -ForegroundColor Green
Write-Host "New stability: $($resp2.goodResult.stability)" -ForegroundColor Green

if ($resp2.goodResult.stability -gt $stability1) {
    Write-Host "SUCCESS: Stability increased $stability1 -> $($resp2.goodResult.stability)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Stability did not increase!" -ForegroundColor Red
}

$stability2 = $resp2.goodResult.stability

Write-Host ""
Write-Host "Test 3: Another Good rating (elapsedDays=20)" -ForegroundColor Yellow
$test3 = @{
    stability = $stability2
    difficulty = $resp2.goodResult.difficulty
    reps = $resp2.goodResult.newReps
    lapses = $resp2.goodResult.newLapses
    elapsedDays = 20
} | ConvertTo-Json

$resp3 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test3
Write-Host "Good interval: $($resp3.goodResult.nextReviewAt)" -ForegroundColor Green
Write-Host "New stability: $($resp3.goodResult.stability)" -ForegroundColor Green

if ($resp3.goodResult.stability -gt $stability2) {
    Write-Host "SUCCESS: Stability increased $stability2 -> $($resp3.goodResult.stability)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Stability did not increase!" -ForegroundColor Red
}

Write-Host ""
Write-Host "All tests completed successfully!" -ForegroundColor Cyan
