'use client';

import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ResponsiveContainer,
  ShowOn,
  HideOn,
} from '@/components/layout/ResponsiveContainer';
import {
  ResponsiveGridContainer,
  ResponsiveGridItem,
  ResponsivePatterns,
  CardGridItem,
} from '@/components/layout/ResponsiveGrid';
import { useResponsive } from '@/hooks/useResponsive';
import AddIcon from '@mui/icons-material/Add';

/**
 * Example dashboard that demonstrates responsive patterns
 */
export function ResponsiveDashboardExample() {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveContainer>
      {/* Page Header - Responsive layout */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <div>
            <Typography variant="h4" component="h1">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, Sarah!
            </Typography>
          </div>

          {/* Desktop: Full button, Mobile: Icon button */}
          <ShowOn desktop>
            <Button variant="contained" startIcon={<AddIcon />}>
              New Order
            </Button>
          </ShowOn>
          <HideOn desktop>
            <IconButton color="primary" sx={{ ml: 'auto' }}>
              <AddIcon />
            </IconButton>
          </HideOn>
        </Stack>
      </Box>

      {/* Stats Cards - Responsive grid */}
      <ResponsiveGridContainer mobileSpacing={2} desktopSpacing={3}>
        {[
          { label: 'Active Orders', value: '12', color: 'primary' },
          { label: 'Due Today', value: '3', color: 'warning' },
          { label: 'Completed', value: '45', color: 'success' },
          { label: 'Revenue', value: '$2,450', color: 'info' },
        ].map((stat, index) => (
          <ResponsiveGridItem
            key={index}
            mobile={6} // 2 columns on mobile
            tablet={3} // 4 columns on tablet
            desktop={3} // 4 columns on desktop
          >
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
                <Typography variant="h5" sx={{ color: `${stat.color}.main` }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </ResponsiveGridItem>
        ))}
      </ResponsiveGridContainer>

      {/* Two Column Layout Example */}
      <Box sx={{ mt: 4 }}>
        <ResponsivePatterns.TwoColumn>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {/* Mobile: Compact view, Desktop: Detailed view */}
              <Stack spacing={2}>
                {[1, 2, 3].map((order) => (
                  <Box key={order}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="body1">
                          Order #{order}234
                        </Typography>
                        <ShowOn desktop>
                          <Typography variant="body2" color="text.secondary">
                            John Doe - Wedding Suit
                          </Typography>
                        </ShowOn>
                      </Box>
                      <Chip
                        label="In Progress"
                        size={isMobile ? 'small' : 'medium'}
                        color="primary"
                      />
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
              <Stack spacing={2}>
                {[1, 2, 3].map((apt) => (
                  <Box key={apt}>
                    <Typography variant="body1">
                      {isMobile ? '2:00 PM' : 'Today at 2:00 PM'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isMobile
                        ? 'Fitting - Sarah'
                        : 'Dress Fitting - Sarah Johnson'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </ResponsivePatterns.TwoColumn>
      </Box>

      {/* Card Grid Example */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <ResponsivePatterns.CardGrid>
          {[
            'New Client',
            'New Order',
            'Schedule Appointment',
            'Create Invoice',
            'Add Service',
            'View Reports',
          ].map((action, index) => (
            <CardGridItem key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  height: '100%',
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1">{action}</Typography>
                </CardContent>
              </Card>
            </CardGridItem>
          ))}
        </ResponsivePatterns.CardGrid>
      </Box>

      {/* Responsive Stack Example */}
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 2, sm: 3 }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">Need help getting started?</Typography>
                <Typography variant="body2" color="text.secondary">
                  Check out our quick start guide
                </Typography>
              </Box>
              <Button
                variant="outlined"
                fullWidth={isMobile}
                sx={{ minWidth: { sm: 120 } }}
              >
                View Guide
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </ResponsiveContainer>
  );
}
