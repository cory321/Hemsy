'use client';

import { GarmentProvider } from '@/contexts/GarmentContext';
import { Container, Box } from '@mui/material';
import GarmentDetailContent from './GarmentDetailContent';

interface GarmentDetailPageClientProps {
	garment: any;
	initialBalanceStatus?: {
		isLastGarment: boolean;
		hasOutstandingBalance: boolean;
		balanceDue: number;
		orderNumber: string;
		orderTotal: number;
		paidAmount: number;
		clientName: string;
		invoiceId?: string;
		clientEmail?: string;
	} | null;
	initialHistoryData?: any[];
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
	from?: string;
	orderId?: string;
}

export default function GarmentDetailPageClient({
	garment,
	initialBalanceStatus,
	initialHistoryData,
	shopId,
	shopHours,
	calendarSettings,
	from,
	orderId,
}: GarmentDetailPageClientProps) {
	// Format client name
	const clientName = garment.order?.client
		? `${garment.order.client.first_name} ${garment.order.client.last_name}`
		: 'Unknown Client';

	return (
		<GarmentProvider
			initialGarment={garment}
			initialBalanceStatus={initialBalanceStatus || null}
		>
			<Container maxWidth="lg">
				<Box sx={{ mt: 4, mb: 4 }}>
					<GarmentDetailContent
						clientName={clientName}
						{...(initialHistoryData && { initialHistoryData })}
						shopId={shopId}
						shopHours={shopHours}
						calendarSettings={calendarSettings}
						{...(from !== undefined && { from })}
						{...(orderId !== undefined && { orderId })}
					/>
				</Box>
			</Container>
		</GarmentProvider>
	);
}
