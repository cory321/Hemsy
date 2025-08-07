# Troubleshooting Calendar Navigation

## Issue: Appointments Not Loading on Next Month Click

### Debug Steps

1. **Open Browser Console** (F12)
   - Look for the "🔍 Calendar Debug Info" group
   - Check for any red error messages
   - Look for "📡 Query update" logs when clicking next month

2. **Check Network Tab**
   - Filter by "time-range"
   - Click next month
   - Should see a request to `/api/appointments/time-range`
   - Check the response - is it 200 OK?

3. **React Query DevTools**
   - Look for the floating React Query logo (bottom right)
   - Click it to open DevTools
   - Find queries starting with ['appointments', 'timeRange']
   - Check their status (success/error/loading)

### Common Issues & Fixes

#### 1. Import Path Issue

✅ **Fixed** - Already updated to use `appointments-refactored.ts`

#### 2. Missing Shop ID

Check console for "Shop ID: undefined"

- Verify shopId is being passed from page.tsx

#### 3. Date Calculation Issue

The navigation sets date to 1st before changing month to avoid overflow

#### 4. API Route Not Working

Check if you see network requests when navigating

### Quick Fix Checklist

1. **Restart Dev Server**

   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Browser Cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Check Console Output**
   The debug component will log:
   - React Query setup status
   - All appointment queries in cache
   - Query updates as they happen
   - Any errors

### What to Look For

When you click "Next Month", you should see:

1. A "📡 Query update" log with status: "loading"
2. A network request to `/api/appointments/time-range`
3. Another "📡 Query update" log with status: "success"
4. The calendar should update with new appointments

### If Still Not Working

1. **Check the API directly:**

   ```bash
   # In a new terminal, replace with your actual values
   curl "http://localhost:3000/api/appointments/time-range?shopId=YOUR_SHOP_ID&startDate=2024-02-01&endDate=2024-02-29"
   ```

2. **Verify Database Migration:**

   ```sql
   -- Check if the function exists
   SELECT proname FROM pg_proc WHERE proname = 'get_appointments_time_range';
   ```

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard
   - Check API logs for errors

### Temporary Workaround

If you need to continue development while debugging:

1. Comment out the CalendarDebug component
2. Check if appointments load on initial page load
3. If yes, the issue is with navigation state updates

Let me know what you see in the console!
