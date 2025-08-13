import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { getGarmentById } from '@/lib/actions/orders';
import { getStages } from '@/lib/actions/garment-stages';
import { ensureUserAndShop } from '@/lib/actions/users';
import GarmentStageSelector from '@/components/garments/GarmentStageSelector';
import GarmentTimeTracker from '@/components/garments/GarmentTimeTracker';
import { notFound } from 'next/navigation';

// Stage options
const stages = [
  'New',
  'Intake',
  'Cutting',
  'Sewing',
  'Fitting',
  'Finishing',
  'Ready',
  'Picked Up',
] as const;

export default async function GarmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params directly in Server Components (Next.js 15)
  const { id } = await params;

  // Fetch garment data from Supabase
  const result = await getGarmentById(id);

  if (!result.success || !result.garment) {
    notFound();
  }

  const garment = result.garment as any;

  // Load stages for selector (shop-scoped)
  const { shop } = await ensureUserAndShop();
  const stages = await getStages(shop.id);

  // Format client name
  const clientName = garment.order?.client
    ? `${garment.order.client.first_name} ${garment.order.client.last_name}`
    : 'Unknown Client';

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate total price
  const totalPrice = (garment.totalPriceCents / 100).toFixed(2);

  // Prefer persisted photo_url; fallback to Cloudinary delivery URL if we only have image_cloud_id
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const imageSrc =
    garment.photo_url ||
    (garment.image_cloud_id && cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${garment.image_cloud_id}`
      : null);

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
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              {garment.name || 'Untitled Garment'}
            </Typography>
            <Typography color="text.secondary">
              Order #{garment.order?.order_number || 'N/A'} • {clientName}
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<EditIcon />}>
            Edit
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Image and Stage */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              {imageSrc ? (
                <CardMedia
                  component="img"
                  image={imageSrc}
                  alt={garment.name}
                  sx={{ height: 400, objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                  }}
                >
                  <Typography color="text.secondary">
                    No image uploaded
                  </Typography>
                </Box>
              )}
              <Box sx={{ p: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CameraAltIcon />}
                >
                  {imageSrc ? 'Update Photo' : 'Add Photo'}
                </Button>
              </Box>
            </Card>

            {/* Stage Selector */}
            <Card>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Current Stage
                </Typography>
                <GarmentStageSelector
                  garmentId={garment.id}
                  shopId={shop.id}
                  stages={stages as any}
                  currentStageId={garment.stage_id || null}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Details */}
          <Grid item xs={12} md={8}>
            {/* Key Dates */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Important Dates
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(garment.due_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Event Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(garment.event_date)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(garment.created_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Services */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Services
                </Typography>
                {garment.garment_services &&
                garment.garment_services.length > 0 ? (
                  <>
                    <List>
                      {garment.garment_services.map(
                        (service: any, index: number) => (
                          <ListItem
                            key={service.id || index}
                            divider={
                              index < garment.garment_services.length - 1
                            }
                          >
                            <ListItemText
                              primary={service.name}
                              secondary={
                                <>
                                  {service.quantity} {service.unit}
                                  {service.quantity > 1 ? 's' : ''} @ $
                                  {(service.unit_price_cents / 100).toFixed(2)}/
                                  {service.unit}
                                  {service.description &&
                                    ` • ${service.description}`}
                                </>
                              }
                            />
                            <Typography variant="body1">
                              $
                              {(
                                (service.quantity * service.unit_price_cents) /
                                100
                              ).toFixed(2)}
                            </Typography>
                          </ListItem>
                        )
                      )}
                    </List>
                    <Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
                      Total: ${totalPrice}
                    </Typography>
                  </>
                ) : (
                  <Typography color="text.secondary">
                    No services added
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {garment.order?.client && (
              <>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Client Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Name
                        </Typography>
                        <Typography variant="body1">{clientName}</Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {garment.order.client.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {garment.order.client.phone_number}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Time Tracker moved to bottom under client info */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <GarmentTimeTracker
                      garmentId={garment.id}
                      services={(garment.garment_services || []).map(
                        (s: any) => ({
                          id: s.id,
                          name: s.name,
                        })
                      )}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notes */}
            {garment.notes && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notes
                  </Typography>
                  <Typography style={{ whiteSpace: 'pre-wrap' }}>
                    {garment.notes}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
