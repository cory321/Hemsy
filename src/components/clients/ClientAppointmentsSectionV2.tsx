'use client';

import { useMemo, useState, useCallback } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Typography,
	Select,
	MenuItem,
	FormControl,
	Skeleton,
	Fade,
	Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { Appointment, AppointmentStatus, Client } from '@/types';
import { useInfiniteClientAppointments } from '@/lib/queries/client-appointment-queries';
import { AppointmentDialog } from '../appointments/AppointmentDialog';
import { useAppointments } from '@/providers/AppointmentProvider';
import { AppointmentTimelineGroup } from './AppointmentTimelineGroup';
import { groupAppointmentsByDate } from '@/lib/utils/appointment-grouping';
import { useQueryClient } from '@tanstack/react-query';

// Reusable button style for contained-to-outlined hover effect
const containedToOutlinedHoverStyle = {
	whiteSpace: 'nowrap' as const,
	border: '2px solid transparent',
	fontSize: '1rem',
	'&:hover': {
		backgroundColor: 'transparent',
		borderColor: 'primary.main',
		borderWidth: '2px',
		color: 'primary.main',
		fontWeight: 600,
	},
	fontWeight: 600,
	transition: 'none',
};

// Helper function to parse date strings safely in local timezone
const parseLocalDate = (dateString: string): Date => {
	const parts = dateString.split('-');
	if (parts.length !== 3) {
		console.warn('[ClientAppointments] Invalid date format:', dateString);
		return new Date(dateString); // Fallback to default parsing
	}
	const year = Number(parts[0]);
	const month = Number(parts[1]);
	const day = Number(parts[2]);

	if (isNaN(year) || isNaN(month) || isNaN(day)) {
		console.warn('[ClientAppointments] Invalid date parts:', dateString);
		return new Date(dateString); // Fallback to default parsing
	}
	return new Date(year, month - 1, day); // month is 0-indexed
};

export interface ClientAppointmentsSectionV2Props {
	clientId: string;
	clientName: string;
	clientEmail?: string;
	clientPhone?: string;
	clientAcceptEmail?: boolean;
	clientAcceptSms?: boolean;
	shopId: string;
	shopHours?: Array<{
		day_of_week: number;
		open_time: string | null;
		close_time: string | null;
		is_closed: boolean;
	}>;
	calendarSettings?: {
		buffer_time_minutes: number;
		default_appointment_duration: number;
	};
}

type TimePeriodFilter =
	| 'upcoming'
	| 'today'
	| 'week'
	| 'month'
	| 'past'
	| 'all';
type StatusFilter =
	| 'all'
	| 'active'
	| 'pending'
	| 'confirmed'
	| 'completed'
	| 'canceled'
	| 'no_show';

const statusMap: Record<StatusFilter, AppointmentStatus[]> = {
	all: [
		'pending',
		'confirmed',
		'declined',
		'canceled',
		'no_show',
		'no_confirmation_required',
	],
	active: ['pending', 'confirmed', 'no_confirmation_required'],
	pending: ['pending'],
	confirmed: ['confirmed'],
	completed: ['declined'], // Assuming 'declined' means completed in this context
	canceled: ['canceled'],
	no_show: ['no_show'],
};

