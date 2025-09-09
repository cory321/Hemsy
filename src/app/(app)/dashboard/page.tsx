import { DashboardServer } from '@/components/DashboardServer';

// Force dynamic rendering to prevent caching issues with recent activity
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  return <DashboardServer />;
}
