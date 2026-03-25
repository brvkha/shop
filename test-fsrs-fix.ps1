#!/usr/bin/env pwsh

# Test script to verify FSRS interval evolution fix
# Tests that intervals grow with consecutive Good ratings

$token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZjZlZTJhZi02YzA5LTQwY2UtYmFjMS00NzI1YzgwNDA1MjUiLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE3NDU0Mjk2MzUsImV4cCI6MTc0NTUxNjAzNX0.EQa3rGFB_M16OEvCXB0TqhyDeBhM3l6gKLPWGDdCWAo"

$url = "http://localhost:8080/api/admin/test-fsrs-algorithm"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Test sequence: simulate 5 Good ratings with increasing elapsed days
$tests = @(
    @{ stability = 0.3; difficulty = 5.8; reps = 0; lapses = 0; elapsedDays = 0; name = "First (new card)" },
    @{ stability = 2.17; difficulty = 4.91; reps = 1; lapses = 0; elapsedDays = 0.007; name = "After 1st Good (~10m elapsed)" },
    @{ stability = 4.91; difficulty = 4.91; reps = 2; lapses = 0; elapsedDays = 0.069; name = "After 2nd Good (~1h elapsed)" },
    @{ stability = 6.95; difficulty = 4.91; reps = 3; lapses = 0; elapsedDays = 0.5; name = "After 3rd Good (~12h elapsed)" },
    @{ stability = 8.76; difficulty = 4.91; reps = 4; lapses = 0; elapsedDays = 1.0; name = "After 4th Good (~1d elapsed)" }
)

Write-Host "Testing FSRS Interval Evolution Fix`n" -ForegroundColor Cyan

foreach ($test in $tests) {
    $body = @{
        stability = $test.stability
        difficulty = $test.difficulty
        reps = $test.reps
        lapses = $test.lapses
        elapsedDays = $test.elapsedDays
    } | ConvertTo-Json

    Write-Host "Test: $($test.name)" -ForegroundColor Yellow
    Write-Host "Sending: elapsedDays=$($test.elapsedDays)" -ForegroundColor Gray

    try {
        $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
        
        # Extract interval values (in minutes or days)
        $goodInterval = $response.goodResult.nextReviewAt
        $easyInterval = $response.easyResult.nextReviewAt

        # Calculate hours/days from ISO timestamp
        $now = [DateTime]::UtcNow
        $goodTime = [DateTime]::Parse($goodInterval)
        $easyTime = [DateTime]::Parse($easyInterval)
        
        $goodMinsDiff = ($goodTime - $now).TotalMinutes
        $easyDaysDiff = ($easyTime - $now).TotalDays

        Write-Host "  Good interval: $([Math]::Round($goodMinsDiff))m (~$([Math]::Round($goodMinsDiff/60, 1))h)" -ForegroundColor Green
        Write-Host "  Easy interval: $([Math]::Round($easyDaysDiff * 24))h (~$([Math]::Round($easyDaysDiff, 1))d)" -ForegroundColor Blue
        Write-Host ""
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "✓ Test complete" -ForegroundColor Cyan
Write-Host "If intervals grow (Good: 10m→1h→12h→1d+ and Easy: 10d→20d+), the fix is working!" -ForegroundColor Green