export function ClientAppointmentsSectionV2({
	clientId,
	clientName,
	clientEmail = '',
	clientPhone = '',
	clientAcceptEmail = false,
	clientAcceptSms = false,
	shopId,
	shopHours = [],
	calendarSettings = {
		buffer_time_minutes: 0,
		default_appointment_duration: 30,
	},
}: ClientAppointmentsSectionV2Props) {
	const [timePeriod, setTimePeriod] = useState<TimePeriodFilter>('all');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

	const { createAppointment } = useAppointments();
	const queryClient = useQueryClient();

	// Use a single query with dynamic timeframe based on selected filter
	const appointmentsQuery = useInfiniteClientAppointments(shopId, clientId, {
		includeCompleted: true,
		statuses: statusMap[statusFilter],
		timeframe:
			timePeriod === 'upcoming'
				? 'upcoming'
				: timePeriod === 'past'
					? 'past'
					: 'all', // For 'all', 'today', 'week', 'month' - fetch all and filter client-side
		pageSize: 20,
	});

	// Keep separate upcoming/past queries for "all" view to maintain proper ordering
	const upcomingQuery = useInfiniteClientAppointments(shopId, clientId, {
		includeCompleted: true,
		statuses: statusMap[statusFilter],
		timeframe: 'upcoming',
		pageSize: 20,
	});

	const pastQuery = useInfiniteClientAppointments(shopId, clientId, {
		includeCompleted: true,
		statuses: statusMap[statusFilter],
		timeframe: 'past',
		pageSize: 20,
	});

	// Select appointments based on time period - let server filtering do the heavy lifting
	const appointments = useMemo(() => {
		switch (timePeriod) {
			case 'upcoming':
			case 'past':
				// Use the main query which already has the correct timeframe
				return (
					appointmentsQuery.data?.pages.flatMap((p) => p.appointments) || []
				);

			case 'all':
				// For 'all', use the main query which fetches all appointments
				return (
					appointmentsQuery.data?.pages.flatMap((p) => p.appointments) || []
				);

			case 'today':
			case 'week':
			case 'month': {
				// For these filters, use the main query (fetches all) then apply client-side date filtering
				const allAppointments =
					appointmentsQuery.data?.pages.flatMap((p) => p.appointments) || [];

				// Apply time period filtering
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				console.log(
					'[ClientAppointments] Filtering',
					allAppointments.length,
					'appointments for',
					timePeriod
				);
				console.log(
					'[ClientAppointments] Today is:',
					today.toISOString().split('T')[0]
				);

				return allAppointments.filter((apt) => {
					// Parse date string properly to avoid timezone issues
					const aptDate = parseLocalDate(apt.date);
					aptDate.setHours(0, 0, 0, 0);

					switch (timePeriod) {
						case 'today':
							const isToday = aptDate.getTime() === today.getTime();
							console.log(
								'[ClientAppointments] Checking appointment:',
								apt.date,
								'parsed as:',
								aptDate.toISOString().split('T')[0],
								'is today?',
								isToday
							);
							return isToday;
						case 'week': {
							// Get the start and end of the current week (Sunday to Saturday)
							const startOfWeek = new Date(today);
							const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
							startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Go back to Sunday
							startOfWeek.setHours(0, 0, 0, 0);

							const endOfWeek = new Date(startOfWeek);
							endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday
							endOfWeek.setHours(23, 59, 59, 999);

							return aptDate >= startOfWeek && aptDate <= endOfWeek;
						}
						case 'month': {
							// Get the start and end of the current month
							const startOfMonth = new Date(
								today.getFullYear(),
								today.getMonth(),
								1
							);
							startOfMonth.setHours(0, 0, 0, 0);

							const endOfMonth = new Date(
								today.getFullYear(),
								today.getMonth() + 1,
								0
							);
							endOfMonth.setHours(0, 0, 0, 0); // This gives us the last day of current month at 00:00

							return aptDate >= startOfMonth && aptDate <= endOfMonth;
						}
						default:
							return false;
					}
				});
			}

			default:
				return [];
		}
	}, [upcomingQuery.data, pastQuery.data, timePeriod]);

	// Group appointments by date
	const groupedAppointments = useMemo(
		() => groupAppointmentsByDate(appointments),
		[appointments]
	);

	const totalCount = appointments.length;
	const isLoading = appointmentsQuery.isLoading;
	const hasError = appointmentsQuery.error;

	// Create prefilled client for appointment dialog
	const prefilledClient = useMemo(() => {
		const nameParts = clientName.split(' ');
		const firstName = nameParts[0] || '';
		const lastName = nameParts.slice(1).join(' ') || '';

		return {
			id: clientId,
			first_name: firstName,
			last_name: lastName,
			email: clientEmail,
			phone_number: clientPhone,
			accept_email: clientAcceptEmail,
			accept_sms: clientAcceptSms,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			shop_id: shopId,
		} as Client;
	}, [
		clientId,
		clientName,
		clientEmail,
		clientPhone,
		clientAcceptEmail,
		clientAcceptSms,
		shopId,
	]);

	const handleCreateAppointment = useCallback(
		async (data: {
			clientId: string;
			date: string;
			startTime: string;
			endTime: string;
			type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
			notes?: string;
			sendEmail?: boolean;
		}) => {
			const result = await createAppointment(shopId, {
				shopId,
				clientId: data.clientId,
				date: data.date,
				startTime: data.startTime,
				endTime: data.endTime,
				type: data.type,
				notes: data.notes,
				sendEmail: data.sendEmail,
			});

			if (result.success) {
				setAppointmentDialogOpen(false);

				console.log(
					'[ClientAppointments] Appointment created successfully, refreshing list...'
				);

				// Invalidate all queries for this client to ensure fresh data
				await queryClient.invalidateQueries({
					queryKey: ['appointments', 'client', clientId],
				});

				// Small delay to ensure database has processed the change
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Force refetch all appointment queries for this client
				console.log('[ClientAppointments] Refetching appointment queries...');
				await appointmentsQuery.refetch();
				// Also refetch the separate queries if we're in "all" view
				if (timePeriod === 'all') {
					await Promise.all([upcomingQuery.refetch(), pastQuery.refetch()]);
				}
				console.log('[ClientAppointments] Appointment list refresh complete');
			}
			// Error is already handled by toast in AppointmentProvider
		},
		[
			shopId,
			createAppointment,
			appointmentsQuery,
			upcomingQuery,
			pastQuery,
			timePeriod,
			clientId,
			queryClient,
		]
	);

	return (
		<>
			<Card elevation={2} sx={{ mt: 3, overflow: 'visible' }}>
				<CardContent>
					{/* Header */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							mb: 3,
							flexWrap: 'wrap',
							gap: 2,
						}}
					>
						<Typography
							variant="h6"
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								minWidth: 0,
								flexShrink: 1,
							}}
						>
							<CalendarMonthIcon color="primary" />
							Appointments
							<Fade in={!isLoading} timeout={300}>
								<Typography component="span" color="text.secondary">
									({totalCount})
								</Typography>
							</Fade>
						</Typography>

						<Button
							variant="contained"
							size="medium"
							startIcon={<CalendarMonthIcon />}
							onClick={() => setAppointmentDialogOpen(true)}
							sx={containedToOutlinedHoverStyle}
						>
							Schedule Appointment
						</Button>
					</Box>

					{/* Filters */}
					<Box
						sx={{
							display: 'flex',
							gap: 2,
							mb: 3,
							flexWrap: 'wrap',
						}}
					>
						<FormControl size="small" sx={{ minWidth: 140 }}>
							<Select
								value={timePeriod}
								onChange={(e) =>
									setTimePeriod(e.target.value as TimePeriodFilter)
								}
								displayEmpty
								sx={{
									'& .MuiSelect-select': {
										display: 'flex',
										alignItems: 'center',
										gap: 1,
									},
								}}
							>
								<MenuItem value="upcoming">Upcoming</MenuItem>
								<MenuItem value="today">Today</MenuItem>
								<MenuItem value="week">This Week</MenuItem>
								<MenuItem value="month">This Month</MenuItem>
								<MenuItem value="past">Past</MenuItem>
								<MenuItem value="all">All Time</MenuItem>
							</Select>
						</FormControl>

						<FormControl size="small" sx={{ minWidth: 140 }}>
							<Select
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as StatusFilter)
								}
								displayEmpty
							>
								<MenuItem value="all">All Statuses</MenuItem>
								<MenuItem value="active">Active Only</MenuItem>
								<MenuItem value="pending">Pending</MenuItem>
								<MenuItem value="confirmed">Confirmed</MenuItem>
								<MenuItem value="completed">Completed</MenuItem>
								<MenuItem value="canceled">Canceled</MenuItem>
								<MenuItem value="no_show">No Show</MenuItem>
							</Select>
						</FormControl>
					</Box>

					{/* Content */}
					{isLoading ? (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
							<Skeleton variant="text" width="30%" height={24} />
							<Skeleton variant="rounded" height={120} />
							<Skeleton variant="rounded" height={120} />
							<Skeleton variant="rounded" height={120} />
						</Box>
					) : hasError ? (
						<Box
							sx={{
								py: 4,
								textAlign: 'center',
								color: 'error.main',
							}}
						>
							<Typography>Failed to load appointments</Typography>
						</Box>
					) : appointments.length === 0 ? (
						<Box
							sx={{
								py: 6,
								textAlign: 'center',
								color: 'text.secondary',
							}}
						>
							<CalendarMonthIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
							<Typography variant="h6" gutterBottom>
								No appointments{' '}
								{timePeriod === 'upcoming' ? 'scheduled' : 'found'}
							</Typography>
							<Typography variant="body2" sx={{ mb: 3 }}>
								{timePeriod === 'upcoming'
									? `Schedule an appointment with ${clientName}`
									: 'Try adjusting your filters'}
							</Typography>
						</Box>
					) : (
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
							{Object.entries(groupedAppointments).map(([dateKey, group]) => (
								<AppointmentTimelineGroup
									key={dateKey}
									dateKey={dateKey}
									group={group}
									shopId={shopId}
									shopHours={shopHours}
									calendarSettings={calendarSettings}
									existingAppointments={appointments}
								/>
							))}
						</Box>
					)}

					{/* Load More */}
					{(appointmentsQuery.hasNextPage ||
						(timePeriod === 'all' &&
							(upcomingQuery.hasNextPage || pastQuery.hasNextPage))) && (
						<Box sx={{ mt: 3, textAlign: 'center' }}>
							<Button
								variant="outlined"
								onClick={() => {
									if (timePeriod === 'all') {
										// For 'all' view, we might still use separate queries
										if (upcomingQuery.hasNextPage)
											upcomingQuery.fetchNextPage();
										if (pastQuery.hasNextPage) pastQuery.fetchNextPage();
									} else {
										// For other views, use the main query
										if (appointmentsQuery.hasNextPage)
											appointmentsQuery.fetchNextPage();
									}
								}}
								disabled={
									appointmentsQuery.isFetchingNextPage ||
									upcomingQuery.isFetchingNextPage ||
									pastQuery.isFetchingNextPage
								}
							>
								{appointmentsQuery.isFetchingNextPage ||
								upcomingQuery.isFetchingNextPage ||
								pastQuery.isFetchingNextPage
									? 'Loading...'
									: 'Load More'}
							</Button>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Appointment Dialog */}
			<AppointmentDialog
				open={appointmentDialogOpen}
				onClose={() => setAppointmentDialogOpen(false)}
				onCreate={handleCreateAppointment}
				prefilledClient={prefilledClient}
				shopHours={shopHours}
				calendarSettings={calendarSettings}
				existingAppointments={appointments}
			/>
		</>
	);
}

export default ClientAppointmentsSectionV2;
