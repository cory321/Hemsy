// no-op
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      features: [
        'All features included',
        'No credit card required',
        'Full customer support',
        'Data export anytime',
      ],
      cta: 'Start Free Trial',
      href: '/sign-up',
    },
    {
      name: 'Professional',
      price: '$29',
      duration: 'per month',
      features: [
        'Unlimited clients',
        'Unlimited orders',
        'Invoice processing',
        'Email & SMS reminders',
        'Priority support',
      ],
      cta: 'Get Started',
      href: '/sign-up',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      duration: 'contact us',
      features: [
        'Everything in Professional',
        'Multiple locations',
        'Team management',
        'Custom integrations',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      href: '/contact',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8 }}>
        <Typography variant="h2" component="h1" align="center" gutterBottom>
          Simple, Transparent Pricing
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          align="center"
          paragraph
        >
          Start with a free trial, upgrade when you&apos;re ready
        </Typography>

        <Grid container spacing={4} sx={{ mt: 4 }} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  ...(plan.popular && {
                    borderColor: 'primary.main',
                    borderWidth: 2,
                    borderStyle: 'solid',
                  }),
                }}
              >
                {plan.popular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.875rem',
                    }}
                  >
                    Most Popular
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" component="h2" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" component="span">
                      {plan.price}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      component="span"
                    >
                      {' '}
                      /{plan.duration}
                    </Typography>
                  </Box>
                  <List>
                    {plan.features.map((feature, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    size="large"
                    fullWidth
                    component={Link}
                    href={plan.href}
                  >
                    {plan.cta}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
