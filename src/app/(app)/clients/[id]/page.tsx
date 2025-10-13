import { notFound } from 'next/navigation';
import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotesIcon from '@mui/icons-material/Notes';
import ArchiveIcon from '@mui/icons-material/Archive';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
	getClient,
	getClientActiveOrdersCount,
	getClientOutstandingBalance,
} from '@/lib/actions/clients';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import {
	getNextClientAppointment,
	getClientReadyForPickupCount,
} from '@/lib/actions/appointments';
import ClientRestoreButton from '@/components/clients/ClientRestoreButton';
import ClientOrdersSection from '@/components/clients/ClientOrdersSection';
import ClientDetailTabs from '@/components/clients/ClientDetailTabs';
import ClientProfileCard from '@/components/clients/ClientProfileCard';
import ClientEditDialog from '@/components/clients/ClientEditDialog';
import ClientCommunicationPreferencesModal from '@/components/clients/ClientCommunicationPreferencesModal';
import Button from '@mui/material/Button';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { formatPhoneNumber } from '@/lib/utils/phone';
import {
	HydrationBoundary,
	QueryClient,
	dehydrate,
} from '@tanstack/react-query';
import { getClientOrders } from '@/lib/actions/clients';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

interface ClientDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({
	params,
}: ClientDetailPageProps) {
	const { id } = await params;

	try {
		const client = await getClient(id);

		if (!client) {
			notFound();
		}

		// Resolve current user's shopId for appointments queries
		const { userId } = await auth();
		if (!userId) {
			notFound();
		}

		const supabase = await createClient();
		const { data: userData } = await supabase
			.from('users')
			.select('id')
			.eq('clerk_user_id', userId)
			.single();

		if (!userData) {
			notFound();
		}

		const { data: shopData } = await supabase
			.from('shops')
			.select('id')
			.eq('owner_user_id', userData.id)
			.single();

		// Fetch shop hours, calendar settings, next appointment, ready for pickup count, active orders count, and outstanding balance
		const [
			shopHours,
			calendarSettings,
			nextAppointment,
			readyForPickupCount,
			activeOrdersCount,
			outstandingBalanceCents,
		] = await Promise.all([
			getShopHours(),
			getCalendarSettings(),
			shopData?.id
				? getNextClientAppointment(shopData.id, client.id).catch(() => null)
				: Promise.resolve(null),
			shopData?.id
				? getClientReadyForPickupCount(shopData.id, client.id).catch(() => 0)
				: Promise.resolve(0),
			getClientActiveOrdersCount(client.id).catch(() => 0),
			getClientOutstandingBalance(client.id).catch(() => 0),
		]);

		// Remove local formatPhoneNumber function - using imported utility

		const formatDate = (dateString: string | null) => {
			if (!dateString) return 'N/A';
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		};

		// Prepare SSR hydration for orders list (first render)
		const queryClient = new QueryClient();
		await queryClient.prefetchQuery({
			queryKey: ['client', client.id, 'orders'],
			queryFn: () => getClientOrders(client.id),
			staleTime: 30 * 1000,
		});

		// Helper function to get initials
		const getInitials = (first: string, last: string) => {
			const f = first.trim();
			const l = last.trim();
			const fi = f ? f[0] : '';
			const li = l ? l[0] : '';
			return `${fi}${li}`.toUpperCase() || '—';
		};

		const initials = getInitials(client.first_name, client.last_name);
		const fullName = `${client.first_name} ${client.last_name}`.trim();

		return (
			<Container maxWidth="lg">
				<Box sx={{ mt: 4, mb: 4 }}>
					{/* Header with Client Identity and Contact Info */}
					<Card elevation={2} sx={{ mb: 4 }}>
						<CardContent sx={{ p: 3 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									flexWrap: 'wrap',
									gap: 3,
								}}
							>
								{/* Left: Avatar and Name */}
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Avatar
										sx={{
											width: 64,
											height: 64,
											bgcolor: 'secondary.dark',
											color: 'primary.contrastText',
											fontSize: 24,
											fontWeight: 600,
											boxShadow: 2,
										}}
									>
										{initials}
									</Avatar>
									<Box>
										<Box
											sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
										>
											<Typography
												variant="h4"
												component="h1"
												sx={{ fontWeight: 600 }}
											>
												{fullName}
											</Typography>
											{(client as any).is_archived && (
												<Chip
													icon={<ArchiveIcon />}
													label="Archived"
													color="default"
													size="medium"
												/>
											)}
										</Box>
										<Typography variant="body2" color="secondary.main">
											Client since{' '}
											{client.created_at
												? new Date(client.created_at).toLocaleDateString(
														'en-US',
														{
															month: 'long',
															year: 'numeric',
														}
													)
												: 'Unknown'}
										</Typography>
									</Box>
								</Box>

								{/* Center: Contact Information (horizontal) */}
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Box
											sx={{
												width: 32,
												height: 32,
												borderRadius: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: 'secondary.light',
												color: 'secondary.dark',
											}}
										>
											<MailOutlineIcon fontSize="small" />
										</Box>
										<Typography variant="body1" color="text.primary">
											{client.email}
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<Box
											sx={{
												width: 32,
												height: 32,
												borderRadius: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												bgcolor: 'secondary.light',
												color: 'secondary.dark',
											}}
										>
											<PhoneOutlinedIcon fontSize="small" />
										</Box>
										<Typography variant="body1" color="text.primary">
											{formatPhoneNumber(client.phone_number)}
										</Typography>
									</Box>
								</Box>

								{/* Right: Edit Button */}
								<ClientEditDialog client={client}>
									<Button
										variant="outlined"
										size="large"
										startIcon={<EditIcon />}
										sx={{
											fontWeight: 500,
										}}
									>
										Edit Client
									</Button>
								</ClientEditDialog>

								{/* Restore Button (if archived) */}
								{(client as any).is_archived && (
									<Box
										sx={{
											width: '100%',
											display: 'flex',
											justifyContent: 'flex-end',
											mt: 1,
										}}
									>
										<ClientRestoreButton
											clientId={client.id}
											clientName={fullName}
											variant="contained"
											size="medium"
										/>
									</Box>
								)}
							</Box>
						</CardContent>
					</Card>

					{/* Two-column layout: Left - client info, Right - tabs (Orders/Appointments) */}
					<Grid container spacing={3}>
						{/* Left column */}
						<Grid size={{ xs: 12, md: 4 }}>
							<ClientProfileCard
								client={client}
								nextAppointment={nextAppointment}
								readyForPickupCount={readyForPickupCount}
								activeOrdersCount={activeOrdersCount}
								outstandingBalanceCents={outstandingBalanceCents}
							/>

							{/* Preferences */}
							<Box sx={{ mt: 3 }}>
								<Card elevation={2}>
									<CardContent>
										<Typography
											variant="h6"
											gutterBottom
											sx={{ fontSize: '1rem' }}
										>
											Communication Preferences
										</Typography>
										<Divider sx={{ mb: 2 }} />

										<Box
											sx={{
												display: 'flex',
												gap: 1,
												flexWrap: 'wrap',
												alignItems: 'center',
												justifyContent: 'space-between',
											}}
										>
											<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
												<Chip
													label="Email"
													color={client.accept_email ? 'success' : 'default'}
													variant={client.accept_email ? 'filled' : 'outlined'}
													icon={
														client.accept_email ? (
															<CheckCircleIcon />
														) : (
															<EmailIcon />
														)
													}
													sx={{ fontSize: '1rem' }}
												/>
												<Chip
													label="SMS"
													color={client.accept_sms ? 'success' : 'default'}
													variant={client.accept_sms ? 'filled' : 'outlined'}
													icon={
														client.accept_sms ? (
															<CheckCircleIcon />
														) : (
															<PhoneIcon />
														)
													}
													sx={{ fontSize: '1rem' }}
												/>
											</Box>
											<ClientCommunicationPreferencesModal client={client}>
												<Button
													variant="outlined"
													size="small"
													startIcon={<EditIcon />}
													sx={{ fontSize: '1rem' }}
												>
													Edit
												</Button>
											</ClientCommunicationPreferencesModal>
										</Box>
									</CardContent>
								</Card>
							</Box>

							{/* Mailing Address */}
							{client.mailing_address && (
								<Box sx={{ mt: 3 }}>
									<Card elevation={2}>
										<CardContent>
											<Typography
												variant="h6"
												gutterBottom
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<LocationOnIcon color="primary" />
												Mailing Address
											</Typography>
											<Divider sx={{ mb: 2 }} />

											<Typography
												variant="body1"
												sx={{ whiteSpace: 'pre-line' }}
											>
												{client.mailing_address}
											</Typography>
										</CardContent>
									</Card>
								</Box>
							)}

							{/* Notes */}
							{client.notes && (
								<Box sx={{ mt: 3 }}>
									<Card elevation={2}>
										<CardContent>
											<Typography
												variant="h6"
												gutterBottom
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<NotesIcon color="primary" />
												Notes
											</Typography>
											<Divider sx={{ mb: 2 }} />

											<Typography
												variant="body1"
												sx={{ whiteSpace: 'pre-line' }}
											>
												{client.notes}
											</Typography>
										</CardContent>
									</Card>
								</Box>
							)}

							{/* Timestamps */}
							<Box sx={{ mt: 3 }}>
								<Card elevation={2}>
									<CardContent>
										<Typography variant="h6" gutterBottom>
											Record Information
										</Typography>
										<Divider sx={{ mb: 2 }} />

										<Grid container spacing={2}>
											<Grid size={{ xs: 12, sm: 6 }}>
												<Typography variant="body2" color="text.secondary">
													Created
												</Typography>
												<Typography variant="body1">
													{formatDate(client.created_at)}
												</Typography>
											</Grid>
											<Grid size={{ xs: 12, sm: 6 }}>
												<Typography variant="body2" color="text.secondary">
													Last Updated
												</Typography>
												<Typography variant="body1">
													{formatDate(client.updated_at)}
												</Typography>
											</Grid>
										</Grid>
									</CardContent>
								</Card>
							</Box>
						</Grid>

						{/* Right column */}
						<Grid size={{ xs: 12, md: 8 }}>
							<HydrationBoundary state={dehydrate(queryClient)}>
								{shopData?.id ? (
									<ClientDetailTabs
										clientId={client.id}
										clientName={`${client.first_name} ${client.last_name}`}
										clientEmail={client.email}
										clientPhone={client.phone_number}
										clientAcceptEmail={client.accept_email ?? false}
										clientAcceptSms={client.accept_sms ?? false}
										shopId={shopData.id}
										shopHours={shopHours.map((hour) => ({
											day_of_week: hour.day_of_week,
											open_time: hour.open_time,
											close_time: hour.close_time,
											is_closed: hour.is_closed ?? false,
										}))}
										calendarSettings={{
											buffer_time_minutes:
												calendarSettings.buffer_time_minutes ?? 0,
											default_appointment_duration:
												calendarSettings.default_appointment_duration ?? 30,
										}}
									/>
								) : (
									<ClientOrdersSection
										clientId={client.id}
										clientName={`${client.first_name} ${client.last_name}`}
									/>
								)}
							</HydrationBoundary>
						</Grid>
					</Grid>
				</Box>
			</Container>
		);
	} catch (error) {
		console.error('Error fetching client:', error);
		notFound();
	}
}
