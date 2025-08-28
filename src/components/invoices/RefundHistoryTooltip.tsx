'use client';

import { useState, useEffect } from 'react';
import {
  Tooltip,
  Box,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatting';
import { createClient } from '@/lib/supabase/client';

interface RefundHistoryTooltipProps {
  paymentId: string;
  paymentAmount: number;
  refundedAmount: number;
}

interface RefundRecord {
  id: string;
  amount_cents: number;
  reason?: string;
  refund_type: string;
  refund_method: string;
  created_at: string;
  stripe_refund_id?: string;
}

export default function RefundHistoryTooltip({
  paymentId,
  paymentAmount,
  refundedAmount,
}: RefundHistoryTooltipProps) {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && refunds.length === 0) {
      loadRefunds();
    }
  }, [open]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('status', 'succeeded')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRefunds(
          data.map((refund) => ({
            ...refund,
            reason: refund.reason || 'No reason provided',
            refund_method: (refund as any).refund_method || 'unknown',
            created_at: refund.created_at || new Date().toISOString(),
            stripe_refund_id: refund.stripe_refund_id || '',
          })) as RefundRecord[]
        );
      }
    } catch (err) {
      console.error('Failed to load refund history:', err);
    } finally {
      setLoading(false);
    }
  };

  const tooltipContent = (
    <Box sx={{ p: 1, minWidth: 300 }}>
      <Typography variant="subtitle2" gutterBottom>
        Refund History
      </Typography>
      <Divider sx={{ my: 1 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={20} />
        </Box>
      ) : refunds.length > 0 ? (
        <>
          {refunds.map((refund, index) => (
            <Box
              key={refund.id}
              sx={{ mb: index < refunds.length - 1 ? 1.5 : 0 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(refund.amount_cents)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {refund.refund_type}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(refund.created_at)}
              </Typography>
              {refund.reason && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Reason: {refund.reason}
                </Typography>
              )}
              {index < refunds.length - 1 && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))}

          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" fontWeight="medium">
              Total Refunded:
            </Typography>
            <Typography
              variant="caption"
              fontWeight="medium"
              color="error.main"
            >
              {formatCurrency(refundedAmount)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" fontWeight="medium">
              Remaining:
            </Typography>
            <Typography
              variant="caption"
              fontWeight="medium"
              color="primary.main"
            >
              {formatCurrency(paymentAmount - refundedAmount)}
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No refunds found
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={tooltipContent}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      arrow
      placement="left"
      enterDelay={300}
    >
      <IconButton size="small" color="info">
        <HistoryIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
