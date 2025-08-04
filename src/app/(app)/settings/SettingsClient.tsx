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
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';
import { WorkingHoursSettings } from '@/components/appointments/WorkingHoursSettings';
import { CalendarSettings } from '@/components/appointments/CalendarSettings';

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
  const [paymentPreference, setPaymentPreference] = useState('after');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = () => {
    // TODO: Handle save
    console.log('Settings saved');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="General" />
          <Tab label="Calendar" />
          <Tab label="Billing" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Business Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    defaultValue="Sarah's Alterations"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    defaultValue="(555) 111-2222"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    defaultValue="sarah@alterations.com"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    defaultValue="123 Main St, City, State 12345"
                    variant="outlined"
                    multiline
                    rows={2}
                  />
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
                  <MenuItem value="before">
                    Payment required before service
                  </MenuItem>
                  <MenuItem value="after">
                    Payment after service completion
                  </MenuItem>
                  <MenuItem value="mixed">Decide per order</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                This sets the default payment preference for new orders. You can
                override this for individual orders.
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
            <Button variant="contained" size="large" onClick={handleSave}>
              Save Settings
            </Button>
          </Box>
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
      </Box>
    </Container>
  );
}
