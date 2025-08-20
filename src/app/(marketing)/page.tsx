import { Container, Typography, Button, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import Link from 'next/link';
import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';

export const metadata: Metadata = {
  title: 'Hemsy - Seamstress Business Management',
  description:
    'The mobile-first business management app for seamstresses and tailoring professionals',
};

export default async function HomePage() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Hemsy
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          The mobile-first business management app for seamstresses and
          tailoring professionals
        </Typography>
        <Box sx={{ mt: 4 }}>
          {isSignedIn ? (
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/dashboard"
              sx={{ mr: 2 }}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/sign-up"
              sx={{ mr: 2 }}
            >
              Start Free Trial
            </Button>
          )}
          <Button
            variant="outlined"
            size="large"
            component={Link}
            href="/features"
          >
            Learn More
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4} sx={{ my: 8 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Manage Clients
            </Typography>
            <Typography color="text.secondary">
              Keep track of your clients and their orders in one place
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Track Orders
            </Typography>
            <Typography color="text.secondary">
              Manage garments through every stage of production
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Send Invoices
            </Typography>
            <Typography color="text.secondary">
              Professional invoicing with integrated payment processing
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
