'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Visibility as PreviewIcon,
  Send as SendIcon,
} from '@mui/icons-material';

import {
  updateEmailTemplate,
  previewEmailTemplate,
  getTemplateVariables,
  testEmailTemplate,
} from '@/lib/actions/emails';
import { EmailTemplate } from '@/types/email';
import { UpdateEmailTemplateSchema } from '@/lib/validations/email';
import { EMAIL_TYPE_LABELS } from '@/lib/utils/email/constants';
import { useToast } from '@/hooks/useToast';

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  onClose: () => void;
}

type FormData = {
  subject: string;
  body: string;
};

export function EmailTemplateEditor({
  template,
  onClose,
}: EmailTemplateEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [preview, setPreview] = useState<{
    subject: string;
    body: string;
    variables: string[];
  } | null>(null);
  const [variables, setVariables] = useState<
    Array<{ key: string; description: string; example: string }>
  >([]);
  const { showToast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(
      UpdateEmailTemplateSchema.pick({ subject: true, body: true })
    ),
    defaultValues: {
      subject: template.subject,
      body: template.body,
    },
  });

  // Load variables on component mount
  useEffect(() => {
    loadVariables();
  }, [template.email_type]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVariables = async () => {
    try {
      const result = await getTemplateVariables(template.email_type);
      if (result.success && result.data) {
        setVariables(result.data);
      }
    } catch (err) {
      console.error('Failed to load variables:', err);
    }
  };

  const saveTemplate = async (data: FormData) => {
    try {
      const result = await updateEmailTemplate({
        emailType: template.email_type,
        subject: data.subject,
        body: data.body,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await saveTemplate(data);
        showToast('Template updated successfully', 'success');
        onClose();
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to update template',
          'error'
        );
      }
    });
  };

  const handlePreview = async () => {
    const formData = form.getValues();
    setIsGeneratingPreview(true);
    try {
      const result = await previewEmailTemplate(template.email_type, formData);
      if (result.success && result.data) {
        setPreview(result.data);
        showToast('Preview generated successfully', 'success');
      } else {
        // Handle server-side errors
        showToast(result.error || 'Failed to generate preview', 'error');
        console.error('Preview failed:', result.error);
      }
    } catch (err) {
      // Handle client-side errors
      showToast('Failed to generate preview', 'error');
      console.error('Preview error:', err);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    try {
      // First save any pending changes
      if (form.formState.isDirty) {
        const formData = form.getValues();
        try {
          await saveTemplate(formData);
          // Reset form state to mark as not dirty
          form.reset(formData);
          showToast('Template saved', 'success');
        } catch (saveError) {
          showToast(
            saveError instanceof Error
              ? saveError.message
              : 'Failed to save template',
            'error'
          );
          return; // Don't proceed with sending test email if save failed
        }
      }

      const result = await testEmailTemplate(template.email_type);
      if (result.success) {
        showToast('Test email sent! Check your inbox.', 'success');
      } else {
        showToast(result.error || 'Failed to send test email', 'error');
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to send test email',
        'error'
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<BackIcon />} onClick={onClose} variant="outlined">
          Back
        </Button>
        <Typography variant="h6">
          Edit {EMAIL_TYPE_LABELS[template.email_type]} Template
        </Typography>
      </Box>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Template Content
            </Typography>

            <TextField
              fullWidth
              label="Subject"
              {...form.register('subject')}
              error={!!form.formState.errors.subject}
              helperText={form.formState.errors.subject?.message}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={10}
              label="Body"
              {...form.register('body')}
              error={!!form.formState.errors.body}
              helperText={
                form.formState.errors.body?.message ||
                'Use variables like {client_name} to personalize emails'
              }
              sx={{ mb: 2 }}
            />

            <Box display="flex" gap={2}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? 'Saving...' : 'Save Template'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
                disabled={isGeneratingPreview}
              >
                {isGeneratingPreview ? 'Generating...' : 'Preview'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<SendIcon />}
                onClick={handleSendTest}
                disabled={isSendingTest}
              >
                {isSendingTest ? 'Sending...' : 'Send Test Email'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Available Variables */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Available Variables
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Click on a variable to copy it to your clipboard:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {variables.map((variable) => (
                <Chip
                  key={variable.key}
                  label={`{${variable.key}}`}
                  clickable
                  onClick={() => {
                    navigator.clipboard.writeText(`{${variable.key}}`);
                    showToast('Variable copied to clipboard', 'success');
                  }}
                  title={`${variable.description} - Example: ${variable.example}`}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Preview with Sample Data
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Subject:
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}
              >
                <Typography variant="body2">{preview.subject}</Typography>
              </Paper>
              <Typography variant="subtitle2" gutterBottom>
                Body:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {preview.body}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        )}
      </form>
    </Box>
  );
}
