'use client';

import { useState } from 'react';
import { Box } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { AlertCard } from '@/components/dashboard/alerts/AlertCard';

interface CreditBalanceBannerProps {
  creditAmountFormatted: string;
}

export default function CreditBalanceBanner({
  creditAmountFormatted,
}: CreditBalanceBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <AlertCard
        icon={<WarningIcon sx={{ fontSize: 20 }} />}
        title="Refund Required"
        description={`Customer has overpaid by ${creditAmountFormatted}`}
        severity="warning"
        showAction={false}
        onDismiss={() => setIsDismissed(true)}
      />
    </Box>
  );
}
