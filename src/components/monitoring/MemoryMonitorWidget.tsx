'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import { X, AlertTriangle, Activity } from 'lucide-react';
import { useMemoryMonitor } from '@/lib/utils/memory-monitor';
import type { MemoryReport } from '@/lib/utils/memory-monitor';

interface MemoryMonitorWidgetProps {
  /**
   * Show the widget only in development
   */
  developmentOnly?: boolean;
  /**
   * Position of the widget
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /**
   * Auto-hide after this many milliseconds (0 = never)
   */
  autoHideMs?: number;
  /**
   * Send memory reports to error tracking service
   */
  reportToSentry?: boolean;
}

export function MemoryMonitorWidget({
  developmentOnly = true,
  position = 'bottom-right',
  autoHideMs = 0,
  reportToSentry = true,
}: MemoryMonitorWidgetProps) {
  // Start visible in development, hidden in production
  const [isVisible, setIsVisible] = useState(
    process.env.NODE_ENV === 'development' ? true : false
  );
  const [isMinimized, setIsMinimized] = useState(false);

  // Memoize the warning callback to prevent infinite re-renders
  const handleMemoryWarning = useCallback(
    (report: MemoryReport) => {
      // Handle memory warnings
      if (report.warningLevel === 'critical') {
        setIsVisible(true);
        setIsMinimized(false);

        // Report to Sentry if configured
        if (
          reportToSentry &&
          typeof window !== 'undefined' &&
          (window as any).Sentry
        ) {
          (window as any).Sentry.captureMessage(
            'Critical memory usage detected',
            {
              level: 'error',
              extra: {
                memory: report.current,
                message: report.message,
              },
            }
          );
        }
      } else if (report.warningLevel === 'warning') {
        setIsVisible(true);
      }
    },
    [reportToSentry]
  );

  const { stats, report } = useMemoryMonitor(30000, handleMemoryWarning);

  // Auto-hide logic
  useEffect(() => {
    if (isVisible && autoHideMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideMs);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoHideMs]);

  // Don't render in production if developmentOnly is true
  if (developmentOnly && process.env.NODE_ENV === 'production') {
    return null;
  }

  // Don't render if not visible
  if (!isVisible && process.env.NODE_ENV === 'production') {
    return null;
  }

  // In development, always show but allow minimize
  if (process.env.NODE_ENV === 'development' && !isVisible) {
    // Show a small indicator in development
    return (
      <Box
        sx={{
          position: 'fixed',
          [position.includes('bottom') ? 'bottom' : 'top']: 16,
          [position.includes('right') ? 'right' : 'left']: 16,
          zIndex: 9999,
        }}
      >
        <IconButton
          size="small"
          onClick={() => setIsVisible(true)}
          sx={{
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <Activity size={16} />
        </IconButton>
      </Box>
    );
  }

  const memoryPercentage =
    report?.current.usedJSHeapSize && report?.current.jsHeapSizeLimit
      ? (report.current.usedJSHeapSize / report.current.jsHeapSizeLimit) * 100
      : 0;

  const getProgressColor = () => {
    if (report?.warningLevel === 'critical') return 'error';
    if (report?.warningLevel === 'warning') return 'warning';
    return 'primary';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        [position.includes('bottom') ? 'bottom' : 'top']: 16,
        [position.includes('right') ? 'right' : 'left']: 16,
        zIndex: 9999,
        width: isMinimized ? 200 : 320,
        transition: 'width 0.3s',
      }}
    >
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 1,
          boxShadow: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            bgcolor:
              report?.warningLevel === 'critical'
                ? 'error.main'
                : report?.warningLevel === 'warning'
                  ? 'warning.main'
                  : 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {report?.warningLevel !== 'normal' && <AlertTriangle size={16} />}
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Memory Monitor
            </Typography>
          </Box>
          <Box>
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ color: 'inherit', p: 0.5, mr: 0.5 }}
            >
              <Activity size={14} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsVisible(false)}
              sx={{ color: 'inherit', p: 0.5 }}
            >
              <X size={14} />
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={!isMinimized}>
          <Box sx={{ p: 2 }}>
            {/* Memory Usage Bar */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Heap Usage
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {memoryPercentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryPercentage}
                color={getProgressColor()}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>

            {/* Stats */}
            <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
              {stats}
            </Typography>

            {/* Trend */}
            {report?.trend && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mb: 1 }}
              >
                Trend:{' '}
                {report.trend === 'increasing'
                  ? '📈'
                  : report.trend === 'decreasing'
                    ? '📉'
                    : '➡️'}{' '}
                {report.trend}
              </Typography>
            )}

            {/* Warning Message */}
            {report?.message && (
              <Alert
                severity={
                  report.warningLevel === 'critical' ? 'error' : 'warning'
                }
                sx={{
                  py: 0.5,
                  px: 1,
                  '& .MuiAlert-message': { fontSize: '0.75rem' },
                }}
              >
                {report.message}
              </Alert>
            )}

            {/* Additional Info */}
            {report?.current.deviceMemory && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 1 }}
              >
                Device RAM: {report.current.deviceMemory}GB
              </Typography>
            )}
            {report?.current.connectionType && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Connection: {report.current.connectionType}
              </Typography>
            )}
          </Box>
        </Collapse>

        {/* Minimized View */}
        {isMinimized && (
          <Box sx={{ px: 1, pb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={memoryPercentage}
              color={getProgressColor()}
              sx={{ height: 4, borderRadius: 1 }}
            />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.65rem',
                display: 'block',
                mt: 0.5,
                textAlign: 'center',
              }}
            >
              {memoryPercentage.toFixed(0)}% Used
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
