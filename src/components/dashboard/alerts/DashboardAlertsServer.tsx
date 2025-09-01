import {
  getOverdueGarmentsForAlert,
  getGarmentsDueTodayForAlert,
} from '@/lib/actions/dashboard';
import { DashboardAlertsClient } from './DashboardAlertsClient';

export async function DashboardAlertsServer() {
  // Fetch data in parallel for better performance
  const [overdueData, dueTodayData] = await Promise.all([
    getOverdueGarmentsForAlert(),
    getGarmentsDueTodayForAlert(),
  ]);

  // Only render if there's data to show (no reserved space when empty)
  if (overdueData.count === 0 && dueTodayData.count === 0) {
    return null;
  }

  return (
    <DashboardAlertsClient
      overdueData={overdueData}
      dueTodayData={dueTodayData}
    />
  );
}
