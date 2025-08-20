'use client';

import { Stack } from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { AlertCard } from './AlertCard';

export function DashboardAlerts() {
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllDueToday, setShowAllDueToday] = useState(false);

  // TODO: Replace with real data from actions/queries
  const overdueGarments = {
    count: 2,
    items:
      'Wedding dress (Sarah J. - 3 days), Suit jacket (Michael B. - 1 day)',
  };

  const dueTodayGarments = {
    count: 3,
    items: 'Evening gown alterations, Pants hemming, Dress fitting adjustments',
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      {/* Overdue Alert */}
      {overdueGarments.count > 0 && (
        <AlertCard
          icon={<WarningIcon sx={{ fontSize: 20 }} />}
          title={`${overdueGarments.count} garments overdue`}
          description={overdueGarments.items}
          severity="error"
          onAction={() => setShowAllOverdue(!showAllOverdue)}
          actionLabel={showAllOverdue ? 'Show less' : 'View all'}
        />
      )}

      {/* Due Today Alert */}
      {dueTodayGarments.count > 0 && (
        <AlertCard
          icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
          title={`${dueTodayGarments.count} garments due today`}
          description={dueTodayGarments.items}
          severity="warning"
          onAction={() => setShowAllDueToday(!showAllDueToday)}
          actionLabel={showAllDueToday ? 'Show less' : 'View all'}
        />
      )}
    </Stack>
  );
}
