'use client';

import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import GarmentDetailClientOptimistic from './GarmentDetailClientOptimistic';
import GarmentServicesManagerOptimistic from '@/components/garments/GarmentServicesManagerOptimistic';
import GarmentHistory from '@/components/garments/GarmentHistory';
import GarmentTimeTracker from '@/components/garments/GarmentTimeTracker';
import { useGarment } from '@/contexts/GarmentContext';

interface GarmentRightColumnOptimisticProps {
  clientName: string;
}

export default function GarmentRightColumnOptimistic({
  clientName,
}: GarmentRightColumnOptimisticProps) {
  const { garment, historyKey } = useGarment();

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    // Check if it's already a full timestamp or just a date
    if (dateString.includes('T')) {
      // Full timestamp - use as-is
      return new Date(dateString).toLocaleDateString();
    } else {
      // Date only - add noon time to avoid timezone shifts
      return new Date(dateString + 'T12:00:00').toLocaleDateString();
    }
  };

  return (
    <>
      {/* Header with Edit Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            {garment.name || 'Untitled Garment'}
          </Typography>
          <Typography color="text.secondary">
            Order #{garment.order?.order_number || 'N/A'} • {clientName}
          </Typography>
        </Box>
        <GarmentDetailClientOptimistic />
      </Box>

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
      <Box sx={{ mb: 3 }}>
        <GarmentServicesManagerOptimistic />
      </Box>

      {/* Time Tracker */}
      {garment.order?.client && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <GarmentTimeTracker
              garmentId={garment.id}
              services={garment.garment_services.map((s: any) => ({
                id: s.id,
                name: s.name,
              }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {garment.notes && (
        <Card sx={{ mb: 3 }}>
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

      {/* Change History - key prop forces re-mount on changes */}
      <GarmentHistory key={historyKey} garmentId={garment.id} />
    </>
  );
}
