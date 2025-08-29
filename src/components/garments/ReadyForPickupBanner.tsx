'use client';

import { useState } from 'react';
import { Alert, Button, CircularProgress, Fade } from '@mui/material';
import { CheckCircle, LocalShipping } from '@mui/icons-material';
import { useGarment } from '@/contexts/GarmentContext';

interface ReadyForPickupBannerProps {
  garmentId: string;
  garmentName: string;
}

export default function ReadyForPickupBanner({
  garmentId,
  garmentName,
}: ReadyForPickupBannerProps) {
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const { markAsPickedUp } = useGarment();

  const handleMarkAsPickedUp = async () => {
    setLoading(true);

    try {
      await markAsPickedUp();
      // The banner will automatically hide when the garment stage changes
      // due to the parent component re-rendering with the new stage
    } catch (error) {
      console.error('Error marking garment as picked up:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in={showBanner} timeout={300}>
      <Alert
        severity="success"
        icon={<CheckCircle fontSize="inherit" />}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleMarkAsPickedUp}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LocalShipping />
              )
            }
            sx={{
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {loading ? 'Marking...' : 'Mark as Picked Up'}
          </Button>
        }
        sx={{
          mb: 2,
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          '& .MuiAlert-message': {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            wordBreak: 'keep-all',
          },
          '& .MuiAlert-action': {
            marginLeft: { xs: 0, sm: 'auto' },
            marginTop: { xs: 1, sm: 0 },
            paddingLeft: { xs: 0, sm: 2 },
          },
          backgroundColor: (theme) =>
            theme.palette.mode === 'light' ? 'success.light' : 'success.dark',
          color: (theme) =>
            theme.palette.mode === 'light'
              ? 'success.contrastText'
              : 'common.white',
          '& .MuiAlert-icon': {
            color: 'inherit',
          },
        }}
      >
        <strong>All services complete!</strong> This garment is Ready For
        Pickup.
      </Alert>
    </Fade>
  );
}
