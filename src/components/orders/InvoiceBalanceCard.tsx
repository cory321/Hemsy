'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { getInvoiceBalance } from '@/lib/actions/invoice-sync';

interface InvoiceBalanceCardProps {
  orderId: string;
  onPaymentClick?: () => void;
}

interface InvoiceBalance {
  invoiceId: string;
  totalAmount: number;
  totalPaid: number;
  balanceDue: number;
  depositRequired: number;
  depositPaid: number;
  depositRemaining: number;
  status: string;
  canStartWork: boolean;
}

export default function InvoiceBalanceCard({
  orderId,
  onPaymentClick,
}: InvoiceBalanceCardProps) {
  const [balance, setBalance] = useState<InvoiceBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const result = await getInvoiceBalance(orderId);
        if (result.success && result.balance) {
          setBalance(result.balance);
        } else {
          setError(result.error || 'Failed to load balance');
        }
      } catch (err) {
        setError('Failed to load invoice balance');
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [orderId]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Loading invoice balance...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Alert severity="info">
        {error || 'No invoice found for this order'}
      </Alert>
    );
  }

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const paymentProgress = (balance.totalPaid / balance.totalAmount) * 100;

  const getStatusIcon = () => {
    switch (balance.status) {
      case 'paid':
        return <PaidIcon color="success" />;
      case 'partially_paid':
        return <MoneyIcon color="warning" />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const getStatusColor = () => {
    switch (balance.status) {
      case 'paid':
        return 'success';
      case 'partially_paid':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {getStatusIcon()}
          <Typography variant="h6">Invoice Balance</Typography>
          <Chip
            label={balance.status.replace('_', ' ')}
            color={getStatusColor() as any}
            size="small"
          />
        </Box>

        {/* Payment Progress */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Payment Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(paymentProgress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={paymentProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Amount Breakdown */}
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Total Amount:
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {formatCurrency(balance.totalAmount)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2" color="text.secondary">
            Amount Paid:
          </Typography>
          <Typography variant="body2" color="success.main" fontWeight="medium">
            {formatCurrency(balance.totalPaid)}
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="body1" fontWeight="medium">
            Balance Due:
          </Typography>
          <Typography
            variant="body1"
            fontWeight="bold"
            color={balance.balanceDue > 0 ? 'error.main' : 'success.main'}
          >
            {formatCurrency(balance.balanceDue)}
          </Typography>
        </Box>

        {/* Deposit Information */}
        {balance.depositRequired > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>
              Deposit Information
            </Typography>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Deposit Required:
              </Typography>
              <Typography variant="body2">
                {formatCurrency(balance.depositRequired)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Deposit Paid:
              </Typography>
              <Typography variant="body2" color="success.main">
                {formatCurrency(balance.depositPaid)}
              </Typography>
            </Box>
            {balance.depositRemaining > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Deposit Remaining:
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatCurrency(balance.depositRemaining)}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Work Authorization Status */}
        <Alert
          severity={balance.canStartWork ? 'success' : 'warning'}
          sx={{ mb: 2 }}
        >
          {balance.canStartWork ? (
            <Typography variant="body2">
              ✅ Deposit received - work authorized
            </Typography>
          ) : (
            <Typography variant="body2">
              ⏳ Deposit required before starting work
            </Typography>
          )}
        </Alert>

        {/* Payment Action */}
        {balance.balanceDue > 0 && onPaymentClick && (
          <Button
            variant="contained"
            fullWidth
            onClick={onPaymentClick}
            startIcon={<MoneyIcon />}
          >
            {balance.depositRemaining > 0
              ? `Pay Deposit (${formatCurrency(balance.depositRemaining)})`
              : `Pay Balance (${formatCurrency(balance.balanceDue)})`}
          </Button>
        )}

        {balance.status === 'paid' && (
          <Alert severity="success">
            <Typography variant="body2">
              🎉 Invoice fully paid - ready for completion!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
