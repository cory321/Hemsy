-- PHASE 2: FIXED VERIFICATION QUERIES
-- Run these queries to verify the migration was applied successfully

-- ========================================
-- 1. QUICK SUMMARY CHECK
-- ========================================
SELECT 
    'Indexes Created' as item,
    COUNT(*) as count,
    '6 expected' as notes
FROM pg_indexes
WHERE tablename = 'appointments'
AND indexname LIKE 'idx_appointments%'
UNION ALL
SELECT 
    'Functions Created' as item,
    COUNT(*) as count,
    '3 expected' as notes
FROM pg_proc
WHERE proname IN ('create_appointment_atomic', 'get_appointments_time_range', 'get_appointment_counts_by_date');

-- ========================================
-- 2. DETAILED INDEX LIST
-- ========================================
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'appointments'
ORDER BY indexname;

-- ========================================
-- 3. TEST FUNCTIONS (WITH PROPER TYPE CASTING)
-- ========================================

-- Test time-range function
SELECT COUNT(*) as appointments_in_range 
FROM get_appointments_time_range(
    (SELECT id FROM shops LIMIT 1)::uuid,
    (CURRENT_DATE - INTERVAL '7 days')::date,  -- Cast to date
    (CURRENT_DATE + INTERVAL '7 days')::date,   -- Cast to date
    false
);

-- Test appointment counts function  
SELECT * FROM get_appointment_counts_by_date(
    (SELECT id FROM shops LIMIT 1)::uuid,
    (CURRENT_DATE - INTERVAL '3 days')::date,  -- Cast to date
    (CURRENT_DATE + INTERVAL '3 days')::date    -- Cast to date
)
ORDER BY date;

-- Test with specific date literals (alternative if above still fails)
SELECT COUNT(*) as appointments_this_month
FROM get_appointments_time_range(
    (SELECT id FROM shops LIMIT 1)::uuid,
    '2025-01-01'::date,
    '2025-01-31'::date,
    false
);

-- ========================================
-- 4. CHECK QUERY PERFORMANCE
-- ========================================

-- This should show it's using idx_appointments_shop_date_time
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
AND status NOT IN ('cancelled', 'no_show');

-- Check if BRIN index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'appointments' 
AND indexname = 'idx_appointments_date_brin';

-- ========================================
-- 5. VALIDATE ATOMIC FUNCTION
-- ========================================

-- Check if function exists and see its signature
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'create_appointment_atomic';

-- ========================================
-- EXPECTED RESULTS SUMMARY:
-- ========================================
-- ✅ Indexes: 6 indexes starting with 'idx_appointments_'
-- ✅ Functions: 3 functions created
-- ✅ BRIN index: idx_appointments_date_brin exists
-- ✅ Query plan: Should show index usage
-- ✅ Functions: Should return results without errors