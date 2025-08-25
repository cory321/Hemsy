'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider,
  Chip,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Receipt as InvoiceIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { addServiceToGarmentWithPaymentCheck } from '@/lib/actions/garments-enhanced';
import { toast } from 'react-hot-toast';

interface PaymentAwareServiceDialogProps {
  open: boolean;
  onClose: () => void;
  garment: {
    id: string;
    name: string;
    order_id: string;
  };
  serviceToAdd: {
    serviceId?: string;
    customService?: {
      name: string;
      description?: string;
      unit: string;
      unitPriceCents: number;
      quantity: number;
    };
  };
  hasPaidServices: boolean;
  onServiceAdded: () => void;
}

export default function PaymentAwareServiceDialog({
  open,
  onClose,
  garment,
  serviceToAdd,
  hasPaidServices,
  onServiceAdded,
}: PaymentAwareServiceDialogProps) {
  const [autoCreateInvoice, setAutoCreateInvoice] = useState(hasPaidServices);
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const serviceName = serviceToAdd.customService?.name || 'Service';
  const serviceAmount = serviceToAdd.customService
    ? (serviceToAdd.customService.quantity *
        serviceToAdd.customService.unitPriceCents) /
      100
    : 0;

  const handleConfirm = async () => {
    setProcessing(true);

    try {
      const result = await addServiceToGarmentWithPaymentCheck({
        garmentId: garment.id,
        ...serviceToAdd,
        autoCreateInvoice,
        invoiceNotes: invoiceNotes || undefined,
      });

      if (result.success) {
        // Handle different invoice actions
        switch (result.invoiceAction?.type) {
          case 'created_new':
            toast.success(
              `Service added and invoice ${result.invoiceAction.invoiceNumber} created`,
              { duration: 5000 }
            );
            break;

          case 'added_to_existing':
            toast.success(
              `Service added to existing invoice ${result.invoiceAction.invoiceNumber}`,
              { duration: 5000 }
            );
            break;

          case 'recommended':
            toast.success(
              result.invoiceAction?.message ||
                'Service added successfully. Consider creating an invoice for this additional service.',
              {
                duration: 6000,
              }
            );
            break;

          default:
            toast.success('Service added successfully');
            break;
        }

        onServiceAdded();
        onClose();
      } else {
        toast.error(result.error || 'Failed to add service');
      }
    } catch (error) {
      toast.error('An error occurred while adding the service');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon />
          Add Service to {garment.name}
        </Box>
      </DialogTitle>

      <DialogContent>
        {hasPaidServices && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              This garment has paid services
            </Typography>
            <Typography variant="body2">
              Adding new services will require additional payment from the
              customer.
            </Typography>
          </Alert>
        )}

        {/* Service Summary */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Service to Add:
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {serviceName}
          </Typography>
          {serviceToAdd.customService && (
            <>
              <Typography variant="body2" color="text.secondary">
                {serviceToAdd.customService.quantity}{' '}
                {serviceToAdd.customService.unit}
                {serviceToAdd.customService.quantity > 1 ? 's' : ''} @ $
                {(serviceToAdd.customService.unitPriceCents / 100).toFixed(2)}/
                {serviceToAdd.customService.unit}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body1">
                Total: <strong>${serviceAmount.toFixed(2)}</strong>
              </Typography>
            </>
          )}
        </Box>

        {/* Invoice Options */}
        {hasPaidServices && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={autoCreateInvoice}
                  onChange={(e) => setAutoCreateInvoice(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Automatically create invoice for this service
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    An invoice will be created and can be sent to the customer
                  </Typography>
                </Box>
              }
            />

            {autoCreateInvoice && (
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Invoice Notes (Optional)"
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Any notes to include on the invoice"
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        )}

        {/* Payment Status Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InvoiceIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {hasPaidServices
              ? 'Customer will need to pay for this additional service'
              : 'This service will be included in the order total'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={processing}
          startIcon={processing ? null : <AddIcon />}
        >
          {processing ? 'Adding Service...' : 'Add Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
