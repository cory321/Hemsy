'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  getTimezoneFriendlyName,
  TIMEZONE_PRESETS,
} from '@/lib/utils/date-time-utc';

interface TimezoneSelectionProps {
  value: string;
  onChange: (timezone: string, offset: number) => void;
}

export function TimezoneSelection({ value, onChange }: TimezoneSelectionProps) {
  const [detectedTimezone, setDetectedTimezone] = useState<string>('');
  const [isDetecting, setIsDetecting] = useState(true);
  const [showManualSelection, setShowManualSelection] = useState(false);

  useEffect(() => {
    // Detect user's timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(tz);

      // If no value is set yet, use the detected timezone
      if (!value && tz) {
        const offset = new Date().getTimezoneOffset();
        onChange(tz, offset);
      }
    } catch (error) {
      console.error('Failed to detect timezone:', error);
    } finally {
      setIsDetecting(false);
    }
  }, [value, onChange]);

  const handleAcceptDetected = () => {
    if (detectedTimezone) {
      const offset = new Date().getTimezoneOffset();
      onChange(detectedTimezone, offset);
    }
  };

  const handleManualChange = (newTimezone: string) => {
    // Calculate offset for the selected timezone
    const offset = new Date().getTimezoneOffset();
    onChange(newTimezone, offset);
  };

  if (isDetecting) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={20} />
        <Typography variant="body2">Detecting your timezone...</Typography>
      </Box>
    );
  }

  // Common US timezones for quick selection
  const commonTimezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST - No DST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Timezone Settings
      </Typography>

      {detectedTimezone && !showManualSelection && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => setShowManualSelection(true)}>
              Change
            </Button>
          }
        >
          We detected your timezone as{' '}
          <strong>{getTimezoneFriendlyName(detectedTimezone)}</strong>
          {value === detectedTimezone && ' ✓'}
        </Alert>
      )}

      {(!detectedTimezone ||
        showManualSelection ||
        value !== detectedTimezone) && (
        <FormControl fullWidth>
          <InputLabel>Select your timezone</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => handleManualChange(e.target.value)}
            label="Select your timezone"
          >
            {commonTimezones.map((tz) => (
              <MenuItem key={tz.value} value={tz.value}>
                {tz.label}
                {tz.value === detectedTimezone && ' (Detected)'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 1, display: 'block' }}
      >
        This ensures appointments and due dates display correctly in your local
        time.
      </Typography>
    </Box>
  );
}
