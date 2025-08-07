# Phase 7: Production Deployment & Monitoring

**Duration**: 2-3 hours (staged over several days)  
**Priority**: CRITICAL - Production rollout

## Objective

Safely deploy the refactored calendar system to production with monitoring, rollback plan, and gradual rollout strategy.

## Prerequisites

- All previous phases completed successfully
- All tests passing
- Performance metrics verified
- Backup of production database taken

## Implementation Steps

### 1. Pre-Deployment Checklist (30 minutes)

```bash
# Verify all tests pass
npm test
npm run test:e2e

# Build production bundle
npm run build

# Check bundle size
npm run analyze

# Ensure no TypeScript errors
npm run type-check

# Lint check
npm run lint
```

Create deployment checklist:

- [ ] All tests passing
- [ ] No console errors in development
- [ ] Performance targets met
- [ ] Database backup completed
- [ ] Rollback plan documented
- [ ] Monitoring configured
- [ ] Team notified of deployment

### 2. Feature Flag Setup (20 minutes)

Add feature flag for gradual rollout:

```typescript
// src/lib/features/calendar-refactor-flag.ts
export const isCalendarRefactorEnabled = async (
  userId: string
): Promise<boolean> => {
  // Start with internal team
  const internalTeamIds = process.env.INTERNAL_TEAM_IDS?.split(',') || [];
  if (internalTeamIds.includes(userId)) {
    return true;
  }

  // Then beta users (10%)
  const betaRolloutPercentage = parseInt(
    process.env.CALENDAR_BETA_ROLLOUT || '0'
  );
  const userHash = hashUserId(userId);
  if (userHash % 100 < betaRolloutPercentage) {
    return true;
  }

  // Finally, check explicit feature flag
  return process.env.CALENDAR_REFACTOR_ENABLED === 'true';
};

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

Update AppointmentsClient to use flag:

```typescript
const refactorEnabled = await isCalendarRefactorEnabled(user.id);

return refactorEnabled ? (
  <CalendarWithQuery {...props} />
) : (
  <CalendarLegacy {...props} />
);
```

### 3. Database Migration - Production (30 minutes)

```bash
# Connect to production database
supabase db remote commit

# Review migration one more time
cat supabase/migrations/004_optimize_appointment_indexes.sql

# Apply migration during low traffic
supabase db push --dry-run
supabase db push

# Verify indexes created
supabase db query "SELECT indexname FROM pg_indexes WHERE tablename = 'appointments'"
```

Monitor during migration:

- Database CPU usage
- Query response times
- Application error rates

### 4. Deploy Application (30 minutes)

#### Stage 1: Internal Team (Day 1)

```bash
# Deploy with feature flag for internal only
INTERNAL_TEAM_IDS="user1,user2,user3" \
CALENDAR_REFACTOR_ENABLED="false" \
npm run deploy
```

Monitor for 24 hours:

- Check error logs
- Verify performance metrics
- Gather team feedback

#### Stage 2: Beta Users 10% (Day 3)

```bash
# Enable for 10% of users
CALENDAR_BETA_ROLLOUT="10" \
npm run deploy
```

Monitor for 48 hours:

- Error rate comparison
- Performance metrics
- User feedback via support

#### Stage 3: 50% Rollout (Day 7)

```bash
CALENDAR_BETA_ROLLOUT="50" \
npm run deploy
```

A/B test metrics:

- Page load times
- User engagement
- Error rates
- Support tickets

#### Stage 4: Full Rollout (Day 14)

```bash
CALENDAR_REFACTOR_ENABLED="true" \
npm run deploy
```

### 5. Production Monitoring Setup (40 minutes)

#### Application Monitoring

```typescript
// src/lib/monitoring/calendar-production-metrics.ts
import * as Sentry from '@sentry/nextjs';

