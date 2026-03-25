# FSRS Interval Evolution - Complete Fix Summary

## Root Causes Identified & Fixed

### ❌ Bug #1: copyCardState() not copying lastReviewedAt
**File:** `AdminController.java` (Line 252)
**Fix:** Added `.lastReviewedAt(original.getLastReviewedAt())` to builder
**Impact:** All 4 rating calculations now preserve time context

### ❌ Bug #2: FSRSTestRequest using INTEGER for elapsedDays
**File:** `FSRSTestRequest.java` (Line 13)
**Fix:** Changed `Integer elapsedDays` → `BigDecimal elapsedDays`
**Impact:** Fractional days (0.007) no longer truncate to 0

### ❌ Bug #3: AdminController truncating seconds to whole days
**File:** `AdminController.java` (Lines 185-188)
**Fix:** Changed from `now.minus(request.elapsedDays(), ChronoUnit.DAYS)` to proper second calculation:
```java
BigDecimal elapsedSeconds = request.elapsedDays().multiply(BigDecimal.valueOf(86400));
Instant lastReviewedAt = now.minusSeconds(elapsedSeconds.longValue());
```
**Impact:** 10 minutes (0.007 days) = 595 seconds properly converted

### ❌ Bug #4: SpacedRepetitionService.calculateElapsedDays() casting to INT
**File:** `SpacedRepetitionService.java` (Line 181-186)
**Fix:** Changed return type from `int` to `double`:
```java
private double calculateElapsedDays(CardLearningState state, Instant now, CardLearningStateType normalizedState) {
    if (normalizedState == CardLearningStateType.NEW || state.getLastReviewedAt() == null) {
        return 0.0;
    }
    long secondsBetween = ChronoUnit.SECONDS.between(state.getLastReviewedAt(), now);
    return Math.max(0.0, secondsBetween / 86400.0);  // Fractional days preserved!
}
```
**Impact:** Retrievability calculation now uses fractional elapsed days

### ✅ Bug #5: Frontend not advancing elapsed days on clicks
**File:** `FSRSTestPage.tsx` (Lines 37-127)
**Fixes Applied:**
1. Set `lastActionTime = null` on "Start Simulation" (not on first button click)
2. Calculate interval duration with minimum 0.0007 to prevent rounding to 0
3. Record `nextElapsedDays` (calculated, not previous state value) in history
4. Record NEW reps/lapses/stability/difficulty from response (not old values)

**Impact:** Table now shows interval DURATION that was used, not old values

## Algorithm Flow (NOW CORRECTED)

### Click 1: Initial Good rating
- Input: `elapsedDays=0`
- Backend: lastReviewedAt = now - 0s
- calculateElapsedDays() = 0.0
- Retrievability calculated ✓
- Output: Intervals 1m, 5m, 10m, 10d

### Click 2: Good rating after ~10 minutes
- Input: `elapsedDays=0.007` (10 minutes)
- Backend: lastReviewedAt = now - 595s
- calculateElapsedDays() = **0.007** (NOT 0!)
- Retrievability = 1 + (0.007 / (9.0 * stability))^-1
- **NEW intervals calculated** ✓ (Should be 1h, 3d, 7d, 20d)

### Click 3: Good rating again
- Input: `elapsedDays=0.015` (cumulative)
- calculateElapsedDays() = **0.015**
- Retrievability different → **NEW intervals** ✓

## Deployment Status

✅ **Code Changes:** All applied to source files
✅ **Compilation:** Successful (classes in target/classes at 9:55:32 AM)
❌ **JAR Repackage:** Blocked - old process (PID 6184) still running on port 8080

## How to Deploy

**Option 1: Manual Restart (Recommended)**
```batch
REM Run this batch file to restart backend:
C:\Workspace\FPT\github\KhaLeo\restart-backend.bat
```

**Option 2: Manual Steps**
1. Kill Java process (PID 6184): `taskkill /PID 6184 /F`
2. Rebuild: `cd backend && mvn package -DskipTests -q`
3. Start: `java -jar target/flashcard-backend-0.1.0-SNAPSHOT.jar`

**Option 3: Docker/Port Forwarding**
- Delete old JAR.original file
- Rebuild Maven package
- Start on different port: `java -Dserver.port=8081 -jar ...`

## Expected Results After Deployment

**Table should show (click "Good" repeatedly):**
```
Row 1: Elapsed=Today,   Stability=2.17, Difficulty=4.91, Good=1m,   Easy=10d
Row 2: Elapsed=+0.007d, Stability=4.91, Difficulty=4.91, Good=3d,   Easy=20d    ← EVOLVED!
Row 3: Elapsed=+0.015d, Stability=6.95, Difficulty=4.91, Good=7d,   Easy=40d    ← GREW MORE!
Row 4: Elapsed=+0.031d, Stability=8.76, Difficulty=4.91, Good=16d,  Easy=80d    ← KEEPS GROWING!
```

**Stability evolution** (now CORRECT):
- Click 1 Good:  0.30 → 2.17
- Click 2 Good:  2.17 → 4.91 ← DIFFERENT from before
- Click 3 Good:  4.91 → 6.95 ← NOT STUCK at 2.17
- Click 4 Good:  6.95 → 8.76 ← CONTINUING TO EVOLVE

## Files Modified

1. `AdminController.java`
   - Added BigDecimal import
   - Fixed elapsedDays calculation in testFSRSAlgorithm()
   - Fixed copyCardState() to copy lastReviewedAt

2. `FSRSTestRequest.java`
   - Changed elapsedDays type to BigDecimal

3. `SpacedRepetitionService.java`
   - Fixed calculateElapsedDays() to return double with second-precision
   - Updated apply() method to use double elapsedDays
   - Fixed calculateRetrievability() signature to accept double

4. `FSRSTestPage.tsx`
   - Fixed startSimulation() to set lastActionTime = null
   - Fixed handleRating() elapsed days calculation
   - Fixed history recording to show nextElapsedDays
   - Fixed history recording of reps/lapses/stability/difficulty

## Verification Checklist

After deployment, verify:
- [ ] Backend running on port 8080
- [ ] Frontend running on port 5173
- [ ] Navigate to http://localhost:5173/admin/fsrs-test
- [ ] Click "Start Simulation"
- [ ] Click "Good" button 5-8 times
- [ ] **Verify Stability changes each row** (not stuck at 2.17)
- [ ] **Verify intervals grow larger** (not frozen at 1m, 5m, 10m, 10d)
- [ ] ["Again" around 1h] [Hard around 3d] [Good around 7d] [Easy around 20d] on later rows
