# Phase 3.1: Settings Integration

## Overview

Add the email section to the existing Settings page with tabs for templates, preferences, and logs.

## Prerequisites

- [ ] Server Actions implemented (Phase 2.3)
- [ ] Settings page exists
- [ ] Material UI configured

## Steps

### 1. Update Settings Client Component

Update `app/(app)/settings/SettingsClient.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Store as StoreIcon,
  Email as EmailIcon,
  // ... other icons
} from '@mui/icons-material';

// Import email components
import { EmailSettingsSection } from './components/emails/EmailSettingsSection';

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

export default function SettingsClient() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<StoreIcon />} label="Shop" />
          <Tab icon={<EmailIcon />} label="Emails" />
          {/* Other tabs */}
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {/* Profile settings */}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {/* Shop settings */}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <EmailSettingsSection />
        </TabPanel>

        {/* Other tab panels */}
      </Paper>
    </Container>
  );
}
```

### 2. Create Email Settings Section

Create `app/(app)/settings/components/emails/EmailSettingsSection.tsx`:

```typescript
'use client';

import { useState } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Alert
} from '@mui/material';
import {
  TextFields as TemplatesIcon,
  Settings as PreferencesIcon,
  History as LogsIcon
} from '@mui/icons-material';

import { EmailTemplateManager } from './templates/EmailTemplateManager';
import { EmailPreferences } from './preferences/EmailPreferences';
import { EmailActivityLog } from './monitoring/EmailActivityLog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
      sx={{ pt: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

export function EmailSettingsSection() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Customize email templates and manage email preferences for your shop.
      </Alert>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="email settings tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<TemplatesIcon />}
            label="Templates"
            iconPosition="start"
          />
          <Tab
            icon={<PreferencesIcon />}
            label="Preferences"
            iconPosition="start"
          />
          <Tab
            icon={<LogsIcon />}
            label="Email Logs"
            iconPosition="start"
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={activeTab} index={0}>
            <EmailTemplateManager />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <EmailPreferences />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <EmailActivityLog />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
```

### 3. Create Email Template Manager

Create `app/(app)/settings/components/emails/templates/EmailTemplateManager.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

import { getEmailTemplates, resetEmailTemplate } from '@/lib/actions/emails';
import { EmailTemplate } from '@/types/email';
import { EMAIL_TYPE_LABELS } from '@/lib/utils/email/constants';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { useToast } from '@/hooks/useToast';

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getEmailTemplates();

      if (!result.success) {
        throw new Error(result.error);
      }

      setTemplates(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (template: EmailTemplate) => {
    if (!confirm('Are you sure you want to reset this template to default?')) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await resetEmailTemplate(template.email_type);

        if (!result.success) {
          throw new Error(result.error);
        }

        showToast('Template reset to default', 'success');
        loadTemplates(); // Reload templates
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to reset template',
          'error'
        );
      }
    });
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
  };

  const handleEditClose = () => {
    setEditingTemplate(null);
    loadTemplates(); // Reload to show updates
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadTemplates}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  if (editingTemplate) {
    return (
      <EmailTemplateEditor
        template={editingTemplate}
        onClose={handleEditClose}
      />
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Email Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Customize the email templates sent to clients and yourself. Use variables like {'{client_name}'} to personalize emails.
      </Typography>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="subtitle1" component="h3">
                    {EMAIL_TYPE_LABELS[template.email_type]}
                  </Typography>
                  {!template.is_default && (
                    <Chip label="Customized" size="small" color="primary" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" noWrap>
                  Subject: {template.subject}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {template.body}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEdit(template)}
                >
                  Edit
                </Button>
                {!template.is_default && (
                  <Button
                    size="small"
                    startIcon={<ResetIcon />}
                    onClick={() => handleReset(template)}
                    disabled={isPending}
                  >
                    Reset
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
```

### 4. Create Email Preferences Component

Create `app/(app)/settings/components/emails/preferences/EmailPreferences.tsx`:

```typescript
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';

import {
  getUserEmailSettings,
  updateUserEmailSettings,
  testEmailDelivery
} from '@/lib/actions/emails';
import { UserEmailSettingsSchema } from '@/lib/validations/email';
import { UserEmailSettings } from '@/types/email';
import { useToast } from '@/hooks/useToast';

type FormData = {
  receive_appointment_notifications: boolean;
  email_signature: string;
  reply_to_email: string;
};

export function EmailPreferences() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const { showToast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(UserEmailSettingsSchema),
    defaultValues: {
      receive_appointment_notifications: true,
      email_signature: '',
      reply_to_email: ''
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getUserEmailSettings();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data) {
        form.reset({
          receive_appointment_notifications: result.data.receive_appointment_notifications,
          email_signature: result.data.email_signature || '',
          reply_to_email: result.data.reply_to_email || ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const result = await updateUserEmailSettings({
          receive_appointment_notifications: data.receive_appointment_notifications,
          email_signature: data.email_signature || null,
          reply_to_email: data.reply_to_email || null
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        showToast('Email preferences saved', 'success');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to save preferences',
          'error'
        );
      }
    });
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    try {
      const result = await testEmailDelivery();

      if (!result.success) {
        throw new Error(result.error);
      }

      showToast('Test email sent! Check your inbox.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to send test email',
        'error'
      );
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadSettings}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Email Preferences
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Notification Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  {...form.register('receive_appointment_notifications')}
                  checked={form.watch('receive_appointment_notifications')}
                />
              }
              label="Receive appointment notification emails"
            />

            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Get notified when appointments are scheduled, rescheduled, or confirmed by clients.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Email Configuration
            </Typography>

            <TextField
              fullWidth
              label="Reply-To Email (Optional)"
              type="email"
              {...form.register('reply_to_email')}
              error={!!form.formState.errors.reply_to_email}
              helperText={
                form.formState.errors.reply_to_email?.message ||
                'Email address where client replies will be sent'
              }
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Email Signature (Optional)"
              {...form.register('email_signature')}
              error={!!form.formState.errors.email_signature}
              helperText={
                form.formState.errors.email_signature?.message ||
                'Added to the end of all emails (max 500 characters)'
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Test Email Delivery
            </Typography>

            <Typography variant="body2" color="text.secondary" paragraph>
              Send a test email to verify your email configuration is working correctly.
            </Typography>

            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={handleTestEmail}
              disabled={isTesting}
            >
              {isTesting ? 'Sending...' : 'Send Test Email'}
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
```

### 5. Create Email Activity Log Component

Create `app/(app)/settings/components/emails/monitoring/EmailActivityLog.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Send as ResendIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';

import { getEmailLogs } from '@/lib/actions/emails';
import { EmailLog, EmailStatus } from '@/types/email';
import {
  EMAIL_TYPE_LABELS,
  EMAIL_STATUS_LABELS,
  EMAIL_STATUS_COLORS
} from '@/lib/utils/email/constants';
import { EmailLogDetails } from './EmailLogDetails';

export function EmailActivityLog() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    emailType: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    page: 0,
    rowsPerPage: 10
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getEmailLogs({
        status: filters.status || undefined,
        emailType: filters.emailType || undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        limit: filters.rowsPerPage,
        offset: filters.page * filters.rowsPerPage
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setLogs(result.data?.logs || []);
      setTotal(result.data?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const getStatusChip = (status: EmailStatus) => {
    return (
      <Chip
        label={EMAIL_STATUS_LABELS[status]}
        size="small"
        color={EMAIL_STATUS_COLORS[status] as any}
      />
    );
  };

  if (selectedLog) {
    return (
      <EmailLogDetails
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onResend={() => {
          setSelectedLog(null);
          loadLogs();
        }}
      />
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Email Activity
        </Typography>
        <IconButton onClick={loadLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  status: e.target.value,
                  page: 0
                }))}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="bounced">Bounced</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Email Type"
                value={filters.emailType}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  emailType: e.target.value,
                  page: 0
                }))}
              >
                <MenuItem value="">All</MenuItem>
                {Object.entries(EMAIL_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  startDate: date,
                  page: 0
                }))}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  endDate: date,
                  page: 0
                }))}
                slotProps={{
                  textField: { fullWidth: true }
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadLogs}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      ) : logs.length === 0 ? (
        <Alert severity="info">
          No emails found matching your filters.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell>
                    {EMAIL_TYPE_LABELS[log.email_type]}
                  </TableCell>
                  <TableCell>{log.recipient_email}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {log.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(log.status)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedLog(log)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {log.status === 'failed' && log.attempts < 5 && (
                      <Tooltip title="Resend">
                        <IconButton size="small">
                          <ResendIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={filters.rowsPerPage}
            page={filters.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}
    </Box>
  );
}
```

### 6. Update Theme for Email Components (Optional)

If needed, extend Material UI theme:

```typescript
// src/styles/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  // ... existing theme
  components: {
    // ... existing overrides
    MuiChip: {
      styleOverrides: {
        colorSuccess: {
          backgroundColor: '#10b981',
          color: '#fff',
        },
        colorError: {
          backgroundColor: '#ef4444',
          color: '#fff',
        },
        colorWarning: {
          backgroundColor: '#f59e0b',
          color: '#fff',
        },
      },
    },
  },
});
```

## Testing

1. **Navigate to Settings**:
   - Go to `/settings`
   - Click on "Emails" tab
   - Verify all three sub-tabs appear

2. **Test Templates Tab**:
   - All email types should show
   - Edit button should open editor
   - Reset should work for customized templates

3. **Test Preferences Tab**:
   - Settings should load
   - Changes should save
   - Test email should send

4. **Test Logs Tab**:
   - Filters should work
   - Pagination should work
   - Details view should open

## Common Issues

| Issue                | Solution                            |
| -------------------- | ----------------------------------- |
| Tabs not showing     | Check Material UI imports           |
| Data not loading     | Verify Server Actions are working   |
| Styles broken        | Ensure theme provider is configured |
| Mobile layout issues | Test responsive breakpoints         |

## Next Steps

Proceed to [Template Editor](./8-template-editor.md)
