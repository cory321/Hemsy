'use client';

import { useState } from 'react';
import { Box, Tab, Tabs, Paper, Alert } from '@mui/material';
import {
  TextFields as TemplatesIcon,
  Settings as PreferencesIcon,
  History as LogsIcon,
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
          <Tab icon={<LogsIcon />} label="Email Logs" iconPosition="start" />
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
