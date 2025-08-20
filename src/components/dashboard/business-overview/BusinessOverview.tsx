'use client';

import { Stack } from '@mui/material';
import { QuickActions } from './QuickActions';
import { BusinessHealth } from './BusinessHealth';
import { RecentActivity } from './RecentActivity';

export function BusinessOverview() {
  const handleQuickAction = (actionId: string) => {
    console.log('Quick action:', actionId);
    // TODO: Implement navigation/actions based on actionId
  };

  const handleViewFinances = () => {
    console.log('View finances');
    // TODO: Navigate to finances page
  };

  return (
    <Stack spacing={3}>
      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Revenue Card */}
      <BusinessHealth onViewFinances={handleViewFinances} />

      {/* Recent Activity */}
      <RecentActivity />
    </Stack>
  );
}
