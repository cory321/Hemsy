'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Paper,
	Typography,
	CircularProgress,
	Alert,
	Button,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { EmailTemplate, EmailType } from '@/types/email';
import { previewEmailTemplate } from '@/lib/actions/emails';
import { EMAIL_TYPE_LABELS } from '@/lib/utils/email/constants';

// Email types that are sent to seamstresses
const SEAMSTRESS_EMAIL_TYPES = [
	'appointment_rescheduled_seamstress',
	'appointment_canceled_seamstress',
	'appointment_confirmed',
] as const;

interface EmailTemplateViewerProps {
	template: EmailTemplate;
	onClose: () => void;
}

export function EmailTemplateViewer({
	template,
	onClose,
}: EmailTemplateViewerProps) {
	const [preview, setPreview] = useState<string>('');
	const [renderedSubject, setRenderedSubject] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const generatePreview = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await previewEmailTemplate(template.email_type, {
					subject: template.subject,
					body: template.body,
				});

				if (result.success && result.data?.html) {
					setPreview(result.data.html);
					// Use the rendered subject which has variables replaced
					setRenderedSubject(result.data.subject || template.subject);
				} else {
					throw new Error('Failed to generate preview');
				}
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to generate preview'
				);
			} finally {
				setIsLoading(false);
			}
		};

		generatePreview();
	}, [template]);

	return (
		<Box>
			{/* Header */}
			<Box mb={3}>
				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<Button startIcon={<BackIcon />} onClick={onClose} variant="outlined">
						Back
					</Button>
					<Typography variant="h6">
						{EMAIL_TYPE_LABELS[template.email_type]} Template Preview
					</Typography>
				</Box>

				{/* Info Text */}
				<Box mb={2}>
					<Alert severity="info">
						{SEAMSTRESS_EMAIL_TYPES.includes(template.email_type as any)
							? 'This is a preview of how the email will appear when sent to you.'
							: 'This is a preview of how the email will appear when sent to clients.'}
					</Alert>
				</Box>

				<Paper sx={{ p: 2, width: '100%' }}>
					<Typography variant="body1">
						<strong>Subject:</strong> {renderedSubject || template.subject}
					</Typography>
				</Paper>
			</Box>

			{/* Preview */}
			<Paper
				sx={{
					p: 0,
					height: 'calc(100vh - 200px)',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				{isLoading ? (
					<Box
						display="flex"
						justifyContent="center"
						alignItems="center"
						height="100%"
					>
						<CircularProgress />
					</Box>
				) : error ? (
					<Alert severity="error" sx={{ m: 2 }}>
						{error}
					</Alert>
				) : (
					<iframe
						srcDoc={preview}
						style={{
							width: '100%',
							height: '100%',
							border: 'none',
						}}
						title="Email Preview"
					/>
				)}
			</Paper>
		</Box>
	);
}
