'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAccountLink,
  getConnectAccountStatus,
  updateConnectAccountWithTestData,
} from '@/lib/actions/stripe-connect';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  CreditCard,
  Banknote,
  Settings,
  Shield,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Info,
  ChevronRight,
  FileText,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Stack,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  IconButton,
  Tooltip,
  Collapse,
  Link,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';

interface ConnectInfo {
  accountId: string | null;
  status: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: any;
  capabilities: any;
}

interface ConnectStatusDashboardProps {
  connectInfo: ConnectInfo;
}

interface StatusCardProps {
  title: string;
  enabled: boolean;
  icon: React.ReactNode;
  description: string;
}

function StatusCard({ title, enabled, icon, description }: StatusCardProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        border: '2px solid',
        borderColor: enabled ? 'success.main' : 'divider',
        backgroundColor: enabled
          ? alpha(theme.palette.success.main, 0.04)
          : 'background.paper',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: enabled ? 'success.lighter' : 'grey.100',
              color: enabled ? 'success.main' : 'grey.600',
              display: 'flex',
            }}
          >
            {icon}
          </Box>
          {enabled ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-gray-400" />
          )}
        </Stack>
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
        <Chip
          label={enabled ? 'Active' : 'Inactive'}
          color={enabled ? 'success' : 'default'}
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        />
      </Stack>
    </Paper>
  );
}

