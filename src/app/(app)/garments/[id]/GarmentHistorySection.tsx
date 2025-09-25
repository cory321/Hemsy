'use client';

import { Box } from '@mui/material';
import GarmentHistoryTable from '@/components/garments/GarmentHistoryTable';

interface GarmentHistorySectionProps {
	garmentId: string;
	initialHistoryData?: any[] | undefined;
}

export default function GarmentHistorySection({
	garmentId,
	initialHistoryData,
}: GarmentHistorySectionProps) {
	return (
		<Box sx={{ mt: 3 }}>
			<GarmentHistoryTable
				garmentId={garmentId}
				initialHistoryData={initialHistoryData || undefined}
			/>
		</Box>
	);
}
