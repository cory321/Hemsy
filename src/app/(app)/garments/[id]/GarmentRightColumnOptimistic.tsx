'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Link as MuiLink,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import GarmentDetailClientOptimistic from './GarmentDetailClientOptimistic';
import GarmentServicesManagerOptimistic from '@/components/garments/GarmentServicesManagerOptimistic';
import GarmentHistoryOptimistic from '@/components/garments/GarmentHistoryOptimistic';
import GarmentTimeTracker from '@/components/garments/GarmentTimeTracker';
import { useGarment } from '@/contexts/GarmentContext';
import Link from 'next/link';

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
            {garment.order_id ? (
              <MuiLink
                component={Link}
                href={`/orders/${garment.order_id}`}
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Order #{garment.order?.order_number || 'N/A'}
              </MuiLink>
            ) : (
              <>Order #{garment.order?.order_number || 'N/A'}</>
            )}{' '}
            •{' '}
            {garment.order?.client?.id ? (
              <MuiLink
                component={Link}
                href={`/clients/${garment.order.client.id}`}
                color="inherit"
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {clientName}
              </MuiLink>
            ) : (
              clientName
            )}
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
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1">
                {formatDate(garment.due_date)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Event Date
              </Typography>
              <Typography variant="body1">
                {formatDate(garment.event_date)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
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
      <Box sx={{ mb: 3 }}>
        <GarmentTimeTracker
          garmentId={garment.id}
          services={garment.garment_services.map((s: any) => ({
            id: s.id,
            name: s.name,
          }))}
        />
      </Box>

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

      {/* Change History with optimistic updates */}
      <GarmentHistoryOptimistic garmentId={garment.id} />
    </>
  );
}
