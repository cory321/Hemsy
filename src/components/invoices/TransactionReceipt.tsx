'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
} from '@mui/material';
import {
  Print as PrintIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatting';

interface TransactionReceiptProps {
  invoice: any;
  payment: any;
  open: boolean;
  onClose: () => void;
  onEmailReceipt?: () => void;
}

export default function TransactionReceipt({
  invoice,
  payment,
  open,
  onClose,
  onEmailReceipt,
}: TransactionReceiptProps) {
  const [printing, setPrinting] = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    // Create a new window with just the receipt content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateReceiptHTML());
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
    setPrinting(false);
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - ${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .merchant { font-weight: bold; font-size: 18px; }
            .line { border-bottom: 1px dashed #333; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="merchant">${invoice.shop.name}</div>
            <div>PAYMENT RECEIPT</div>
          </div>
          
          <div class="line"></div>
          
          <div class="row">
            <span>Invoice #:</span>
            <span>${invoice.invoice_number}</span>
          </div>
          
          <div class="row">
            <span>Date:</span>
            <span>${formatDateTime(payment.processed_at || payment.created_at)}</span>
          </div>
          
          <div class="row">
            <span>Customer:</span>
            <span>${invoice.client.first_name} ${invoice.client.last_name}</span>
          </div>
          
          <div class="line"></div>
          
          <div class="row">
            <span>Payment Method:</span>
            <span>${payment.payment_method === 'stripe' ? 'Credit Card' : payment.payment_method.toUpperCase()}</span>
          </div>
          
          <div class="row">
            <span>Amount:</span>
            <span>${formatCurrency(payment.amount_cents)}</span>
          </div>
          
          <div class="row">
            <span>Status:</span>
            <span>${payment.status.toUpperCase()}</span>
          </div>
          
          ${
            payment.stripe_payment_intent_id
              ? `
          <div class="row">
            <span>Transaction ID:</span>
            <span>${payment.stripe_payment_intent_id}</span>
          </div>
          `
              : ''
          }
          
          <div class="line"></div>
          
          <div class="row total">
            <span>TOTAL PAID:</span>
            <span>${formatCurrency(payment.amount_cents)}</span>
          </div>
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div>Card Present Transaction</div>
            <div>Powered by Stripe - PCI Compliant</div>
          </div>
        </body>
      </html>
    `;
  };

  if (!payment) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReceiptIcon />
        Transaction Receipt
      </DialogTitle>

      <DialogContent>
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            {/* Receipt Header */}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {invoice.shop.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PAYMENT RECEIPT
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Transaction Details */}
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Invoice #:</strong>
                  </TableCell>
                  <TableCell>{invoice.invoice_number}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Date:</strong>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(payment.processed_at || payment.created_at)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Customer:</strong>
                  </TableCell>
                  <TableCell>
                    {invoice.client.first_name} {invoice.client.last_name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Payment Method:</strong>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {payment.payment_method === 'stripe'
                      ? 'Credit Card'
                      : payment.payment_method.replace('_', ' ')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Amount:</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(payment.amount_cents)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Status:</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={payment.status}
                      size="small"
                      color={
                        payment.status === 'completed'
                          ? 'success'
                          : payment.status === 'failed'
                            ? 'error'
                            : 'warning'
                      }
                    />
                  </TableCell>
                </TableRow>
                {payment.stripe_payment_intent_id && (
                  <TableRow>
                    <TableCell>
                      <strong>Transaction ID:</strong>
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: 'monospace', fontSize: '0.8em' }}
                    >
                      {payment.stripe_payment_intent_id}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <Divider sx={{ my: 2 }} />

            {/* Total */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                TOTAL PAID: {formatCurrency(payment.amount_cents)}
              </Typography>
            </Box>

            {/* Security Notice */}
            <Alert severity="info" icon={<SecurityIcon />} sx={{ mt: 2 }}>
              <Typography variant="caption">
                Card Present Transaction • Powered by Stripe • PCI Compliant
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {onEmailReceipt && (
          <Button
            onClick={onEmailReceipt}
            startIcon={<EmailIcon />}
            variant="outlined"
          >
            Email Receipt
          </Button>
        )}
        <Button
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          variant="contained"
          disabled={printing}
        >
          {printing ? 'Printing...' : 'Print Receipt'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
