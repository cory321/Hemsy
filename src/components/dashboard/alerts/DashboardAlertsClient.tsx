'use client';

import { Stack } from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCard } from './AlertCard';
import type { DashboardAlertGarment } from '@/lib/actions/dashboard';

interface DashboardAlertsClientProps {
  overdueData: {
    count: number;
    garments: DashboardAlertGarment[];
  };
  dueTodayData: {
    count: number;
    garments: DashboardAlertGarment[];
  };
}

export function DashboardAlertsClient({
  overdueData,
  dueTodayData,
}: DashboardAlertsClientProps) {
  const router = useRouter();
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllDueToday, setShowAllDueToday] = useState(false);
  const [dismissedOverdue, setDismissedOverdue] = useState(false);
  const [dismissedDueToday, setDismissedDueToday] = useState(false);

  // Format garment list for display
  const formatGarmentList = (
    garments: DashboardAlertGarment[],
    showAll: boolean,
    totalCount: number
  ): string => {
    const displayGarments = showAll ? garments : garments;

    const formattedList = displayGarments
      .map((garment) => {
        const daysText = garment.days_overdue
          ? ` (${garment.days_overdue} day${garment.days_overdue !== 1 ? 's' : ''} overdue)`
          : '';
        return `${garment.name} - ${garment.client_name}${daysText}`;
      })
      .join(', ');

    // Show "and X more" if the total count is greater than 2
    if (!showAll && totalCount > 2) {
      const remainingCount = totalCount - 2;
      return `${formattedList}, and ${remainingCount} more`;
    }

    return formattedList;
  };

  const handleOverdueViewAll = () => {
    if (showAllOverdue) {
      setShowAllOverdue(false);
    } else {
      // Navigate to garments page with overdue filter
      router.push('/garments?sort=overdue');
    }
  };

  const handleDueTodayViewAll = () => {
    if (showAllDueToday) {
      setShowAllDueToday(false);
    } else {
      // Navigate to garments page with due today filter
      router.push('/garments?sort=due_soon');
    }
  };

  // Check if we have any alerts to show
  const hasOverdueAlert = overdueData.count > 0 && !dismissedOverdue;
  const hasDueTodayAlert = dueTodayData.count > 0 && !dismissedDueToday;

  // Don't render anything if no alerts are visible
  if (!hasOverdueAlert && !hasDueTodayAlert) {
    return null;
  }

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      {/* Overdue Alert */}
      {hasOverdueAlert && (
        <AlertCard
          icon={<WarningIcon sx={{ fontSize: 20 }} />}
          title={`${overdueData.count} garment${overdueData.count !== 1 ? 's' : ''} overdue`}
          description={formatGarmentList(
            overdueData.garments,
            showAllOverdue,
            overdueData.count
          )}
          severity="error"
          onAction={handleOverdueViewAll}
          actionLabel={showAllOverdue ? 'Show less' : 'View all'}
          onDismiss={() => setDismissedOverdue(true)}
        />
      )}

      {/* Due Today Alert */}
      {hasDueTodayAlert && (
        <AlertCard
          icon={<ScheduleIcon sx={{ fontSize: 20 }} />}
          title={`${dueTodayData.count} garment${dueTodayData.count !== 1 ? 's' : ''} due today`}
          description={formatGarmentList(
            dueTodayData.garments,
            showAllDueToday,
            dueTodayData.count
          )}
          severity="warning"
          onAction={handleDueTodayViewAll}
          actionLabel={showAllDueToday ? 'Show less' : 'View all'}
          onDismiss={() => setDismissedDueToday(true)}
        />
      )}
    </Stack>
  );
}
