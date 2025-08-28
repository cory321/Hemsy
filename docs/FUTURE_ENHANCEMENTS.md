# Future Enhancements

## Payment System Enhancements

### Automated Payment Reconciliation Monitoring

**Priority:** Medium (implement after reaching 50+ transactions/day)

**Description:** Automated daily monitoring of payment discrepancies between payments and refunds tables.

**Implementation Notes:**

1. Create scheduled job using Vercel Cron
2. Query the `payment_reconciliation` view for discrepancies
3. Send alerts via email/Slack when issues found
4. Consider auto-fixing known issues (e.g., missing refund records from Stripe webhooks)

**Why it's not in MVP:**

- Manual checking via `/admin/payment-reconciliation` is sufficient for low volume
- Core payment functionality is already robust
- Better to focus on customer acquisition first

**When to implement:**

- Transaction volume > 50-100/day
- Multiple staff members processing payments
- After establishing customer trust

**Code skeleton available in git history:**

- `src/lib/scheduled/payment-reconciliation-monitor.ts`
- `src/app/api/cron/payment-reconciliation/route.ts`
