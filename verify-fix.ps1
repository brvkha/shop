#!/bin/bash
# Verify FSRS backend is working correctly

echo "=== FSRS Backend Verification ==="
echo ""

# Check if port 8080 is listening
echo "1. Checking if backend is running on port 8080..."
netstat -ano | findstr ":8080" -q
if ($?) {
    echo "   ✓ Port 8080 is listening (backend is RUNNING)"
} else {
    echo "   ✗ Port 8080 is NOT listening (backend not running)"
    exit 1
}

echo ""
echo "2. Checking backend health endpoint..."
$response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -Method GET -ErrorAction SilentlyContinue 2>$null
if ($response.StatusCode -eq 200) {
    echo "   ✓ Backend is responding"
} else {
    echo "   ✗ Backend not responding"
}

echo ""
echo "3. Verifying frontend is running on port 5173..."
netstat -ano | findstr ":5173" -q
if ($?) {
    echo "   ✓ Frontend is running"
} else {
    echo "   ✗ Frontend not running"
}

echo ""
echo "=== How to Test ==="
echo "1. Open http://localhost:5173/admin/fsrs-test"
echo "2. Click 'Start Simulation'"
echo "3. Click 'Good' button 5-8 times"
echo "4. Check the table:"
echo "   ✓ SHOULD SEE: Intervals grow (1m → 3d → 7d → 16d)"
echo "   ✗ BUG IF: Intervals frozen (all 1m, 5m, 10m, 10d)"
echo ""
echo "Expected results:"
echo "  Row 1: Stability 2.17, Good=10m,  Easy=10d"
echo "  Row 2: Stability 4.91, Good=3d,   Easy=20d  ← Different!"
echo "  Row 3: Stability 6.95, Good=7d,   Easy=40d  ← Even more different!"
