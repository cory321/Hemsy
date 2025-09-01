'use client';

import {
  Paper,
  Stack,
  Box,
  Typography,
  Button,
  alpha,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

interface AlertCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  onAction?: () => void;
  actionLabel?: string;
  showAction?: boolean;
  onDismiss?: () => void;
}

const severityColors = {
  error: '#D94F40',
  warning: '#F3C164',
  info: '#5c7f8e',
  success: '#5A736C',
} as const;

export function AlertCard({
  icon,
  title,
  description,
  severity,
  onAction,
  actionLabel = 'View all',
  showAction = true,
  onDismiss,
}: AlertCardProps) {
  const color = severityColors[severity];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: `1px solid ${alpha(color, 0.3)}`,
        bgcolor: alpha(color, 0.05),
        borderRadius: 2,
        position: 'relative',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: '#1a1a1a' }}
            >
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#666666' }}>
              {description}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {showAction && onAction && (
            <Button
              size="small"
              sx={{ color, minWidth: 'auto' }}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
          {onDismiss && (
            <IconButton
              size="small"
              onClick={onDismiss}
              sx={{
                color: '#666666',
                '&:hover': {
                  bgcolor: alpha(color, 0.1),
                },
              }}
              aria-label="Dismiss"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
