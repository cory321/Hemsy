import Link from 'next/link';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function NotFound() {
  return (
    <Box
      component="main"
      role="main"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 6, sm: 8 },
        bgcolor: 'background.default',
      }}
    >
      <Stack
        spacing={3}
        alignItems="center"
        sx={{ textAlign: 'center', maxWidth: 640 }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3rem', sm: '4rem' },
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
          aria-label="404"
        >
          404
        </Typography>
        <Typography
          variant="h2"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 700 }}
        >
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          The page you are looking for doesn’t exist or has been moved.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ pt: 1 }}
        >
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            href="/"
            data-testid="go-home"
            sx={{ color: 'common.white' }}
          >
            Go Home
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/dashboard"
            data-testid="go-dashboard"
            sx={{
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' },
            }}
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
