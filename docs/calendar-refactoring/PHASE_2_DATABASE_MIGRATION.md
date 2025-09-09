# Phase 2: Database Migration

**Duration**: 45 minutes  
**Priority**: CRITICAL - Required for performance optimization

## Objective

Apply database optimizations including new indexes, BRIN indexes for large datasets, and atomic functions for conflict-free operations.

## Prerequisites

- Phase 1 completed successfully
- Supabase CLI installed (`npm install -g supabase`)
- Database connection configured
- Backup of production database (if applicable)

## Implementation Steps

### 1. Review Migration File (10 minutes)

Review the migration at: `/Users/corywilliams/Hemsy/supabase/migrations/004_optimize_appointment_indexes.sql`

Key changes:

- Optimized composite indexes for time-range queries
- BRIN index for datasets over 100k records
- Atomic appointment creation with conflict detection
- Efficient query functions

### 2. Run Migration in Development (15 minutes)

```bash
# Navigate to project root
cd "/Users/corywilliams/Hemsy"

# Check migration status
npx supabase migration list

# Apply the migration
npx supabase migration up

# Or apply specific migration
npx supabase db push --file supabase/migrations/004_optimize_appointment_indexes.sql
```

### 3. Verify Index Creation (10 minutes)

Connect to database and verify:

```sql
-- Check all indexes on appointments table
SELECT
    indexname,
    indexdef,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes
WHERE tablename = 'appointments'
ORDER BY indexname;

-- Verify the key indexes exist
SELECT COUNT(*) FROM pg_indexes
WHERE tablename = 'appointments'
AND indexname IN (
    'idx_appointments_shop_date_time',
    'idx_appointments_shop_month',
    'idx_appointments_active',
    'idx_appointments_date_brin'
);
-- Should return 4
```

### 4. Test New Functions (10 minutes)

```sql
-- Test time-range query function
SELECT COUNT(*) FROM get_appointments_time_range(
    (SELECT id FROM shops LIMIT 1)::uuid,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 days',
    false
);

-- Test appointment counts function
SELECT * FROM get_appointment_counts_by_date(
    (SELECT id FROM shops LIMIT 1)::uuid,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '30 days'
) LIMIT 10;

-- Test atomic creation (should fail with conflict)
-- First, find an existing appointment
WITH existing AS (
    SELECT shop_id, date, start_time, end_time
    FROM appointments
    WHERE status = 'scheduled'
    LIMIT 1
)
SELECT create_appointment_atomic(
    shop_id,
    NULL,
    'Test Conflict',
    date,
    start_time,
    end_time,
    'consultation',
    'This should fail'
) FROM existing;
```

### 5. Analyze Table Statistics (5 minutes)

```sql
-- Update table statistics for query planner
ANALYZE appointments;

-- Check table stats
SELECT
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE tablename = 'appointments';
```

## Files Modified

- Database schema updated with new indexes
- New database functions added:
  - `create_appointment_atomic()`
  - `get_appointments_time_range()`
  - `get_appointment_counts_by_date()`

## Verification Checklist

- [ ] Migration applied successfully
- [ ] All 6 new indexes created
- [ ] BRIN index created for large datasets
- [ ] Database functions created and working
- [ ] No errors in migration output
- [ ] Query performance improved (test with EXPLAIN ANALYZE)

## Performance Testing

Run these queries to verify index usage:

```sql
-- Should use idx_appointments_shop_date_time
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
AND status NOT IN ('cancelled', 'no_show')
ORDER BY date, start_time;

-- Should use idx_appointments_shop_month
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM appointments
WHERE shop_id = (SELECT id FROM shops LIMIT 1)
AND date BETWEEN DATE_TRUNC('month', CURRENT_DATE)
    AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
AND status NOT IN ('cancelled', 'no_show');
```

## Success Criteria

- All indexes created and being used by query planner
- Query execution time < 100ms for month views
- Atomic functions prevent double-booking
- No performance degradation on existing queries

## Rollback Plan

If issues occur:

```sql
-- Rollback migration
DROP FUNCTION IF EXISTS create_appointment_atomic CASCADE;
DROP FUNCTION IF EXISTS get_appointments_time_range CASCADE;
DROP FUNCTION IF EXISTS get_appointment_counts_by_date CASCADE;

-- Restore original indexes
DROP INDEX IF EXISTS idx_appointments_shop_date_time;
DROP INDEX IF EXISTS idx_appointments_shop_month;
DROP INDEX IF EXISTS idx_appointments_shop_client_date;
DROP INDEX IF EXISTS idx_appointments_active;
DROP INDEX IF EXISTS idx_appointments_date_brin;
DROP INDEX IF EXISTS idx_appointments_status_date;

-- Recreate original indexes
CREATE INDEX idx_appointments_shop_date ON appointments(shop_id, date);
```

## Next Phase

Once database is optimized, proceed to Phase 3: React Query Integration

## Notes for Implementation Agent

- Run migration during low-traffic period if on production
- Monitor database CPU and memory during migration
- Keep connection pool settings in mind
- BRIN indexes are crucial for 100k+ record performance