export function ConnectStatusDashboard({
  connectInfo: initialConnectInfo,
}: ConnectStatusDashboardProps) {
  const [connectInfo, setConnectInfo] = useState(initialConnectInfo);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isUpdatingTestData, setIsUpdatingTestData] = useState(false);
  const [showAllCapabilities, setShowAllCapabilities] = useState(false);
  const { toast } = useToast();
  const theme = useTheme();

  const getOverallStatus = () => {
    if (connectInfo.chargesEnabled && connectInfo.payoutsEnabled)
      return 'active';
    if (connectInfo.status === 'pending') return 'pending';
    if (connectInfo.status === 'restricted') return 'restricted';
    return 'incomplete';
  };

  const overallStatus = getOverallStatus();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          color: 'success' as const,
          icon: <CheckCircle className="h-5 w-5" />,
          label: 'Fully Active',
          description: 'Your account is ready to accept payments',
          bgColor: alpha(theme.palette.success.main, 0.08),
        };
      case 'pending':
        return {
          color: 'warning' as const,
          icon: <Clock className="h-5 w-5" />,
          label: 'Verification Pending',
          description: 'Stripe is reviewing your information',
          bgColor: alpha(theme.palette.warning.main, 0.08),
        };
      case 'restricted':
        return {
          color: 'error' as const,
          icon: <AlertTriangle className="h-5 w-5" />,
          label: 'Action Required',
          description: 'Your account has restrictions that need attention',
          bgColor: alpha(theme.palette.error.main, 0.08),
        };
      default:
        return {
          color: 'default' as const,
          icon: <AlertCircle className="h-5 w-5" />,
          label: 'Setup Incomplete',
          description: 'Complete setup to start accepting payments',
          bgColor: alpha(theme.palette.grey[500], 0.08),
        };
    }
  };

  const statusConfig = getStatusConfig(overallStatus);

  const handleRefreshStatus = async () => {
    if (!connectInfo.accountId) return;

    setIsRefreshing(true);
    try {
      const result = await getConnectAccountStatus(connectInfo.accountId);
      if (result.success && result.status) {
        setConnectInfo({
          accountId: connectInfo.accountId,
          status: result.status.charges_enabled ? 'active' : 'pending',
          chargesEnabled: result.status.charges_enabled,
          payoutsEnabled: result.status.payouts_enabled,
          requirements: result.status.requirements,
          capabilities: result.status.capabilities,
        });
        toast({
          title: 'Status Updated',
          description: 'Your account status has been refreshed',
        });
      }
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Unable to update account status',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!connectInfo.accountId) return;

    setIsCreatingLink(true);
    try {
      const result = await createAccountLink({
        accountId: connectInfo.accountId,
        type: 'account_onboarding',
      });

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        throw new Error(result.error || 'Failed to create onboarding link');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to continue onboarding',
        variant: 'destructive',
      });
      setIsCreatingLink(false);
    }
  };

  const handleUpdateTestData = async () => {
    setIsUpdatingTestData(true);
    try {
      const result = await updateConnectAccountWithTestData();

      if (result.success) {
        toast({
          title: 'Test Data Added',
          description:
            'Your account has been updated with test data for development. Please refresh to see changes.',
        });
        // Refresh the status after a short delay
        setTimeout(() => {
          handleRefreshStatus();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to update test data');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update account with test data',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingTestData(false);
    }
  };

  const hasRequirements =
    connectInfo.requirements?.currently_due?.length > 0 ||
    connectInfo.requirements?.past_due?.length > 0;

  const quickActions = [
    {
      title: 'Stripe Dashboard',
      description: 'View detailed reports and manage settings',
      icon: <TrendingUp className="h-5 w-5" />,
      action: () => window.open('https://dashboard.stripe.com', '_blank'),
      external: true,
    },
    {
      title: 'Payment History',
      description: 'View all transactions and payouts',
      icon: <FileText className="h-5 w-5" />,
      action: () =>
        window.open('https://dashboard.stripe.com/payments', '_blank'),
      external: true,
    },
    {
      title: 'Bank & Payout Settings',
      description: 'Manage your bank account and payout schedule',
      icon: <DollarSign className="h-5 w-5" />,
      action: () =>
        window.open('https://dashboard.stripe.com/settings/payouts', '_blank'),
      external: true,
    },
  ];

  return (
    <Stack spacing={4}>
      {/* Account Overview Card */}
      <Card elevation={0} sx={{ overflow: 'hidden', borderRadius: 3 }}>
        <Box sx={{ p: 4, backgroundColor: statusConfig.bgColor }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={3}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  boxShadow: 1,
                }}
              >
                {statusConfig.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {statusConfig.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {statusConfig.description}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  Account ID: {connectInfo.accountId}
                </Typography>
              </Box>
            </Stack>
            <Tooltip title="Refresh account status">
              <IconButton
                onClick={handleRefreshStatus}
                disabled={isRefreshing}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Status Grid */}
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StatusCard
                title="Payment Processing"
                enabled={connectInfo.chargesEnabled}
                icon={<CreditCard className="h-6 w-6" />}
                description={
                  connectInfo.chargesEnabled
                    ? 'You can accept payments from customers'
                    : 'Complete setup to accept payments'
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StatusCard
                title="Bank Payouts"
                enabled={connectInfo.payoutsEnabled}
                icon={<Banknote className="h-6 w-6" />}
                description={
                  connectInfo.payoutsEnabled
                    ? 'Payouts to your bank are enabled'
                    : 'Add bank details to receive payouts'
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Requirements Alert */}
      {hasRequirements && (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleContinueOnboarding}
              disabled={isCreatingLink}
              endIcon={
                isCreatingLink ? (
                  <CircularProgress size={16} />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
            >
              Complete Setup
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          <AlertTitle sx={{ fontWeight: 'bold' }}>Action Required</AlertTitle>
          <Typography variant="body2">
            Your account needs additional information to be fully activated.
          </Typography>
          {connectInfo.requirements?.currently_due?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                fontWeight="bold"
                color="warning.dark"
              >
                Required Information:
              </Typography>
              <List dense sx={{ mt: 0.5 }}>
                {connectInfo.requirements.currently_due
                  .slice(0, 3)
                  .map((req: string) => (
                    <ListItem key={req} sx={{ py: 0, pl: 2 }}>
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <ChevronRight className="h-4 w-4" />
                      </ListItemIcon>
                      <ListItemText
                        primary={req
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        primaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                {connectInfo.requirements.currently_due.length > 3 && (
                  <ListItem sx={{ py: 0, pl: 2 }}>
                    <ListItemText
                      primary={`+${connectInfo.requirements.currently_due.length - 3} more items`}
                      primaryTypographyProps={{
                        variant: 'caption',
                        color: 'text.secondary',
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>
          )}
        </Alert>
      )}

      {/* Development Test Data Button */}
      {hasRequirements && process.env.NODE_ENV === 'development' && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: 'warning.lighter',
            border: '1px solid',
            borderColor: 'warning.light',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Settings className="h-5 w-5 text-orange-600" />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="warning.dark"
              >
                Development Mode
              </Typography>
              <Typography variant="body2" color="warning.dark">
                Skip real SSN/document requirements with test data
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={handleUpdateTestData}
              disabled={isUpdatingTestData}
              startIcon={
                isUpdatingTestData ? (
                  <CircularProgress size={16} />
                ) : (
                  <Settings className="h-4 w-4" />
                )
              }
              sx={{
                textTransform: 'none',
                bgcolor: 'warning.main',
                '&:hover': {
                  bgcolor: 'warning.dark',
                },
              }}
            >
              {isUpdatingTestData ? 'Adding Test Data...' : 'Use Test Data'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
          sx={{ mb: 3 }}
        >
          Manage your Stripe account and view important information
        </Typography>

        <List sx={{ mx: -2 }}>
          {quickActions.map((action, index) => (
            <React.Fragment key={action.title}>
              <ListItemButton
                onClick={action.action}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <ListItemIcon>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      backgroundColor: 'primary.lighter',
                      color: 'primary.main',
                      display: 'flex',
                    }}
                  >
                    {action.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={action.title}
                  secondary={action.description}
                  primaryTypographyProps={{ fontWeight: 'medium' }}
                />
                {action.external && (
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                )}
              </ListItemButton>
              {index < quickActions.length - 1 && <Divider sx={{ my: 0.5 }} />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Capabilities Section */}
      {connectInfo.capabilities &&
        Object.keys(connectInfo.capabilities).length > 0 && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Account Capabilities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Features available for your account
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => setShowAllCapabilities(!showAllCapabilities)}
                endIcon={<Activity className="h-4 w-4" />}
              >
                {showAllCapabilities ? 'Show Less' : 'Show All'}
              </Button>
            </Stack>

            <Collapse in={showAllCapabilities} collapsedSize={100}>
              <Grid container spacing={2}>
                {Object.entries(connectInfo.capabilities).map(
                  ([capability, status]) => (
                    <Grid item xs={12} sm={6} md={4} key={capability}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor:
                            status === 'active' ? 'success.main' : 'divider',
                          backgroundColor:
                            status === 'active'
                              ? alpha(theme.palette.success.main, 0.04)
                              : 'transparent',
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {status === 'active' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <Typography
                            variant="body2"
                            fontWeight={
                              status === 'active' ? 'medium' : 'normal'
                            }
                          >
                            {capability
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  )
                )}
              </Grid>
            </Collapse>
          </Paper>
        )}

      {/* Security Notice */}
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
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <Box>
            <Typography
              variant="subtitle2"
              color="info.dark"
              fontWeight="bold"
              gutterBottom
            >
              Your data is secure
            </Typography>
            <Typography variant="body2" color="info.dark">
              Stripe uses industry-leading security standards to protect your
              financial information. All sensitive data is encrypted and
              securely stored.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
