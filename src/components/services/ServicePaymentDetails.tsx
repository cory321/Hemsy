'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CreditCard as CardIcon,
  LocalAtm as CashIcon,
  Store as POSIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getServicePaymentBreakdown } from '@/lib/actions/service-payments';

interface ServicePaymentDetailsProps {
  serviceId: string;
  serviceName: string;
  totalAmount: number;
}

export default function ServicePaymentDetails({
  serviceId,
  serviceName,
  totalAmount,
}: ServicePaymentDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<any>(null);

  const loadPaymentBreakdown = useCallback(async () => {
    setLoading(true);
    const result = await getServicePaymentBreakdown(serviceId);
    if (result.success) {
      setBreakdown(result);
    }
    setLoading(false);
  }, [serviceId]);

  useEffect(() => {
    loadPaymentBreakdown();
  }, [loadPaymentBreakdown]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'stripe':
        return <CardIcon fontSize="small" />;
      case 'cash':
        return <CashIcon fontSize="small" />;
      case 'external_pos':
        return <POSIcon fontSize="small" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!breakdown || !breakdown.allocations?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No payment information available
      </Typography>
    );
  }

  const { allocations, summary } = breakdown;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Payment Details for {serviceName}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Service Total:
            </Typography>
            <Typography variant="body2">
              ${(totalAmount / 100).toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Paid:
            </Typography>
            <Typography variant="body2" color="success.main">
              ${(summary.totalAllocated / 100).toFixed(2)}
            </Typography>
          </Box>
          {summary.totalRefunded > 0 && (
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Total Refunded:
              </Typography>
              <Typography variant="body2" color="error.main">
                ${(summary.totalRefunded / 100).toFixed(2)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="bold">
              Net Paid:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              $
              {((summary.totalAllocated - summary.totalRefunded) / 100).toFixed(
                2
              )}
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Payment History
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Method</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Refunded</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allocations.map((allocation: any) => (
              <TableRow key={allocation.id}>
                <TableCell>
                  {new Date(
                    allocation.payments.created_at
                  ).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getPaymentIcon(allocation.payment_method)}
                    {allocation.payment_method.toUpperCase()}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  ${(allocation.allocated_amount_cents / 100).toFixed(2)}
                </TableCell>
                <TableCell align="right">
                  {allocation.refunded_amount_cents > 0
                    ? `$${(allocation.refunded_amount_cents / 100).toFixed(2)}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={allocation.payments.status}
                    size="small"
                    color={
                      allocation.payments.status === 'completed'
                        ? 'success'
                        : allocation.payments.status === 'refunded'
                          ? 'error'
                          : 'default'
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Payment method summary */}
        {Object.keys(summary.byMethod).length > 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              By Payment Method
            </Typography>
            {Object.entries(summary.byMethod).map(
              ([method, data]: [string, any]) => (
                <Box
                  key={method}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getPaymentIcon(method)}
                    <Typography variant="body2" color="text.secondary">
                      {method.toUpperCase()}:
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    ${(data.available / 100).toFixed(2)}
                    {data.refunded > 0 && (
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {' '}
                        (${(data.allocated / 100).toFixed(2)} - $
                        {(data.refunded / 100).toFixed(2)})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
