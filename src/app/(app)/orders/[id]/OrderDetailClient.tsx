'use client';

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Chip,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { createInvoice } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/formatting';
import type { Tables } from '@/types/supabase-extended';

interface OrderDetailClientProps {
  order: Tables<'orders'>;
  invoice?: Tables<'invoices'> | null;
  shopSettings: {
    invoice_prefix: string;
  };
}

export default function OrderDetailClient({
  order,
  invoice,
  shopSettings,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    depositAmountCents: 0,
    description: '',
    dueDate: '',
  });

  const handleCreateInvoice = async () => {
    setCreating(true);
    try {
      const result = await createInvoice({
        orderId: order.id,
        depositAmountCents: invoiceForm.depositAmountCents,
        description: invoiceForm.description || undefined,
        dueDate: invoiceForm.dueDate || undefined,
      });

      if (result.success) {
        toast.success('Invoice created successfully');
        setCreateInvoiceOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('Failed to create invoice');
    } finally {
      setCreating(false);
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partially_paid':
        return 'info';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const needsPaymentBeforeWork =
    true && order.status === 'pending' && !order.is_paid;

  return (
    <>
      {/* Invoice Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {invoice ? (
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            component="a"
            href={`/invoices/${invoice.id}`}
          >
            View Invoice
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<ReceiptIcon />}
            onClick={() => setCreateInvoiceOpen(true)}
            disabled={order.total_cents === 0}
          >
            Create Invoice
          </Button>
        )}
      </Box>

      {/* Payment Required Warning */}
      {needsPaymentBeforeWork && !invoice && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Payment is required before work can begin. Please create an invoice to
          process payment.
        </Alert>
      )}

      {/* Create Invoice Dialog */}
      <Dialog
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Creating an invoice for order #{order.order_number}
              <br />
              Total amount: {formatCurrency(order.total_cents)}
            </Alert>

            {true && (
              <TextField
                fullWidth
                label="Deposit Amount (optional)"
                type="number"
                value={(invoiceForm.depositAmountCents / 100).toFixed(2)}
                onChange={(e) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    depositAmountCents: Math.round(
                      parseFloat(e.target.value) * 100
                    ),
                  }))
                }
                InputProps={{
                  startAdornment: '$',
                }}
                helperText="Enter a deposit amount if you want to collect partial payment upfront"
              />
            )}

            <TextField
              fullWidth
              label="Due Date (optional)"
              type="date"
              value={invoiceForm.dueDate}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  dueDate: e.target.value,
                }))
              }
              InputLabelProps={{
                shrink: true,
              }}
              helperText="When the invoice payment is due"
            />

            <TextField
              fullWidth
              label="Description/Notes (optional)"
              multiline
              rows={3}
              value={invoiceForm.description}
              onChange={(e) =>
                setInvoiceForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              helperText="Additional information about this invoice"
            />

            {true && (
              <Alert severity="info">
                {invoiceForm.depositAmountCents > 0
                  ? `A deposit of ${formatCurrency(invoiceForm.depositAmountCents)} will be required before work begins.`
                  : 'Full payment will be required before work begins.'}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateInvoiceOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateInvoice}
            variant="contained"
            disabled={creating}
            startIcon={<ReceiptIcon />}
          >
            {creating ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
