'use client';

import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import type { ShopHours, Appointment } from '@/types';
import { useSearchParams } from 'next/navigation';
import { parseISO, isValid } from 'date-fns';
import { parseLocalDateFromYYYYMMDD } from '@/lib/utils/date';
import { useAppointments } from '@/providers/AppointmentProvider';

interface AppointmentsClientProps {
	shopId: string;
	shopHours: ShopHours[];
	calendarSettings: {
		buffer_time_minutes: number;
		default_appointment_duration: number;
		allow_overlapping_appointments: boolean;
	};
}

export function AppointmentsClient({
	shopId,
	shopHours,
	calendarSettings,
}: AppointmentsClientProps) {
	const search = useSearchParams();
	const { state } = useAppointments();

	const viewParam = (search.get('view') || 'month') as
		| 'month'
		| 'week'
		| 'day'
		| 'list';
	const dateParam = search.get('date');
	const focusParam = search.get('focus') || undefined;

	// State for dialogs
	const [selectedAppointment, setSelectedAppointment] =
		useState<Appointment | null>(null);
	const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [isReschedule, setIsReschedule] = useState(false);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [createDialogDate, setCreateDialogDate] = useState<Date | null>(null);
	const [createDialogTime, setCreateDialogTime] = useState<string | null>(null);

	// Robustly parse date-only strings as local dates to avoid off-by-one timezone shifts
	let parsedDate = new Date();
	if (dateParam) {
		parsedDate =
			dateParam.length === 10
				? parseLocalDateFromYYYYMMDD(dateParam)
				: parseISO(dateParam);
	}
	const initialDate = isValid(parsedDate) ? parsedDate : new Date();
	const initialView = ['month', 'week', 'day', 'list'].includes(viewParam)
		? (viewParam as any)
		: 'month';

	// Handle appointment click
	const handleAppointmentClick = (appointment: Appointment) => {
		setSelectedAppointment(appointment);
		setDetailsDialogOpen(true);
	};

	// Handle edit from details dialog
	const handleEditFromDetails = (
		appointment: Appointment,
		isReschedule?: boolean,
		sendEmailDefault?: boolean
	) => {
		setDetailsDialogOpen(false);
		setSelectedAppointment(appointment);
		setIsReschedule(isReschedule || false);
		setEditDialogOpen(true);
	};

	// Handle time slot click for creating new appointment
	const handleTimeSlotClick = (date: Date, time?: string) => {
		setCreateDialogDate(date);
		setCreateDialogTime(time || null);
		setCreateDialogOpen(true);
	};

	// Handle schedule appointment button click
	const handleScheduleAppointment = () => {
		// Open dialog with current date and no specific time
		setCreateDialogDate(new Date());
		setCreateDialogTime(null);
		setCreateDialogOpen(true);
	};

	// Get existing appointments for conflict checking
	const existingAppointments = Array.from(state.appointments.values());
	const { createAppointment, updateAppointment } = useAppointments();

	// Handle appointment creation
	const handleCreateAppointment = async (data: {
		clientId: string;
		date: string;
		startTime: string;
		endTime: string;
		type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
		notes?: string;
		sendEmail?: boolean;
		timezone?: string;
	}) => {
		const result = await createAppointment(shopId, {
			shopId: shopId,
			clientId: data.clientId,
			date: data.date,
			startTime: data.startTime,
			endTime: data.endTime,
			type: data.type,
			notes: data.notes || '',
			sendEmail: data.sendEmail || false,
		});

		if (result.success) {
			// Close the dialog after successful creation
			setCreateDialogOpen(false);
			setCreateDialogDate(null);
			setCreateDialogTime(null);
		} else {
			// Error will be displayed inline in the dialog
			throw new Error(result.error || 'Failed to create appointment');
		}
	};

	// Handle appointment update/reschedule
	const handleUpdateAppointment = async (data: {
		clientId: string;
		date: string;
		startTime: string;
		endTime: string;
		type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
		notes?: string;
		status?: string;
		sendEmail?: boolean;
		timezone?: string;
	}) => {
		if (!selectedAppointment) return;

		const result = await updateAppointment(selectedAppointment.id, {
			id: selectedAppointment.id,
			shopId: shopId,
			clientId: data.clientId,
			date: data.date,
			startTime: data.startTime,
			endTime: data.endTime,
			type: data.type,
			notes: data.notes || '',
			status: data.status as
				| 'pending'
				| 'declined'
				| 'confirmed'
				| 'canceled'
				| 'no_show'
				| undefined,
			sendEmail: data.sendEmail || false,
		});

		if (result.success) {
			// Close the dialog after successful update
			setEditDialogOpen(false);
			setSelectedAppointment(null);
			setIsReschedule(false);
		} else {
			// Error will be displayed inline in the dialog
			throw new Error(result.error || 'Failed to update appointment');
		}
	};

	return (
		<>
			{/* Page Header */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
					px: { xs: 2, sm: 0 },
				}}
			>
				<Typography
					variant="h4"
					component="h1"
					sx={{
						fontWeight: 600,
						color: 'text.primary',
					}}
				>
					Appointments
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={handleScheduleAppointment}
					sx={{
						borderRadius: 1,
						textTransform: 'none',
						fontWeight: 600,
						px: 3,
					}}
				>
					Schedule Appointment
				</Button>
			</Box>

			<CalendarWithQuery
				shopId={shopId}
				shopHours={shopHours}
				calendarSettings={calendarSettings}
				initialView={initialView}
				initialDate={initialDate}
				onAppointmentClick={handleAppointmentClick}
				onDateClick={handleTimeSlotClick}
				{...(focusParam && { focusAppointmentId: focusParam })}
			/>

			{/* Appointment Details Dialog */}
			{selectedAppointment && (
				<AppointmentDetailsDialog
					open={detailsDialogOpen}
					onClose={() => {
						setDetailsDialogOpen(false);
						setSelectedAppointment(null);
					}}
					appointment={selectedAppointment}
					onEdit={handleEditFromDetails}
				/>
			)}

			{/* Appointment Edit/Reschedule Dialog */}
			{selectedAppointment && (
				<AppointmentDialog
					open={editDialogOpen}
					onClose={() => {
						setEditDialogOpen(false);
						setSelectedAppointment(null);
						setIsReschedule(false);
					}}
					appointment={selectedAppointment}
					isReschedule={isReschedule}
					shopHours={shopHours}
					existingAppointments={existingAppointments}
					calendarSettings={calendarSettings}
					onUpdate={handleUpdateAppointment}
				/>
			)}

			{/* Create New Appointment Dialog */}
			{createDialogDate && (
				<AppointmentDialog
					open={createDialogOpen}
					onClose={() => {
						setCreateDialogOpen(false);
						setCreateDialogDate(null);
						setCreateDialogTime(null);
					}}
					shopHours={shopHours}
					existingAppointments={existingAppointments}
					calendarSettings={calendarSettings}
					selectedDate={createDialogDate}
					selectedTime={createDialogTime}
					onCreate={handleCreateAppointment}
				/>
			)}
		</>
	);
}
