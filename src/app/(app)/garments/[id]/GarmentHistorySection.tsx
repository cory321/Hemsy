'use client';

import { Box } from '@mui/material';
import GarmentHistoryTable from '@/components/garments/GarmentHistoryTable';

interface GarmentHistorySectionProps {
  garmentId: string;
}

export default function GarmentHistorySection({
  garmentId,
}: GarmentHistorySectionProps) {
  return (
    <Box sx={{ mt: 3 }}>
      <GarmentHistoryTable garmentId={garmentId} />
    </Box>
  );
}
