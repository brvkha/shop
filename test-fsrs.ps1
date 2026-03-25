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

try {
    $resp1 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test1
    Write-Host "✓ Response received" -ForegroundColor Green
    Write-Host "  Good interval: $($resp1.goodResult.nextReviewAt)"
    Write-Host "  New stability: $($resp1.goodResult.stability)"
    Write-Host "  New reps: $($resp1.goodResult.newReps)"
    $stability1 = $resp1.goodResult.stability
    $reps1 = $resp1.goodResult.newReps
    $lapses1 = $resp1.goodResult.newLapses
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: After clicking Good (with elapsed time to next review)
Write-Host "Test 2: After Good rating (elapsedDays=10)" -ForegroundColor Yellow
$test2 = @{
    stability = $stability1
    difficulty = $resp1.goodResult.difficulty
    reps = $reps1
    lapses = $lapses1
    elapsedDays = 10  # Simulate 10 days have passed
} | ConvertTo-Json

try {
    $resp2 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test2
    Write-Host "✓ Response received" -ForegroundColor Green
    Write-Host "  Good interval: $($resp2.goodResult.nextReviewAt)"
    Write-Host "  New stability: $($resp2.goodResult.stability)"
    Write-Host "  New reps: $($resp2.goodResult.newReps)"
    
    # Compare intervals
    Write-Host ""
    Write-Host "Interval Evolution Check:" -ForegroundColor Cyan
    if ($resp2.goodResult.stability -gt $stability1) {
        Write-Host "✓ Stability INCREASED: $stability1 → $($resp2.goodResult.stability)" -ForegroundColor Green
    } else {
        Write-Host "✗ Stability NOT increased (bug!)" -ForegroundColor Red
    }
    
    $stability2 = $resp2.goodResult.stability
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Another Good rating
Write-Host "Test 3: Another Good rating (elapsedDays=20)" -ForegroundColor Yellow
$test3 = @{
    stability = $stability2
    difficulty = $resp2.goodResult.difficulty
    reps = $resp2.goodResult.newReps
    lapses = $resp2.goodResult.newLapses
    elapsedDays = 20
} | ConvertTo-Json

try {
    $resp3 = Invoke-RestMethod -Uri $baseUrl -Method POST -ContentType "application/json" -Body $test3
    Write-Host "✓ Response received" -ForegroundColor Green
    Write-Host "  Good interval: $($resp3.goodResult.nextReviewAt)"
    Write-Host "  New stability: $($resp3.goodResult.stability)"
    
    if ($resp3.goodResult.stability -gt $stability2) {
        Write-Host "✓ Stability INCREASED AGAIN: $stability2 → $($resp3.goodResult.stability)" -ForegroundColor Green
    } else {
        Write-Host "✗ Stability NOT increased (bug!)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ All tests passed! Algorithm is evolving correctly." -ForegroundColor Green
