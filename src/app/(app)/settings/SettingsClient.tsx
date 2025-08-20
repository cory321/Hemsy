'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Tabs,
  Tab,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Email as EmailIcon,
  Payment as PaymentIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useState, useEffect, useTransition } from 'react';
import { WorkingHoursSettings } from '@/components/appointments/WorkingHoursSettings';
import { CalendarSettings } from '@/components/appointments/CalendarSettings';
import { EmailSettingsSection } from './components/emails/EmailSettingsSection';
import {
  getShopBusinessInfo,
  updateShopBusinessInfo,
} from '@/lib/actions/shops';
import { useToast } from '@/hooks/useToast';
import PastelColorPicker from '@/components/ui/PastelColorPicker';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function SettingsClient() {
  const [tabValue, setTabValue] = useState(0);
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState('after_service');
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    email: '',
    phone_number: '',
    mailing_address: '',
    location_type: 'shop_location' as
      | 'home_based'
      | 'shop_location'
      | 'mobile_service',
    payment_preference: 'after_service' as 'upfront' | 'after_service',
  });
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBusinessInfo();
  }, []);

  const loadBusinessInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getShopBusinessInfo();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data) {
        setBusinessInfo({
          business_name: result.data.business_name || '',
          email: result.data.email || '',
          phone_number: result.data.phone_number || '',
          mailing_address: result.data.mailing_address || '',
          location_type: result.data.location_type || 'shop_location',
          payment_preference: result.data.payment_preference || 'after_service',
        });
        setPaymentPreference(result.data.payment_preference || 'after_service');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load business information'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveBusinessInfo = () => {
    startTransition(async () => {
      try {
        const result = await updateShopBusinessInfo({
          ...businessInfo,
          payment_preference: paymentPreference as 'upfront' | 'after_service',
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        showToast('Business information saved successfully', 'success');
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'Failed to save business information',
          'error'
        );
      }
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="General" />
          <Tab icon={<ScheduleIcon />} label="Calendar" />
          <Tab icon={<EmailIcon />} label="Emails" />
          <Tab icon={<PaymentIcon />} label="Billing" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={loadBusinessInfo}>
                  Retry
                </Button>
              }
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Business Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Business Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Business Name"
                        value={businessInfo.business_name}
                        onChange={(e) =>
                          setBusinessInfo({
                            ...businessInfo,
                            business_name: e.target.value,
                          })
                        }
                        variant="outlined"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={businessInfo.phone_number}
                        onChange={(e) =>
                          setBusinessInfo({
                            ...businessInfo,
                            phone_number: e.target.value,
                          })
                        }
                        variant="outlined"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={businessInfo.email}
                        onChange={(e) =>
                          setBusinessInfo({
                            ...businessInfo,
                            email: e.target.value,
                          })
                        }
                        variant="outlined"
                        type="email"
                      />
                    </Grid>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        value={businessInfo.mailing_address}
                        onChange={(e) =>
                          setBusinessInfo({
                            ...businessInfo,
                            mailing_address: e.target.value,
                          })
                        }
                        variant="outlined"
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Location Type</InputLabel>
                        <Select
                          value={businessInfo.location_type}
                          label="Location Type"
                          onChange={(e) =>
                            setBusinessInfo({
                              ...businessInfo,
                              location_type: e.target.value as any,
                            })
                          }
                        >
                          <MenuItem value="shop_location">
                            Shop Location
                          </MenuItem>
                          <MenuItem value="home_based">Home Based</MenuItem>
                          <MenuItem value="mobile_service">
                            Mobile Service
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Preferences */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Preferences
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Default Payment Timing</InputLabel>
                    <Select
                      value={paymentPreference}
                      label="Default Payment Timing"
                      onChange={(e) => setPaymentPreference(e.target.value)}
                    >
                      <MenuItem value="upfront">
                        Payment required before service
                      </MenuItem>
                      <MenuItem value="after_service">
                        Payment after service completion
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary">
                    This sets the default payment preference for new orders. You
                    can override this for individual orders.
                  </Typography>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={emailReminders}
                        onChange={(e) => setEmailReminders(e.target.checked)}
                      />
                    }
                    label="Email reminders for appointments"
                    sx={{ display: 'block', mb: 2 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={smsReminders}
                        onChange={(e) => setSmsReminders(e.target.checked)}
                      />
                    }
                    label="SMS reminders for appointments (coming soon)"
                    sx={{ display: 'block' }}
                    disabled
                  />
                </CardContent>
              </Card>

              {/* Save Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSaveBusinessInfo}
                  disabled={isPending}
                  startIcon={<SaveIcon />}
                >
                  {isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Working Hours */}
          <WorkingHoursSettings />

          <Box sx={{ mt: 3 }}>
            {/* Calendar Settings */}
            <CalendarSettings />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <EmailSettingsSection />
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Subscription */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box>
                  <Typography>Current Plan: Professional</Typography>
                  <Typography variant="body2" color="text.secondary">
                    $29/month • Next billing date: Feb 1, 2024
                  </Typography>
                </Box>
                <Button variant="outlined">Manage Subscription</Button>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Need help? Contact support at support@threadfolio.com
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Container>
  );
}
