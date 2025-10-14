'use client';

import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { format } from 'date-fns';
import { useUser } from '@clerk/nextjs';

export function DashboardHeader() {
	const { user, isLoaded: isUserLoaded } = useUser();

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
		</Box>
	);
}
