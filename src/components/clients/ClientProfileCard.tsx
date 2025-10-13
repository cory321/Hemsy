'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import type { Tables } from '@/types/supabase';
import type { Appointment } from '@/types';

interface ClientProfileCardProps {
	client: Tables<'clients'>;
	nextAppointment?: Appointment | null;
	readyForPickupCount?: number;
	activeOrdersCount?: number;
	outstandingBalanceCents?: number;
}

interface ClientStatsCardsProps {
	client: Tables<'clients'>;
	nextAppointment: Appointment | null;
	readyForPickupCount: number;
	activeOrdersCount: number;
	outstandingBalanceCents: number;
}

function formatAppointmentDateTime(appointment: Appointment | null): string {
	if (!appointment) return 'None scheduled';

	const appointmentDate = new Date(
		`${appointment.date}T${appointment.start_time}`
	);

	// Format as "Tue, Oct 8 • 2:30 PM"
	const dayName = appointmentDate.toLocaleDateString('en-US', {
		weekday: 'short',
	});
	const monthDay = appointmentDate.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
	});
	const time = appointmentDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
	});

	return `${dayName}, ${monthDay} • ${time}`;
}

// Separate component for the stats cards (exported for testing)
export function ClientStatsCards({
	client,
	nextAppointment,
	readyForPickupCount,
	activeOrdersCount,
	outstandingBalanceCents,
}: ClientStatsCardsProps) {
	// Real stats from database
	const stats = {
		activeOrders: activeOrdersCount,
		nextAppointment: formatAppointmentDateTime(nextAppointment),
		outstandingBalanceCents: outstandingBalanceCents,
		readyForPickup: readyForPickupCount,
	};

	const statCards = [
		{
			title: 'Active Orders',
			value: stats.activeOrders,
			icon: 'ri-shopping-bag-line',
			color: 'primary',
			format: 'number',
		},
		{
			title: 'Outstanding Balances',
			value: stats.outstandingBalanceCents,
			icon: 'ri-money-dollar-circle-line',
			color: stats.outstandingBalanceCents > 0 ? 'error' : 'primary',
			format: 'currency',
		},
		{
			title: 'Ready For Pickup',
			value: stats.readyForPickup,
			icon: 'ri-t-shirt-line',
			color: stats.readyForPickup > 0 ? 'success' : 'primary',
			format: 'number',
		},
		{
			title: 'Next Appointment',
			value: stats.nextAppointment,
			icon: 'ri-calendar-event-line',
			color: 'primary',
			format: 'text',
		},
	];

	const formatValue = (value: any, format: string) => {
		switch (format) {
			case 'currency':
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
				}).format(value / 100);
			case 'number':
				return value.toString();
			case 'text':
				return value || 'None scheduled';
			default:
				return value;
		}
	};

	return (
		<Grid container spacing={2} sx={{ mb: 3 }}>
			{statCards.map((stat, index) => (
				<Grid size={{ xs: 6, sm: 3 }} key={index}>
					<Card
						elevation={1}
						sx={{
							height: '100%',
							transition: 'all 0.2s ease-in-out',
							'&:hover': {
								elevation: 3,
								transform: 'translateY(-2px)',
							},
						}}
					>
						<CardContent
							sx={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								gap: 0.5,
								py: 3,
								px: 2.5,
							}}
						>
							<Typography
								variant="overline"
								color="text.secondary"
								sx={{
									letterSpacing: '0.02em',
								}}
							>
								{stat.title}
							</Typography>
							<Typography
								variant={stat.format === 'text' ? 'body1' : 'h2'}
								sx={{
									fontWeight: 700,
									lineHeight: 1.2,
									mt: 0.5,
									color: 'text.primary',
								}}
							>
								{formatValue(stat.value, stat.format)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
}

// Main profile card component - now focused on stats and quick actions
export default function ClientProfileCard({
	client,
	nextAppointment,
	readyForPickupCount = 0,
	activeOrdersCount = 0,
	outstandingBalanceCents = 0,
}: ClientProfileCardProps) {
	// Stats data
	const stats = {
		activeOrders: activeOrdersCount,
		nextAppointment: formatAppointmentDateTime(nextAppointment ?? null),
		outstandingBalanceCents: outstandingBalanceCents,
		readyForPickup: readyForPickupCount,
	};

	const statCards = [
		{
			title: 'Active Orders',
			value: stats.activeOrders,
			icon: 'ri-shopping-bag-line',
			format: 'number',
		},
		{
			title: 'Outstanding Balance',
			value: stats.outstandingBalanceCents,
			icon: 'ri-money-dollar-circle-line',
			format: 'currency',
		},
		{
			title: 'Ready For Pickup',
			value: stats.readyForPickup,
			icon: 'ri-t-shirt-line',
			format: 'number',
		},
		{
			title: 'Next Appointment',
			value: stats.nextAppointment,
			icon: 'ri-calendar-event-line',
			format: 'text',
		},
	];

	const formatValue = (value: any, format: string) => {
		switch (format) {
			case 'currency':
				return new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: 'USD',
				}).format(value / 100);
			case 'number':
				return value.toString();
			case 'text':
				return value || 'None scheduled';
			default:
				return value;
		}
	};

	return (
		<Card elevation={2}>
			<CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
				{/* Stats Section */}
				<Grid container spacing={1.5}>
					{statCards.map((stat, index) => (
						<Grid size={{ xs: 12 }} key={index}>
							<Box
								sx={{
									p: 2,
									display: 'flex',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<Typography
									variant="body1"
									color="text.primary"
									sx={{
										fontWeight: 600,
										letterSpacing: '0.02em',
										textTransform: 'uppercase',
										display: 'block',
									}}
								>
									{stat.title}
								</Typography>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											bgcolor: 'secondary.light',
											color: 'secondary.dark',
											fontSize: 24,
											flexShrink: 0,
										}}
									>
										<i className={`ri ${stat.icon}`} />
									</Box>
									<Typography
										variant={stat.format === 'text' ? 'body2' : 'h4'}
										sx={{
											fontWeight: 700,
											lineHeight: 1.3,
											color: 'text.secondary',
										}}
									>
										{formatValue(stat.value, stat.format)}
									</Typography>
								</Box>
							</Box>
						</Grid>
					))}
				</Grid>
			</CardContent>
		</Card>
	);
}
