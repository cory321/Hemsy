'use client';

import { useState, useCallback, useMemo } from 'react';
import {
	Box,
	Card,
	CardMedia,
	CardContent,
	Typography,
	Link,
	Button,
	Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import NextLink from 'next/link';
import EventIcon from '@mui/icons-material/Event';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { alpha } from '@mui/material/styles';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';
import SafeCldImage from '@/components/ui/SafeCldImage';
import { getStageColor } from '@/constants/garmentStages';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { resolveGarmentDisplayImage } from '@/utils/displayImage';
import { useGarment } from '@/contexts/GarmentContext';
import { AppointmentDialogWithConflictCheck } from '@/components/appointments/AppointmentDialogWithConflictCheck';
import { createAppointment } from '@/lib/actions/appointments';
import GarmentImageHoverOverlay from './GarmentImageHoverOverlay';
import { formatPhoneNumber } from '@/lib/utils/phone';
import type { Client } from '@/types';

function getInitials(first: string, last: string) {
	const f = first.trim();
	const l = last.trim();
	const fi = f ? f[0] : '';
	const li = l ? l[0] : '';
	return `${fi}${li}`.toUpperCase() || '—';
}

interface GarmentImageSectionProps {
	clientName: string;
	shopId?: string | undefined;
	shopHours?:
		| ReadonlyArray<{
				day_of_week: number;
				open_time: string | null;
				close_time: string | null;
				is_closed: boolean;
		  }>
		| undefined;
	calendarSettings?:
		| {
				buffer_time_minutes: number;
				default_appointment_duration: number;
		  }
		| undefined;
}

export default function GarmentImageSection({
	clientName,
	shopId,
	shopHours = [],
	calendarSettings = {
		buffer_time_minutes: 0,
		default_appointment_duration: 30,
	},
}: GarmentImageSectionProps) {
	const { garment } = useGarment();

	// Appointment dialog state
	const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

	// Create a client object for the appointment dialog from the garment's order client
	const prefilledClient = useMemo(() => {
		if (!garment.order?.client) return null;

		const client = garment.order.client;
		return {
			id: client.id,
			first_name: client.first_name,
			last_name: client.last_name,
			email: client.email,
			phone_number: client.phone_number,
			// Use fallback values for properties that might not be available
			accept_email: (client as any).accept_email ?? false,
			accept_sms: (client as any).accept_sms ?? false,
			created_at: (client as any).created_at || new Date().toISOString(),
			updated_at: (client as any).updated_at || new Date().toISOString(),
			shop_id: (client as any).shop_id || '',
		} as Client;
	}, [garment.order?.client]);

	// Handle appointment creation
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
			if (!shopId) {
				console.error('Shop ID is required to create appointments');
				return;
			}

			try {
				await createAppointment({
					shopId,
					clientId: data.clientId,
					date: data.date,
					startTime: data.startTime,
					endTime: data.endTime,
					type: data.type,
					notes: data.notes,
					sendEmail: data.sendEmail,
				});
				setAppointmentDialogOpen(false);

				// Show success toast
				const appointmentDate = new Date(`${data.date}T${data.startTime}`);
				const formattedDate = appointmentDate.toLocaleDateString('en-US', {
					weekday: 'short',
					month: 'short',
					day: 'numeric',
				});
				const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				});

				showSuccessToast(
					`Appointment scheduled successfully for ${formattedDate} at ${formattedTime}. ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} appointment with ${clientName}`,
					{ duration: 5000 }
				);
			} catch (error) {
				console.error('Failed to create appointment:', error);
				showErrorToast(
					'Failed to schedule appointment. Please try again or contact support if the problem persists.',
					{ duration: 5000 }
				);
			}
		},
		[shopId, clientName]
	);

	// Handle opening the appointment dialog
	const handleOpenAppointmentDialog = useCallback(() => {
		setAppointmentDialogOpen(true);
	}, []);

	// Debug logging in development
	if (process.env.NODE_ENV === 'development') {
		console.log('GarmentImageSection received garment:', {
			id: garment.id,
			name: garment.name,
			preset_icon_key: garment.preset_icon_key,
			preset_fill_color: garment.preset_fill_color,
			image_cloud_id: garment.image_cloud_id,
			photo_url: garment.photo_url,
		});
	}

	// Resolve display image with fallbacks
	const resolved = resolveGarmentDisplayImage({
		photoUrl: garment.photo_url || '',
		cloudPublicId: garment.image_cloud_id || '',
		presetIconKey: garment.preset_icon_key || '',
	});

	return (
		<>
			{/* Stage Label */}
			<Box
				sx={{
					width: '100%',
					mb: 2,
					p: 2,
					borderRadius: 1,
					backgroundColor: getStageColor(garment.stage as any),
					textAlign: 'center',
				}}
			>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{garment.stage}
				</Typography>
			</Box>

			<Card sx={{ mb: 3 }} data-testid="garment-image-section">
				<GarmentImageHoverOverlay
					imageType={
						resolved.kind === 'cloud'
							? 'cloudinary'
							: resolved.kind === 'photo'
								? 'photo'
								: 'icon'
					}
				>
					{resolved.kind === 'cloud' ? (
						<Box sx={{ position: 'relative', height: 400, width: '100%' }}>
							<SafeCldImage
								src={garment.image_cloud_id as string}
								alt={garment.name}
								fill
								style={{ objectFit: 'cover' }}
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								fallbackIconKey={garment.preset_icon_key}
								fallbackIconColor={garment.preset_fill_color}
							/>
						</Box>
					) : resolved.kind === 'photo' ? (
						<CardMedia
							component="img"
							image={resolved.src as string}
							alt={garment.name}
							sx={{ height: 400, objectFit: 'cover' }}
						/>
					) : resolved.kind === 'preset' && resolved.src ? (
						<Box
							sx={{
								height: 400,
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100',
								position: 'relative',
								aspectRatio: '1 / 1',
								maxWidth: 400,
								mx: 'auto',
								overflow: 'hidden',
								p: 3,
							}}
							data-testid="garment-svg-container"
						>
							{typeof resolved.src === 'string' ? (
								<Box
									sx={{
										height: '88%',
										width: '88%',
										maxWidth: '88%',
										maxHeight: '88%',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
									}}
								>
									<InlinePresetSvg
										src={resolved.src}
										outlineColor={garment.preset_outline_color || ''}
										fillColor={garment.preset_fill_color || ''}
										style={{
											height: '100%',
											width: '100%',
											maxWidth: '100%',
											maxHeight: '100%',
										}}
									/>
								</Box>
							) : null}
						</Box>
					) : (
						<Box
							sx={{
								height: 400,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								bgcolor: 'grey.100',
								flexDirection: 'column',
								gap: 1,
								p: 3,
							}}
						>
							<Box
								sx={{
									height: '88%',
									width: '88%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexDirection: 'column',
									gap: 1,
								}}
							>
								<InlinePresetSvg
									src={'/presets/garments/select-garment.svg'}
									style={{ height: '90%', width: '100%', maxWidth: '100%' }}
								/>
								<Typography color="text.secondary">Preset selected</Typography>
							</Box>
						</Box>
					)}
				</GarmentImageHoverOverlay>
			</Card>

			{/* Client Information */}
			{garment.order?.client && (
				<Card sx={{ mb: 2 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom mb={2}>
							Client Information
						</Typography>
						<Grid container spacing={2}>
							<Grid size={12}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Avatar
										sx={{
											width: 40,
											height: 40,
											bgcolor: 'primary.main',
											color: 'primary.contrastText',
											fontSize: 16,
											fontWeight: 600,
										}}
									>
										{garment.order?.client
											? getInitials(
													garment.order.client.first_name || '',
													garment.order.client.last_name || ''
												)
											: '—'}
									</Avatar>
									{garment.order?.client && 'id' in garment.order.client ? (
										<Link
											component={NextLink}
											href={`/clients/${(garment.order.client as any).id}`}
											variant="body1"
											sx={{
												textDecoration: 'none',
												color: 'primary.main',
												fontWeight: 500,
												'&:hover': {
													textDecoration: 'underline',
												},
											}}
										>
											{clientName}
										</Link>
									) : (
										<Typography variant="body1" sx={{ fontWeight: 500 }}>
											{clientName}
										</Typography>
									)}
								</Box>
							</Grid>
							<Grid size={12}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box
										sx={(theme) => ({
											width: 32,
											height: 32,
											borderRadius: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											backgroundColor: alpha(theme.palette.primary.main, 0.08),
											color: theme.palette.primary.main,
										})}
									>
										<MailOutlineIcon fontSize="small" />
									</Box>
									<Typography variant="body1" color="text.primary">
										{garment.order.client.email}
									</Typography>
								</Box>
							</Grid>
							<Grid size={12}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Box
										sx={(theme) => ({
											width: 32,
											height: 32,
											borderRadius: 1,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											backgroundColor: alpha(theme.palette.primary.main, 0.08),
											color: theme.palette.primary.main,
										})}
									>
										<PhoneOutlinedIcon fontSize="small" />
									</Box>
									<Typography variant="body1" color="text.primary">
										{formatPhoneNumber(garment.order.client.phone_number)}
									</Typography>
								</Box>
							</Grid>
						</Grid>

						{/* Schedule Appointment Button - only show if shopId is available */}
						{shopId && (
							<Box sx={{ mt: 3 }}>
								<Button
									variant="outlined"
									startIcon={<EventIcon />}
									onClick={handleOpenAppointmentDialog}
									fullWidth
								>
									Schedule Appointment
								</Button>
							</Box>
						)}
					</CardContent>
				</Card>
			)}

			{/* Appointment Dialog */}
			{shopId && prefilledClient && (
				<AppointmentDialogWithConflictCheck
					open={appointmentDialogOpen}
					onClose={() => setAppointmentDialogOpen(false)}
					shopId={shopId}
					prefilledClient={prefilledClient}
					shopHours={shopHours}
					calendarSettings={calendarSettings}
					onCreate={handleCreateAppointment}
				/>
			)}
		</>
	);
}
