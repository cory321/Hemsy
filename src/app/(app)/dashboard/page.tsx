import { DashboardServerOptimized } from '@/components/DashboardServerOptimized';

// Force dynamic rendering since we use cookies() for auth
// Data-level caching is handled by unstable_cache in dashboard-optimized.ts
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return <DashboardServerOptimized />;
}
