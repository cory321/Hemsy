'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Edit as EditIcon, RestartAlt as ResetIcon } from '@mui/icons-material';

import { getEmailTemplates, resetEmailTemplate } from '@/lib/actions/emails';
import { EmailTemplate } from '@/types/email';
import { EMAIL_TYPE_LABELS } from '@/lib/utils/email/constants';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { useToast } from '@/hooks/useToast';

export function EmailTemplateManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
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
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadTemplates}>
            Retry
          </Button>
        }
      >
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
        Customize the email templates sent to clients and yourself. Use
        variables like {'{client_name}'} to personalize emails.
      </Typography>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid size={{ xs: 12, md: 6 }} key={template.id}>
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
                    WebkitBoxOrient: 'vertical',
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
