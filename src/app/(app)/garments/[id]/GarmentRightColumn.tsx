'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import GarmentDetailClient from './GarmentDetailClient';
import GarmentServicesManager from '@/components/garments/GarmentServicesManager';
import GarmentHistory from '@/components/garments/GarmentHistory';
import GarmentTimeTracker from '@/components/garments/GarmentTimeTracker';
import Link from 'next/link';

interface GarmentRightColumnProps {
  garment: any;
  clientName: string;
}

export default function GarmentRightColumn({
  garment,
  clientName,
}: GarmentRightColumnProps) {
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
  // Use a key to force GarmentHistory to re-mount and fetch fresh data
  const [historyKey, setHistoryKey] = useState(0);

  // Callback to refresh history after changes
  const refreshHistory = useCallback(() => {
    setHistoryKey((prev) => prev + 1);
  }, []);

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
            Order #{garment.order?.order_number || 'N/A'} •{' '}
            {garment.order?.client?.id ? (
              <Link href={`/clients/${garment.order.client.id}`}>
                {clientName}
              </Link>
            ) : (
              clientName
            )}
          </Typography>
        </Box>
        <GarmentDetailClient garment={garment} onEdit={refreshHistory} />
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
        <GarmentServicesManager
          garmentId={garment.id}
          services={garment.garment_services || []}
          onServiceChange={refreshHistory}
        />
      </Box>

      {/* Time Tracker */}
      <Box sx={{ mb: 3 }}>
        <GarmentTimeTracker
          garmentId={garment.id}
          services={(garment.garment_services || []).map((s: any) => ({
            id: s.id,
            name: s.name,
          }))}
        />
      </Box>

      {/* Client Information */}
      {garment.order?.client && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Client Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {garment.order?.client?.id ? (
                    <Link href={`/clients/${garment.order.client.id}`}>
                      {clientName}
                    </Link>
                  ) : (
                    clientName
                  )}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {garment.order.client.email}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
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
