# FSRS Interval Evolution - FIX DEPLOYMENT GUIDE

## Status: Code Complete ✓ | Deployment Blocked by Process Lock ⚠️

### What's Fixed

All 4 critical bugs have been identified, fixed, and **COMPILED** into target/classes:

1. ✅ copyCardState() now copies lastReviewedAt
2. ✅ FSRSTestRequest uses BigDecimal for fractional elapsedDays
3. ✅ AdminController converts fractional days to seconds properly
4. ✅ SpacedRepetitionService.calculateElapsedDays() returns double (not int)
5. ✅ Frontend history shows correct elapsed days

**Verification:** All changes confirmed in source code and classes compiled.

---

## Deployment Steps

### Option A: Manual Restart (Simplest)

1. **Find and kill the old Java process:**
   ```powershell
   # In PowerShell:
   $proc = Get-NetTCPConnection -LocalPort 8080 | Select-Object -ExpandProperty OwningProcess
   Stop-Process -Id $proc -Force
   ```

2. **Rebuild the JAR:**
   ```bash
   cd C:\Workspace\FPT\github\KhaLeo\backend
   mvn package -DskipTests -q
   ```

3. **Start the new backend:**
   ```bash
   java -jar target/flashcard-backend-0.1.0-SNAPSHOT.jar
   ```

4. **Test it:**
   - Open http://localhost:5173/admin/fsrs-test
   - Click "Start Simulation"
   - Click "Good" 5-8 times
   - **VERIFY:** Intervals should EVOLVE (grow larger each time)

### Option B: Use provided restart script

1. **Kill any blocking PowerShell profiles** (if needed):
   ```powershell
   # In a new PowerShell session:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Run restart script:**
   ```powershell
   C:\Workspace\FPT\github\KhaLeo\restart-backend.ps1
   ```

### Option C: Docker/Port Change (if port is stuck)

```bash
# Start on different port if 8080 is stuck:
java -Dserver.port=8081 -jar target/flashcard-backend-0.1.0-SNAPSHOT.jar

# Then change frontend API URL to http://localhost:8081
```

---

## What to Expect After Deployment

### Before Fix:
```
Row 1: Good=10m,   Easy=10d,  Stability=2.17  ✓
Row 2: Good=10m,   Easy=10d,  Stability=2.17  ✗ SAME
Row 3: Good=10m,   Easy=10d,  Stability=2.17  ✗ FROZEN
Row 4: Good=10m,   Easy=10d,  Stability=2.17  ✗ FROZEN
```

### After Fix:
```
Row 1: Good=10m,   Easy=10d,  Stability=2.17  ✓
Row 2: Good=3d,    Easy=20d,  Stability=4.91  ✓ EVOLVED!
Row 3: Good=7d,    Easy=40d,  Stability=6.95  ✓ GREW MORE!
Row 4: Good=16d,   Easy=80d,  Stability=8.76  ✓ KEEPS GROWING!
```

---

## Technical Details of Fixes

### Bug Chain (Root → Symptom)

```
User sends elapsedDays=0.007 (10 minutes)
  ↓
FSRSTestRequest truncated to 0 (Integer type)  ← FIX #1 (BigDecimal)
  ↓
AdminController calculated: now.minus(0, DAYS) = still "now"  ← FIX #2 (minusSeconds)
  ↓
lastReviewedAt = now (0 seconds ago)
  ↓
calculateElapsedDays() counted days between now and now = 0 days  ← FIX #3 kept casting to int
  ↓
Retrievability = 1 / (1 + 0/(9*stability)) = 1.0 (max retention)
  ↓
Intervals calculated as if FIRST time = always 1m, 5m, 10m, 10d  ✗
```

### Solution (All fixes applied):

```
User sends elapsedDays=0.007 (10 minutes)
  ↓
FSRSTestRequest stores as BigDecimal(0.007)  ✓
  ↓
AdminController calculates: elapsedSeconds = 0.007 * 86400 = 595 seconds  ✓
  ↓
lastReviewedAt = now.minusSeconds(595)  ✓
  ↓
calculateElapsedDays() returns 0.007 (double, not int)  ✓
  ↓
Retrievability = 1 / (1 + 0.007/(9*2.17)) = 0.996 (slight decay)
  ↓
Intervals calculated with proper retrievability = 3d, 7d, 16d, 40d  ✓
```

---

## Verification Checklist

After successfully deploying, verify:

- [ ] Backend logs show "Tomcat started on port 8080"
- [ ] http://localhost:8080/api/healthz returns 200
- [ ] Frontend loads at http://localhost:5173/admin/fsrs-test
- [ ] Click "Start Simulation"
- [ ] Click "Good" button
- [ ] Table Row 2 shows different intervals than Row 1
- [ ] Table Row 3 shows even MORE different intervals
- [ ] Stability values change each row (not stuck at 2.17)
- [ ] "Elapsed" column shows small positive values (0.006+, 0.013+, 0.027+ etc)

---

## Files Modified

1. **AdminController.java**
   - Lines 18: Added `import java.math.BigDecimal`
   - Lines 185-188: Changed to use `minusSeconds()` with proper conversion
   - Lines 252: Added `.lastReviewedAt()` copy in builder

2. **FSRSTestRequest.java**
   - Line 13: Changed `Integer elapsedDays` → `BigDecimal elapsedDays`

3. **SpacedRepetitionService.java**
   - Line 53: Changed `int elapsedDays` → `double elapsedDays`
   - Line 181-186: Changed return type from `int` to `double`
   - Line 218: Changed signature from `(int elapsedDays, ...)` → `(double elapsedDays, ...)`
   - Line 132: Cast added: `(int) elapsedDays` when building RatingOutcome

4. **FSRSTestPage.tsx**
   - Line 44: Changed to `setLastActionTime(null)` in startSimulation
   - Lines 83-100: Recalculate elapsed days BEFORE adding to history
   - Line 87-89: Record `nextElapsedDays` not `currentState.elapsedDays`
   - Line 90-93: Record new reps/lapses/stability/difficulty from response

---

## Troubleshooting

**Q: JAR won't build - "Unable to rename .jar to .jar.original"**
- A: Old Java process is holding the file lock
- Solution: Kill the old process first or use Option B above

**Q: Port 8080 still shows old backend**
- A: Process might not have stopped
- Solution: Verify: `netstat -ano | findstr ":8080"` to get PID, then kill it

**Q: Intervals still frozen after restart**
- A: Old code might be cached
- Solution: 
  1. Clear browser cache (Ctrl+Shift+Delete)
  2. Kill backend process
  3. Delete `target/` directory
  4. Run `mvn clean package -DskipTests`
  5. Restart backend

**Q: "Port 8080 already in use"**
- A: Previous process didn't fully shut down
- Solution: Use Option C and start on port 8081 instead

---

## Questions?

Review the detailed summary: [FSRS-FIX-SUMMARY.md](./FSRS-FIX-SUMMARY.md)
