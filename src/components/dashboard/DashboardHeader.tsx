'use client';

import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { format } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, DashboardStats } from '@/lib/actions/dashboard';

export function DashboardHeader() {
  const { user, isLoaded: isUserLoaded } = useUser();

  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    // Refetch every 5 minutes
    refetchInterval: 5 * 60 * 1000,
    // Stale after 1 minute
    staleTime: 60 * 1000,
  });

  // Format today's date
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name or default to "there"
  const firstName = user?.firstName || 'there';

  // Format the activity summary
  const getActivitySummary = () => {
    if (!stats) return null;

    const parts = [];
    if (stats.appointmentsToday > 0) {
      parts.push(
        `${stats.appointmentsToday} appointment${stats.appointmentsToday !== 1 ? 's' : ''}`
      );
    }
    if (stats.garmentsDueToday > 0) {
      parts.push(
        `${stats.garmentsDueToday} garment${stats.garmentsDueToday !== 1 ? 's' : ''} due`
      );
    }

    if (parts.length === 0) {
      return null; // Don't show any text if no appointments or garments due
    }

    return `You have ${parts.join(' and ')} today`;
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Date */}
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 0.5 }}>
        {formattedDate}
      </Typography>

      {/* Greeting */}
      <Typography
        variant="h4"
        sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
      >
        {isUserLoaded ? (
          `${getGreeting()}, ${firstName}`
        ) : (
          <Skeleton width={300} />
        )}
      </Typography>

      {/* Activity Summary */}
      {isStatsLoading ? (
        <Skeleton width={400} />
      ) : (
        getActivitySummary() && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {getActivitySummary()}
          </Typography>
        )
      )}
    </Box>
  );
}
