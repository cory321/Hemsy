'use client';

import { useState } from 'react';
import { Box, Tab, Tabs, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ClientAppointmentsSectionV2 } from '@/components/clients/ClientAppointmentsSectionV2';
import ClientOrdersSection from '@/components/clients/ClientOrdersSection';
import { getClientOrders } from '@/lib/actions/clients';
import { useInfiniteClientAppointments } from '@/lib/queries/client-appointment-queries';

interface ClientDetailTabsProps {
	clientId: string;
	clientName: string;
	// Appointments props
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

export default function ClientDetailTabs({
	clientId,
	clientName,
	clientEmail,
	clientPhone,
	clientAcceptEmail,
	clientAcceptSms,
	shopId,
	shopHours,
	calendarSettings,
}: ClientDetailTabsProps) {
	const [activeTab, setActiveTab] = useState<'orders' | 'appointments'>(
		'orders'
	);

	// Get orders count
	const { data: ordersData } = useQuery({
		queryKey: ['client', clientId, 'orders'],
		queryFn: () => getClientOrders(clientId),
		staleTime: 30 * 1000,
		refetchOnWindowFocus: false,
	});

	// Get appointments count - only active upcoming appointments
	const appointmentsQuery = useInfiniteClientAppointments(shopId, clientId, {
		includeCompleted: false,
		statuses: ['pending', 'confirmed', 'no_confirmation_required'],
		timeframe: 'upcoming',
		pageSize: 1,
	});

	const ordersCount = ordersData?.length ?? 0;
	const appointmentsCount = appointmentsQuery.data?.pages?.[0]?.total ?? 0;

	return (
		<Box sx={{ width: '100%' }}>
			<Tabs
				value={activeTab}
				onChange={(e, v) => setActiveTab(v)}
				variant="scrollable"
				scrollButtons
				allowScrollButtonsMobile
				sx={{ mb: 2 }}
			>
				<Tab
					value="orders"
					label={
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							Orders
							{ordersCount > 0 && (
								<Chip
									label={ordersCount}
									size="small"
									color={activeTab === 'orders' ? 'primary' : 'default'}
									sx={(theme) => ({
										fontSize: theme.typography.caption.fontSize, // 12px
										height: 20,
										fontWeight: 700,
										...(activeTab !== 'orders' && {
											bgcolor: 'secondary.dark',
											color: 'white',
										}),
									})}
								/>
							)}
						</Box>
					}
				/>
				<Tab
					value="appointments"
					label={
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							Appointments
							{appointmentsCount > 0 && (
								<Chip
									label={appointmentsCount}
									size="small"
									color={activeTab === 'appointments' ? 'primary' : 'default'}
									sx={(theme) => ({
										fontSize: theme.typography.caption.fontSize, // 12px
										height: 20,
										fontWeight: 700,
										...(activeTab !== 'appointments' && {
											bgcolor: 'secondary.dark',
											color: 'white',
										}),
									})}
								/>
							)}
						</Box>
					}
				/>
			</Tabs>

			{activeTab === 'orders' ? (
				<ClientOrdersSection clientId={clientId} clientName={clientName} />
			) : (
				<ClientAppointmentsSectionV2
					clientId={clientId}
					clientName={clientName}
					clientEmail={clientEmail ?? ''}
					clientPhone={clientPhone ?? ''}
					clientAcceptEmail={!!clientAcceptEmail}
					clientAcceptSms={!!clientAcceptSms}
					shopId={shopId}
					shopHours={shopHours ?? []}
					calendarSettings={
						calendarSettings ?? {
							buffer_time_minutes: 0,
							default_appointment_duration: 30,
						}
					}
				/>
			)}
		</Box>
	);
}
