'use client';

import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

interface BalanceReminderBannerProps {
  orderNumber: string;
  balanceDue: number; // in cents
  isLastGarment: boolean;
}

export default function BalanceReminderBanner({
  orderNumber,
  balanceDue,
  isLastGarment,
}: BalanceReminderBannerProps) {
  if (!isLastGarment || balanceDue <= 0) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      icon={<AccountBalanceIcon fontSize="inherit" />}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <AlertTitle sx={{ fontWeight: 'bold' }}>
        Last Garment in Order • Outstanding Balance
      </AlertTitle>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Typography variant="body2">
          Order #{orderNumber} has an outstanding balance
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 'bold',
            color: 'error.main',
          }}
        >
          {formatCentsAsCurrency(balanceDue)}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
        Payment will be requested when marking this garment as picked up
      </Typography>
    </Alert>
  );
}
