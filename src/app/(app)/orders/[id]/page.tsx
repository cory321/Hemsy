import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Link from 'next/link';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';
import { ensureUserAndShop } from '@/lib/actions/users';
import type { Database } from '@/types/supabase';

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureUserAndShop();
  const supabase = await createSupabaseClient();
  const { id } = await params;

  const { data: order } = (await supabase
    .from('orders')
    .select(
      'id, client_id, status, order_due_date, subtotal_cents, discount_cents, tax_cents, total_cents, created_at, order_number, is_paid, paid_at, notes'
    )
    .eq('id', id)
    .single()) as {
    data: Database['public']['Tables']['orders']['Row'] | null;
  };

  let client = null;
  if (order?.client_id) {
    const { data } = (await supabase
      .from('clients')
      .select('id, first_name, last_name, phone_number, email, mailing_address')
      .eq('id', order.client_id)
      .single()) as {
      data: Database['public']['Tables']['clients']['Row'] | null;
    };
    client = data;
  }

  const { data: garments } = await supabase
    .from('garments')
    .select(
      `id, name, stage, stage_id, notes, due_date, event_date, is_done, preset_icon_key, preset_fill_color,
       garment_stages!garments_stage_id_fkey ( id, name, color )`
    )
    .eq('order_id', id)
    .order('created_at', { ascending: true });

  const garmentIds = (garments || []).map((g: any) => g.id);
  const { data: lines } = garmentIds.length
    ? ((await supabase
        .from('garment_services')
        .select(
          'id, garment_id, name, quantity, unit, unit_price_cents, line_total_cents, is_done'
        )
        .in('garment_id', garmentIds)) as {
        data: Database['public']['Tables']['garment_services']['Row'][] | null;
      })
    : { data: [] as Database['public']['Tables']['garment_services']['Row'][] };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'ready_for_pickup':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStageDisplay = (garment: any) => {
    const name = garment?.garment_stages?.name || garment?.stage || 'New';
    const color = garment?.garment_stages?.color || null;
    return { name, color };
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              Order {order?.order_number || `#${order?.id.slice(0, 8)}`}
            </Typography>
            <Typography color="text.secondary">
              Created on{' '}
              {order?.created_at
                ? new Date(order.created_at).toLocaleDateString()
                : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Edit
            </Button>
            <Button
              variant="contained"
              startIcon={<ReceiptIcon />}
              component={Link}
              href={`/invoices/new?order=${order?.id}`}
            >
              Create Invoice
            </Button>
          </Box>
        </Box>

        {/* Order Info */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Client Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
                <Typography variant="body1">
                  <Link
                    href={`/clients/${client?.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {client
                      ? `${client.first_name} ${client.last_name}`
                      : 'Client'}
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client?.phone_number || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {client?.email || ''}
                </Typography>
                {client?.mailing_address && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {client.mailing_address}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Garments */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Garments ({garments?.length || 0})
                </Typography>
                <List>
                  {(garments || []).map((garment: any, index: number) => (
                    <Box key={garment.id}>
                      <ListItem
                        component={Link}
                        href={`/garments/${garment.id}?from=order&orderId=${id}`}
                        sx={{ px: 0 }}
                      >
                        <ListItemText
                          primary={
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              {(() => {
                                const key = (garment as any).preset_icon_key as
                                  | string
                                  | null;
                                if (!key) return null;
                                const url = getPresetIconUrl(key);
                                if (!url) return null;
                                return (
                                  <span
                                    style={{
                                      width: 20,
                                      height: 20,
                                      display: 'inline-block',
                                    }}
                                  >
                                    <InlinePresetSvg
                                      src={url}
                                      {...((garment as any).preset_fill_color
                                        ? {
                                            fillColor: (garment as any)
                                              .preset_fill_color as string,
                                          }
                                        : {})}
                                    />
                                  </span>
                                );
                              })()}
                              {garment.name}
                            </span>
                          }
                          secondary={
                            <>
                              {(lines || [])
                                .filter((l: any) => l.garment_id === garment.id)
                                .map(
                                  (l: any) =>
                                    `${l.name} (${l.quantity} ${l.unit})`
                                )
                                .join(', ')}
                              {garment.due_date && (
                                <>
                                  <br />
                                  Due:{' '}
                                  {new Date(
                                    garment.due_date
                                  ).toLocaleDateString()}
                                </>
                              )}
                              {garment.event_date && (
                                <>
                                  <br />
                                  Event:{' '}
                                  {new Date(
                                    garment.event_date
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </>
                          }
                        />
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'center',
                            }}
                          >
                            {garment.is_done && (
                              <Chip label="✓" size="small" color="success" />
                            )}
                            {(() => {
                              const { name, color } = getStageDisplay(garment);
                              const chipSx: any = color
                                ? {
                                    bgcolor: color,
                                    color: (theme: any) =>
                                      theme.palette.text.primary,
                                    '& .MuiChip-label': { fontWeight: 600 },
                                  }
                                : undefined;
                              return (
                                <Chip label={name} size="small" sx={chipSx} />
                              );
                            })()}
                          </Box>
                          <Typography variant="body1">
                            {formatUSD(
                              (lines || [])
                                .filter((l: any) => l.garment_id === garment.id)
                                .reduce(
                                  (sum: number, l: any) =>
                                    sum + (l.line_total_cents || 0),
                                  0
                                )
                            )}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < (garments?.length || 0) - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Order Summary */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="text.secondary">Status</Typography>
                    <Chip
                      label={(order?.status || 'new').toString().toUpperCase()}
                      color={getStatusColor(order?.status || 'new') as any}
                      size="small"
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="text.secondary">Due Date</Typography>
                    <Typography>
                      {order?.order_due_date
                        ? new Date(order.order_due_date).toLocaleDateString()
                        : '-'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography>
                      {formatUSD(order?.subtotal_cents || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="text.secondary">Discount</Typography>
                    <Typography>
                      -{formatUSD(order?.discount_cents || 0)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography color="text.secondary">Tax</Typography>
                    <Typography>{formatUSD(order?.tax_cents || 0)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6">
                    {formatUSD(order?.total_cents || 0)}
                  </Typography>
                </Box>
                {order?.is_paid && (
                  <Box sx={{ mt: 2 }}>
                    <Chip
                      label="PAID"
                      color="success"
                      sx={{ height: 'auto', py: 1, width: '100%' }}
                    />
                    {order.paid_at && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, textAlign: 'center' }}
                      >
                        Paid on {new Date(order.paid_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Order Notes */}
            {order?.notes && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Notes
                  </Typography>
                  <Typography variant="body2">{order.notes}</Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
