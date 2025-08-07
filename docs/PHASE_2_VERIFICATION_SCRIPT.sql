-- PHASE 2 MIGRATION VERIFICATION SCRIPT  
-- Run these queries after applying the migration to verify everything worked
-- Execute each section separately to see results

-- ========================================
-- 1. CHECK ALL INDEXES WERE CREATED
-- ========================================
SELECT 
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'appointments'
ORDER BY indexname;

-- Verify the key indexes exist (should return 4)
SELECT COUNT(*) AS expected_4 FROM pg_indexes
WHERE tablename = 'appointments'
AND indexname IN (
    'idx_appointments_shop_date_time',
    'idx_appointments_shop_month',
    'idx_appointments_active',
    'idx_appointments_date_brin'
);

-- ========================================
-- 2. TEST TIME-RANGE QUERY FUNCTION
-- ========================================
-- Replace the shop_id with an actual shop ID from your database
SELECT COUNT(*) as appointment_count FROM get_appointments_time_range(
    (SELECT id FROM shops LIMIT 1)::uuid,  -- Uses first shop as example
    (CURRENT_DATE - INTERVAL '30 days')::date,
    (CURRENT_DATE + INTERVAL '30 days')::date,
    false  -- exclude cancelled
);

-- ========================================
-- 3. TEST APPOINTMENT COUNTS FUNCTION
-- ========================================
SELECT * FROM get_appointment_counts_by_date(
    (SELECT id FROM shops LIMIT 1)::uuid,
    (CURRENT_DATE - INTERVAL '7 days')::date,
    (CURRENT_DATE + INTERVAL '7 days')::date
) 
ORDER BY date DESC
LIMIT 10;

-- ========================================
-- 4. TEST ATOMIC CREATION (CONFLICT DETECTION)
-- ========================================
-- This should fail if there's already an appointment at this time
-- First, let's see existing appointments
SELECT 
    id,
    shop_id,
    date,
    start_time,
    end_time,
    status,
    title
FROM appointments
WHERE status = 'scheduled'
AND date >= CURRENT_DATE
ORDER BY date, start_time
LIMIT 5;

-- Try to create a conflicting appointment (this should fail)
-- Uncomment and modify with actual values from above query
/*
SELECT create_appointment_atomic(
    'your-shop-id'::uuid,
    NULL,
    'Test Conflict Detection',
    'date-from-above'::date,
    'start-time-from-above'::time,
    'end-time-from-above'::time,
    'consultation',
    'This should fail due to conflict'
);
*/

-- ========================================
-- 5. CHECK TABLE STATISTICS
-- ========================================
SELECT
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE tablename = 'appointments';

-- ========================================
-- 6. VERIFY INDEX USAGE WITH EXPLAIN
-- ========================================
-- This query should use idx_appointments_shop_date_time
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
AND status NOT IN ('cancelled', 'no_show')
ORDER BY date, start_time
LIMIT 10;

-- This query should use idx_appointments_shop_month
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN DATE_TRUNC('month', CURRENT_DATE)
    AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
AND status NOT IN ('cancelled', 'no_show');

-- ========================================
-- 7. PERFORMANCE BASELINE TEST
-- ========================================
-- Measure query performance for month view
EXPLAIN (ANALYZE, TIMING, BUFFERS)
SELECT 
    date,
    COUNT(*) as appointment_count
FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN DATE_TRUNC('month', CURRENT_DATE)
    AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
AND status IN ('scheduled', 'confirmed')
GROUP BY date
ORDER BY date;

-- ========================================
-- EXPECTED RESULTS:
-- ========================================
-- ✅ All 6 indexes should be created
-- ✅ BRIN index should exist for date column
-- ✅ Functions should execute without errors
-- ✅ Query execution time should be < 100ms for month views
-- ✅ EXPLAIN should show index usage
-- ✅ Conflict detection should prevent double-booking