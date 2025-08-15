'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import { formatCurrency, dollarsToCents } from '@/lib/utils/currency';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';

export default function Step3Summary() {
  const { orderDraft, updateOrderDraft, calculateSubtotal, calculateTotal } =
    useOrderFlow();
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountDollars, setDiscountDollars] = useState(
    (orderDraft.discountCents / 100).toFixed(2)
  );

  // Fetch shop tax percentage
  useEffect(() => {
    const fetchTaxPercent = async () => {
      const supabase = createSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from('shops')
        .select('tax_percent')
        .eq('owner_user_id', user.id)
        .single();

      if (shop) {
        setTaxPercent(shop.tax_percent);
      }
    };

    fetchTaxPercent();
  }, []);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiscountDollars(value);

    const cents = dollarsToCents(parseFloat(value) || 0);
    updateOrderDraft({ discountCents: Math.max(0, cents) });
  };

  const subtotal = calculateSubtotal();
  const afterDiscount = subtotal - orderDraft.discountCents;
  const taxAmount = Math.round(afterDiscount * taxPercent);
  const total = afterDiscount + taxAmount;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Order Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your order details before submitting.
      </Typography>

      {/* Client Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Client Information
          </Typography>
          {orderDraft.client && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {orderDraft.client.first_name} {orderDraft.client.last_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {orderDraft.client.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {orderDraft.client.phone_number}
                </Typography>
              </Grid>
              {orderDraft.client.mailing_address && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">
                    {orderDraft.client.mailing_address}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Garments and Services */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Garments & Services
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDraft.garments.map((garment, gIdx) => (
                  <React.Fragment key={garment.id}>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ bgcolor: 'grey.100', fontWeight: 'bold' }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {(() => {
                            const url = garment.presetIconKey
                              ? getPresetIconUrl(garment.presetIconKey)
                              : null;
                            return (
                              <span
                                style={{
                                  width: 24,
                                  height: 24,
                                  display: 'inline-block',
                                }}
                              >
                                <InlinePresetSvg
                                  src={
                                    url ||
                                    '/presets/garments/select-garment.svg'
                                  }
                                  {...(garment.presetFillColor
                                    ? { fillColor: garment.presetFillColor }
                                    : {})}
                                />
                              </span>
                            );
                          })()}
                          {garment.name}
                        </span>
                        {garment.dueDate && (
                          <Chip
                            label={`Due: ${new Date(garment.dueDate).toLocaleDateString()}`}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                        {garment.eventDate && (
                          <Chip
                            label={`Event: ${new Date(garment.eventDate).toLocaleDateString()}`}
                            size="small"
                            color="secondary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    {garment.services.map((service, sIdx) => (
                      <TableRow key={`${garment.id}-${sIdx}`}>
                        <TableCell sx={{ pl: 4 }}>{service.name}</TableCell>
                        <TableCell align="right">
                          {service.quantity} {service.unit}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(service.unitPriceCents / 100)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(
                            (service.quantity * service.unitPriceCents) / 100
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {garment.notes && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          sx={{
                            pl: 4,
                            fontStyle: 'italic',
                            fontSize: '0.875rem',
                          }}
                        >
                          Notes: {garment.notes}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Pricing Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pricing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">Subtotal:</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">
                {formatCurrency(subtotal / 100)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2">Discount:</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                size="small"
                value={discountDollars}
                onChange={handleDiscountChange}
                InputProps={{
                  startAdornment: '$',
                }}
                sx={{ width: '120px', float: 'right' }}
              />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2">
                Tax ({(taxPercent * 100).toFixed(2)}%):
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">
                {formatCurrency(taxAmount / 100)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid item xs={6}>
              <Typography variant="h6">Total:</Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary">
                {formatCurrency(total / 100)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Order Notes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Notes
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={orderDraft.notes || ''}
            onChange={(e) => updateOrderDraft({ notes: e.target.value })}
            placeholder="Any additional notes for this order..."
          />
        </CardContent>
      </Card>
    </Box>
  );
}
