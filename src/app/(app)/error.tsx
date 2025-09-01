'use client';

import { useEffect } from 'react';
import {
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Stack,
} from '@mui/material';
import { ErrorOutline, Home, Refresh } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/utils/logger';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to our logging service
    logger.error('App route error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }, [error]);

  const handleReset = () => {
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear session storage
      sessionStorage.clear();
      // Reset the error boundary
      reset();
    }
  };

  const handleGoHome = () => {
    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 8 }, px: 2 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Box sx={{ mb: 3 }}>
          <ErrorOutline
            sx={{
              fontSize: { xs: 48, sm: 64 },
              color: 'error.main',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.6 },
                '100%': { opacity: 1 },
              },
            }}
          />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Oops! Something went wrong
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{ mb: 3, px: { xs: 0, sm: 2 } }}
        >
          We encountered an unexpected error. Don&apos;t worry, your data is
          safe. You can try refreshing the page or return to the dashboard.
        </Typography>

        {/* Error details in development */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
              textAlign: 'left',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Typography variant="caption" component="div" color="error.main">
              <strong>Error Details (Development Only):</strong>
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                mt: 1,
              }}
            >
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </Typography>
          </Paper>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mt: 3 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleReset}
            size="large"
            startIcon={<Refresh />}
            fullWidth={true}
            sx={{ minWidth: { sm: 140 } }}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={handleGoHome}
            size="large"
            startIcon={<Home />}
            fullWidth={true}
            sx={{ minWidth: { sm: 140 } }}
          >
            Dashboard
          </Button>
        </Stack>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block' }}
        >
          If this problem persists, please contact support.
        </Typography>
      </Paper>
    </Container>
  );
}