export function initCalendarMonitoring() {
  // Track performance
  Sentry.addGlobalEventProcessor((event) => {
    if (event.transaction?.includes('/appointments')) {
      event.contexts = {
        ...event.contexts,
        calendar: {
          refactored: true,
          view: getCalendarView(),
          appointmentCount: getAppointmentCount(),
        },
      };
    }
    return event;
  });

  // Custom metrics
  if (typeof window !== 'undefined') {
    // Track cache performance
    setInterval(() => {
      const metrics = collectReactQueryMetrics();
      Sentry.captureMessage('Calendar Metrics', {
        extra: metrics,
        level: 'info',
      });
    }, 60000); // Every minute
  }
}
```

#### Database Monitoring

```sql
-- Create monitoring views
CREATE VIEW calendar_query_performance AS
SELECT
  date_trunc('minute', query_start) as minute,
  COUNT(*) as query_count,
  AVG(duration) as avg_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration) as p95_duration_ms,
  MAX(duration) as max_duration_ms
FROM pg_stat_statements
WHERE query LIKE '%appointments%'
  AND query_start > NOW() - INTERVAL '1 hour'
GROUP BY 1
ORDER BY 1 DESC;

-- Alert on slow queries
CREATE OR REPLACE FUNCTION alert_slow_calendar_queries()
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM calendar_query_performance
    WHERE p95_duration_ms > 100
    AND minute > NOW() - INTERVAL '5 minutes'
  ) THEN
    -- Send alert (implement your alerting mechanism)
    RAISE NOTICE 'Slow calendar queries detected';
  END IF;
END;
$$ LANGUAGE plpgsql;
```

#### Dashboard Setup

Create monitoring dashboard with:

- Query response times (p50, p95, p99)
- Cache hit rates
- Error rates by endpoint
- Memory usage trends
- User navigation patterns

### 6. Rollback Plan (20 minutes)

Document rollback procedure:

```bash
# 1. Immediate rollback (< 5 minutes)
CALENDAR_REFACTOR_ENABLED="false" npm run deploy

# 2. Code rollback if needed
git revert <commit-hash>
npm run deploy

# 3. Database rollback (if absolutely necessary)
-- This is destructive, only if critical issues
DROP FUNCTION IF EXISTS create_appointment_atomic CASCADE;
DROP FUNCTION IF EXISTS get_appointments_time_range CASCADE;
DROP FUNCTION IF EXISTS get_appointment_counts_by_date CASCADE;

-- Restore original indexes
DROP INDEX idx_appointments_shop_date_time;
DROP INDEX idx_appointments_shop_month;
-- etc...

CREATE INDEX idx_appointments_shop_date ON appointments(shop_id, date);
```

### 7. Post-Deployment Verification (30 minutes)

After each stage:

```typescript
// Run smoke tests
npm run test:production

// Verify key user flows
- [ ] Can view calendar
- [ ] Can navigate months
- [ ] Can create appointment
- [ ] Can edit appointment
- [ ] Can delete appointment
- [ ] Mobile view works

// Check metrics
- [ ] Response times < 100ms p95
- [ ] Error rate < 0.1%
- [ ] Cache hit rate > 80%
- [ ] No memory leaks
```

## Success Criteria

- Zero downtime during deployment
- Error rate remains below 0.1%
- Performance metrics improved or maintained
- Positive user feedback
- No critical bugs reported

## Communication Plan

### Before Deployment

- Email to team about upcoming changes
- Update status page about maintenance window
- Prepare support team with FAQ

### During Deployment

- Slack updates on progress
- Monitor support channels
- Real-time metrics dashboard

### After Deployment

- Success announcement
- Gather team feedback
- Document lessons learned

## Long-term Monitoring

Set up weekly reports:

- Performance trends
- Error rate patterns
- Cache efficiency
- User behavior changes
- Database query patterns

## Next Steps

- Remove legacy code after 30 days stable
- Plan next optimization phase
- Document performance wins
- Share learnings with team

## Notes for Implementation Agent

- Never skip the gradual rollout stages
- Monitor closely during each stage
- Have rollback ready at all times
- Document any issues encountered
- Celebrate the successful deployment! 🎉
