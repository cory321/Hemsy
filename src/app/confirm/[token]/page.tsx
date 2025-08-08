import React from 'react';
import { Container, Box, Typography, Alert, Button } from '@mui/material';
import Link from 'next/link';
import { confirmAppointment } from '@/lib/actions/emails/confirmation-tokens';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConfirmAppointmentPage({ params }: PageProps) {
  const { token } = await params;

  const result = await confirmAppointment(token);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
        <Typography component="h1" variant="h4" textAlign="center">
          Appointment Confirmation
        </Typography>

        {result.success ? (
          <Alert
            severity="success"
            data-testid="confirmation-success"
            sx={{ width: '100%' }}
          >
            Your appointment has been confirmed. The shop has been notified.
          </Alert>
        ) : (
          <Alert
            severity="error"
            data-testid="confirmation-error"
            sx={{ width: '100%' }}
          >
            {result.error || 'We could not confirm this appointment.'}
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
