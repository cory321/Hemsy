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
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Link from 'next/link';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';
import { ensureUserAndShop } from '@/lib/actions/users';
import OrderDetailClient from './OrderDetailClient';
import OrderServicesAndPayments from './OrderServicesAndPayments';
import type { Database } from '@/types/supabase';
import { formatPhoneNumber } from '@/lib/utils/phone';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

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
  const { shop } = await ensureUserAndShop();
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
      `id, name, stage, notes, due_date, event_date, is_done, preset_icon_key, preset_fill_color, image_cloud_id, photo_url`
    )
    .eq('order_id', id)
    .order('created_at', { ascending: true });

  // Get invoice with payments if exists
  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      `
			*,
			payments(*)
		`
    )
    .eq('order_id', id)
    .single();

  // Get shop settings
  const { data: shopSettings, error: shopSettingsError } = await supabase
    .from('shop_settings')
    .select('invoice_prefix')
    .eq('shop_id', shop.id)
    .single();

  // Log error for debugging but continue with defaults
  if (shopSettingsError) {
    console.warn('Failed to fetch shop settings:', shopSettingsError.message);
  }

  // Fetch garment services with removal information (same as invoice page)
  // Try the full query first, fall back to basic query if removal fields don't exist
  let lines: any[] = [];
  let servicesError: any = null;

  try {
    const { data, error } = await supabase
      .from('garment_services')
      .select(
        `
				id,
				garment_id,
				name,
				description,
				quantity,
				unit,
				unit_price_cents,
				line_total_cents,
				is_done,
				is_removed,
				removed_at,
				removed_by,
				removal_reason,
				garments!inner(
					id,
					name,
					order_id
				)
				`
      )
      .eq('garments.order_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }
    lines = data || [];
  } catch (error) {
    console.warn(
      'Failed to fetch services with removal fields, falling back to basic query:',
      error
    );
    // Fallback to basic query without removal fields
    const garmentIds = (garments || []).map((g: any) => g.id);
    if (garmentIds.length > 0) {
      const { data: basicLines, error: basicError } = await supabase
        .from('garment_services')
        .select(
          `
					id,
					garment_id,
					name,
					description,
					quantity,
					unit,
					unit_price_cents,
					line_total_cents,
					is_done
					`
        )
        .in('garment_id', garmentIds)
        .order('created_at', { ascending: true });

      if (basicError) {
        console.error('Error fetching basic garment services:', basicError);
        servicesError = basicError;
      } else {
        // Transform basic data to include garment names and default removal fields
        lines = (basicLines || []).map((service: any) => {
          const garment = garments?.find(
            (g: any) => g.id === service.garment_id
          );
          return {
            ...service,
            is_removed: false,
            removed_at: null,
            removed_by: null,
            removal_reason: null,
            garments: garment
              ? {
                  id: garment.id,
                  name: garment.name,
                  order_id: id,
                }
              : {
                  id: service.garment_id,
                  name: 'Unknown Garment',
                  order_id: id,
                },
          };
        });
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partially_paid':
        return 'info';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStageDisplay = (garment: any) => {
    const stageName = garment?.stage || 'New';
    return { name: stageName };
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
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button variant="outlined" startIcon={<EditIcon />}>
              Edit
            </Button>
            {order && (
              <OrderDetailClient
                order={order}
                invoice={invoice}
                shopSettings={{
                  invoice_prefix: shopSettings?.invoice_prefix ?? 'INV',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Order Info */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* From and Bill To Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      From
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {shop?.name || 'Your Shop'}
                    </Typography>
                    {shop?.mailing_address && (
                      <Typography variant="body2">
                        {shop.mailing_address}
                      </Typography>
                    )}
                    {shop?.email && (
                      <Typography variant="body2">{shop.email}</Typography>
                    )}
                    {shop?.phone_number && (
                      <Typography variant="body2">
                        {shop.phone_number}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      Bill To
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      <Link
                        href={`/clients/${client?.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {client
                          ? `${client.first_name} ${client.last_name}`
                          : 'Client'}
                      </Link>
                    </Typography>
                    {client?.mailing_address && (
                      <Typography variant="body2">
                        {client.mailing_address}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {client?.email || ''}
                    </Typography>
                    <Typography variant="body2">
                      {client?.phone_number
                        ? formatPhoneNumber(client.phone_number)
                        : ''}
                    </Typography>
                  </Grid>
                </Grid>
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
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '64px 1fr',
                            columnGap: 2,
                            alignItems: 'stretch',
                            width: '100%',
                          }}
                        >
                          <Box
                            sx={{
                              alignSelf: 'stretch',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {(() => {
                              const imageCloudId = (garment as any)
                                .image_cloud_id as string | null;
                              const photoUrl = (garment as any).photo_url as
                                | string
                                | null;
                              const key = (garment as any).preset_icon_key as
                                | string
                                | null;
                              const fillColor = (garment as any)
                                .preset_fill_color as string | null;

                              // Check for Cloudinary image first
                              if (imageCloudId) {
                                return (
                                  <img
                                    src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,h_48,w_48/${imageCloudId}`}
                                    alt={garment.name}
                                    style={{
                                      width: 48,
                                      height: 48,
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                  />
                                );
                              }

                              // Then check for photo URL
                              if (photoUrl) {
                                return (
                                  <img
                                    src={photoUrl}
                                    alt={garment.name}
                                    style={{
                                      width: 48,
                                      height: 48,
                                      objectFit: 'cover',
                                      borderRadius: '4px',
                                    }}
                                  />
                                );
                              }

                              // Finally fall back to preset icon
                              const url = key ? getPresetIconUrl(key) : null;
                              return (
                                <span
                                  style={{
                                    width: 48,
                                    height: 48,
                                    display: 'inline-block',
                                  }}
                                >
                                  <InlinePresetSvg
                                    src={
                                      url ||
                                      '/presets/garments/select-garment.svg'
                                    }
                                    {...(fillColor
                                      ? {
                                          fillColor: fillColor,
                                        }
                                      : {})}
                                  />
                                </span>
                              );
                            })()}
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 2,
                              }}
                            >
                              <Typography variant="subtitle1" component="div">
                                {garment.name}
                              </Typography>

                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    gap: 1,
                                    alignItems: 'center',
                                  }}
                                >
                                  {garment.is_done && (
                                    <Chip
                                      label="✓"
                                      size="small"
                                      color="success"
                                    />
                                  )}
                                  {(() => {
                                    const { name } = getStageDisplay(garment);
                                    return <Chip label={name} size="small" />;
                                  })()}
                                </Box>
                                <Typography variant="body1">
                                  {formatUSD(
                                    (lines || [])
                                      .filter(
                                        (l: any) =>
                                          l.garment_id === garment.id &&
                                          !l.is_removed
                                      )
                                      .reduce(
                                        (sum: number, l: any) =>
                                          sum + (l.line_total_cents || 0),
                                        0
                                      )
                                  )}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                              {(lines || [])
                                .filter(
                                  (l: any) =>
                                    l.garment_id === garment.id && !l.is_removed
                                )
                                .map(
                                  (l: any) =>
                                    `${l.name} (${l.quantity} ${l.unit || 'service'})`
                                )
                                .join(', ')}
                            </Typography>

                            {garment.due_date && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Due:{' '}
                                {new Date(
                                  garment.due_date
                                ).toLocaleDateString()}
                              </Typography>
                            )}
                            {garment.event_date && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Event:{' '}
                                {new Date(
                                  garment.event_date
                                ).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </ListItem>
                      {index < (garments?.length || 0) - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
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
                      label={(order?.status || 'pending')
                        .toString()
                        .toUpperCase()}
                      color={getStatusColor(order?.status || 'pending') as any}
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

        {/* Services and Payment History Sections */}
        <OrderServicesAndPayments
          garmentServices={lines || []}
          invoice={invoice}
          payments={invoice?.payments || []}
        />
      </Box>
    </Container>
  );
}
