'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Paper,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon, Send as ResendIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import { resendEmail } from '@/lib/actions/emails';
import { EmailLog } from '@/types/email';
import {
  EMAIL_TYPE_LABELS,
  EMAIL_STATUS_LABELS,
  EMAIL_STATUS_COLORS,
} from '@/lib/utils/email/constants';
import { useToast } from '@/hooks/useToast';

interface EmailLogDetailsProps {
  log: EmailLog;
  onClose: () => void;
  onResend: () => void;
}

export function EmailLogDetails({
  log,
  onClose,
  onResend,
}: EmailLogDetailsProps) {
  const [isResending, setIsResending] = useState(false);
  const { showToast } = useToast();

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await resendEmail(log.id);

      if (!result.success) {
        throw new Error(result.error);
      }

      showToast('Email queued for resending', 'success');
      onResend();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to resend email',
        'error'
      );
    } finally {
      setIsResending(false);
    }
  };

  const getStatusChip = () => {
    return (
      <Chip
        label={EMAIL_STATUS_LABELS[log.status]}
        size="small"
        color={EMAIL_STATUS_COLORS[log.status] as any}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<BackIcon />} onClick={onClose} variant="outlined">
          Back to Logs
        </Button>
        <Typography variant="h6">Email Details</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Email Information
          </Typography>

          <Box display="grid" gridTemplateColumns="200px 1fr" gap={2} mb={2}>
            <Typography variant="body2" color="text.secondary">
              Type:
            </Typography>
            <Typography variant="body2">
              {EMAIL_TYPE_LABELS[log.email_type]}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Status:
            </Typography>
            <Box>{getStatusChip()}</Box>

            <Typography variant="body2" color="text.secondary">
              Recipient:
            </Typography>
            <Typography variant="body2">
              {log.recipient_name} ({log.recipient_email})
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Created:
            </Typography>
            <Typography variant="body2">
              {format(new Date(log.created_at), 'PPpp')}
            </Typography>

            {log.sent_at && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Sent:
                </Typography>
                <Typography variant="body2">
                  {format(new Date(log.sent_at), 'PPpp')}
                </Typography>
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              Attempts:
            </Typography>
            <Typography variant="body2">{log.attempts}</Typography>

            {log.resend_id && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Resend ID:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {log.resend_id}
                </Typography>
              </>
            )}
          </Box>

          {log.last_error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Last Error:</Typography>
              <Typography variant="body2">{log.last_error}</Typography>
            </Alert>
          )}

          {log.status === 'failed' && log.attempts < 5 && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<ResendIcon />}
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend Email'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Subject
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2">{log.subject}</Typography>
          </Paper>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Email Content
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {log.body}
            </Typography>
          </Paper>
        </CardContent>
      </Card>

      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Metadata
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
