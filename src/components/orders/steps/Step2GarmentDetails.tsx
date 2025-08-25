'use client';

import { Box } from '@mui/material';
import { useResponsive } from '@/hooks/useResponsive';
import Step2GarmentDetailsCards from './Step2GarmentDetailsCards';

// Keep the original components for backwards compatibility
import { MobileGarmentFlow } from '../mobile/MobileGarmentFlow';
import { MultiGarmentManager } from '../desktop/MultiGarmentManager';
import Step2GarmentDetailsOriginal from './Step2GarmentDetailsOriginal';

export default function Step2GarmentDetails() {
  // Use the new card-based layout for all screen sizes
  return <Step2GarmentDetailsCards />;
}
