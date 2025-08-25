import { Suspense } from 'react';
import { Metadata } from 'next';
import { getCurrentShopConnectInfo } from '@/lib/actions/stripe-connect';
import { ConnectOnboardingFlow } from '@/components/stripe-connect/ConnectOnboardingFlow';
import { ConnectStatusDashboard } from '@/components/stripe-connect/ConnectStatusDashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  AlertCircle,
  CreditCard,
  Zap,
  Shield,
  Banknote,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Box,
  Container,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  Paper,
  Divider,
  Skeleton,
} from '@mui/material';

export const metadata: Metadata = {
  title: 'Payment Settings - Threadfolio',
  description:
    'Manage your payment settings and connect your Stripe account to receive payments directly',
};

// Force dynamic rendering since we use cookies() in Server Actions
export const dynamic = 'force-dynamic';

async function ConnectContent() {
  const { success, connectInfo, error } = await getCurrentShopConnectInfo();

  if (!success || error) {
    return (
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, bgcolor: 'error.lighter' }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <Box>
            <Typography variant="h6" color="error.main" gutterBottom>
              Unable to Load Payment Settings
            </Typography>
            <Typography variant="body2" color="error.dark">
              {error ||
                'Failed to load your payment account information. Please try again later.'}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    );
  }

  const hasAccount = !!connectInfo?.accountId;
  const isActive =
    connectInfo?.status === 'active' && connectInfo?.chargesEnabled;
  const isPending = connectInfo?.status === 'pending';

  // Calculate setup progress
  const getSetupProgress = () => {
    if (!hasAccount) return 0;
    if (isPending) return 50;
    if (isActive) return 100;
    return 25;
  };

  return (
    <Stack spacing={4}>
      {/* Enhanced Header with Status */}
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Payment Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure how you receive payments from your clients
            </Typography>
          </Box>
          {hasAccount && (
            <Chip
              icon={
                isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isPending ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )
              }
              label={
                isActive
                  ? 'Active'
                  : isPending
                    ? 'Setup In Progress'
                    : 'Setup Required'
              }
              color={isActive ? 'success' : isPending ? 'warning' : 'error'}
              size="medium"
            />
          )}
        </Stack>

        {/* Progress Indicator */}
        {hasAccount && !isActive && (
          <Box sx={{ mt: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2" color="text.secondary">
                Setup Progress
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {getSetupProgress()}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={getSetupProgress()}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor:
                    getSetupProgress() === 100
                      ? 'success.main'
                      : 'primary.main',
                },
              }}
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Benefits Section - Enhanced Design */}
      {!hasAccount && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Stack spacing={3}>
            <Box textAlign="center" color="white">
              <Zap className="h-12 w-12 mx-auto mb-2" />
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Get Paid Directly with Stripe
              </Typography>
              <Typography
                variant="body1"
                sx={{ opacity: 0.9, maxWidth: 600, mx: 'auto' }}
              >
                Connect your Stripe account to receive payments instantly. Keep
                full control of your money with direct deposits to your bank.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                gap: 2,
                mt: 3,
              }}
            >
              {[
                {
                  icon: <Banknote className="h-5 w-5" />,
                  title: 'Direct Deposits',
                  description: 'Money goes straight to your bank account',
                },
                {
                  icon: <Shield className="h-5 w-5" />,
                  title: 'Secure & Trusted',
                  description: 'Industry-leading security by Stripe',
                },
                {
                  icon: <Clock className="h-5 w-5" />,
                  title: 'Fast Payouts',
                  description: 'Get paid as fast as 2 business days',
                },
                {
                  icon: <CreditCard className="h-5 w-5" />,
                  title: 'Full Dashboard',
                  description: 'Access detailed reports and analytics',
                },
              ].map((benefit, index) => (
                <Paper
                  key={index}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: 2,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        color: 'primary.main',
                        bgcolor: 'primary.lighter',
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Box flex={1}>
                      <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        gutterBottom
                      >
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Main Content */}
      <Box>
        {hasAccount ? (
          <ConnectStatusDashboard connectInfo={connectInfo} />
        ) : (
          <ConnectOnboardingFlow />
        )}
      </Box>

      {/* Development Notice - Enhanced */}
      {process.env.NODE_ENV === 'development' && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'info.lighter',
            border: '1px solid',
            borderColor: 'info.light',
          }}
        >
          <Stack direction="row" spacing={2}>
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <Box>
              <Typography
                variant="subtitle2"
                color="info.dark"
                fontWeight="bold"
                gutterBottom
              >
                Test Mode Active
              </Typography>
              <Typography variant="body2" color="info.dark">
                You&apos;re in development mode. All transactions will use
                Stripe&apos;s test environment. No real payments will be
                processed.
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

function ConnectContentSkeleton() {
  return (
    <Stack spacing={4}>
      {/* Header Skeleton */}
      <Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Skeleton variant="text" width={280} height={40} />
            <Skeleton variant="text" width={400} height={24} />
          </Box>
          <Skeleton variant="rounded" width={120} height={32} />
        </Stack>

        {/* Progress Skeleton */}
        <Box sx={{ mt: 3 }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Skeleton variant="text" width={100} height={20} />
            <Skeleton variant="text" width={40} height={20} />
          </Stack>
          <Skeleton variant="rounded" width="100%" height={8} />
        </Box>
      </Box>

      <Divider />

      {/* Benefits Card Skeleton */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: 'grey.100' }}>
        <Stack spacing={3} alignItems="center">
          <Skeleton variant="circular" width={48} height={48} />
          <Skeleton variant="text" width={300} height={32} />
          <Skeleton variant="text" width={500} height={24} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
              width: '100%',
              mt: 3,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <Paper key={i} elevation={0} sx={{ p: 2.5, bgcolor: 'white' }}>
                <Stack direction="row" spacing={2}>
                  <Skeleton variant="rounded" width={36} height={36} />
                  <Box flex={1}>
                    <Skeleton variant="text" width={120} height={24} />
                    <Skeleton variant="text" width="100%" height={20} />
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>

      {/* Main Content Skeleton */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="text" width="100%" height={20} />
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="rounded" width={140} height={40} />
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function StripeConnectPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Suspense fallback={<ConnectContentSkeleton />}>
        <ConnectContent />
      </Suspense>
    </Container>
  );
}
