'use client';

import { useEffect } from 'react';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { logger } from '@/lib/utils/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our logging service
    // In production, this should go to a service like Sentry
    logger.error('Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          Oops! Something went wrong
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ mb: 3 }}
        >
          We apologize for the inconvenience. An error occurred while processing
          your request. Please try again or contact support if the problem
          persists.
        </Typography>

        {process.env.NODE_ENV === 'development' && error.message && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'grey.50',
              textAlign: 'left',
            }}
          >
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => reset()}
            size="large"
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => (window.location.href = '/dashboard')}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
