'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  Button,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

interface BusinessHealthProps {
  currentMonthRevenue?: number;
  lastMonthRevenue?: number;
  pendingInvoices?: {
    total: number;
    count: number;
    overdueCount: number;
  };
  onViewFinances?: () => void;
}

const refinedColors = {
  success: '#5A736C',
  error: '#D94F40',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

export function BusinessHealth({
  currentMonthRevenue = 3250,
  lastMonthRevenue = 2754,
  pendingInvoices = {
    total: 890,
    count: 5,
    overdueCount: 2,
  },
  onViewFinances,
}: BusinessHealthProps) {
  const percentChange = Math.round(
    ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  );
  const isPositive = percentChange > 0;

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Business Health
        </Typography>

        {/* This Month Revenue */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ color: refinedColors.text.tertiary }}
          >
            This month
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: refinedColors.text.primary,
              }}
            >
              ${currentMonthRevenue.toLocaleString()}
            </Typography>
            {isPositive && (
              <Chip
                icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                label={`+${percentChange}%`}
                size="small"
                sx={{
                  bgcolor: alpha(refinedColors.success, 0.1),
                  color: refinedColors.success,
                  fontWeight: 600,
                  height: 24,
                }}
              />
            )}
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: refinedColors.text.secondary }}
          >
            vs ${lastMonthRevenue.toLocaleString()} last month
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Pending Invoices */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ color: refinedColors.text.tertiary }}
          >
            Pending invoices
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            ${pendingInvoices.total}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography
              variant="caption"
              sx={{ color: refinedColors.text.secondary }}
            >
              {pendingInvoices.count} total
            </Typography>
            {pendingInvoices.overdueCount > 0 && (
              <Typography variant="caption" sx={{ color: refinedColors.error }}>
                {pendingInvoices.overdueCount} overdue
              </Typography>
            )}
          </Stack>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<MoneyIcon />}
          size="small"
          onClick={onViewFinances}
        >
          View finances
        </Button>
      </CardContent>
    </Card>
  );
}
