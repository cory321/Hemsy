import React from 'react';
import { Container, Box, Typography, Alert, Button } from '@mui/material';
import Link from 'next/link';
import { declineAppointment } from '@/lib/actions/emails/confirmation-tokens';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DeclineAppointmentPage({ params }: PageProps) {
  const { token } = await params;

  const result = await declineAppointment(token);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
        <Typography component="h1" variant="h4" textAlign="center">
          Appointment Cancellation
        </Typography>

        {result.success ? (
          result.alreadyUsed ? (
            <Alert
              severity="warning"
              data-testid="cancellation-already-used"
              sx={{ width: '100%' }}
            >
              This appointment action has already been processed. The
              appointment status cannot be changed again using this link.
            </Alert>
          ) : (
            <Alert
              severity="info"
              data-testid="cancellation-success"
              sx={{ width: '100%' }}
            >
              Your appointment has been canceled. The shop has been notified.
            </Alert>
          )
        ) : (
          <Alert
            severity="error"
            data-testid="cancellation-error"
            sx={{ width: '100%' }}
          >
            {result.error || 'We could not cancel this appointment.'}
          </Alert>
        )}

        <Box>
          <Button component={Link} href="/" variant="outlined">
            Back to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
