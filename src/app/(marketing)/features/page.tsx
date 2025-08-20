import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function FeaturesPage() {
  const features = [
    {
      title: 'Client Management',
      description:
        'Keep detailed records of all your clients with contact info, measurements, and order history',
    },
    {
      title: 'Order Tracking',
      description:
        'Track garments through every stage from intake to completion',
    },
    {
      title: 'Appointment Scheduling',
      description:
        'Built-in calendar with conflict prevention and reminder notifications',
    },
    {
      title: 'Service Catalog',
      description:
        'Manage your alteration services with pricing and quick-add shortcuts',
    },
    {
      title: 'Professional Invoicing',
      description:
        'Create and send invoices with integrated Stripe payment processing',
    },
    {
      title: 'Mobile-First Design',
      description: 'Works perfectly on any device, optimized for on-the-go use',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8 }}>
        <Typography variant="h2" component="h1" align="center" gutterBottom>
          Features
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          align="center"
          paragraph
        >
          Everything you need to run your seamstress business efficiently
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
