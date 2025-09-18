'use client';

import { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Typography,
	CircularProgress,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Chip,
	IconButton,
	Tooltip,
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

import { getEmailTemplates } from '@/lib/actions/emails';
import { EmailTemplate } from '@/types/email';
import { EMAIL_TYPE_LABELS } from '@/lib/utils/email/constants';
import { EmailTemplateViewer } from './EmailTemplateViewer';
import { useToast } from '@/hooks/useToast';

// Email types that are sent to clients
const CLIENT_EMAIL_TYPES = [
	'appointment_scheduled',
	'appointment_rescheduled',
	'appointment_canceled',
	'appointment_reminder',
	'payment_link',
	'payment_received',
	'invoice_sent',
	'appointment_no_show',
] as const;

// Email types that are sent to seamstresses
const SEAMSTRESS_EMAIL_TYPES = [
	'appointment_rescheduled_seamstress',
	'appointment_canceled_seamstress',
	'appointment_confirmed',
] as const;

export function EmailTemplateManager() {
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [viewingTemplate, setViewingTemplate] = useState<EmailTemplate | null>(
		null
	);
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

	const handleView = (template: EmailTemplate) => {
		setViewingTemplate(template);
	};

	const handleViewClose = () => {
		setViewingTemplate(null);
	};

	// Filter templates by recipient type
	const clientTemplates = templates.filter((template) =>
		CLIENT_EMAIL_TYPES.includes(template.email_type as any)
	);

	const seamstressTemplates = templates.filter((template) =>
		SEAMSTRESS_EMAIL_TYPES.includes(template.email_type as any)
	);

	// Reusable table component
	const renderTemplateTable = (
		tableTemplates: EmailTemplate[],
		title: string,
		description: string
	) => (
		<Box sx={{ mb: 4 }}>
			<Typography variant="h5" gutterBottom>
				{title}
			</Typography>
			<Typography variant="body2" color="text.secondary" paragraph>
				{description}
			</Typography>

			<TableContainer component={Paper} sx={{ mt: 2 }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Template</TableCell>
							<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
								Subject
							</TableCell>
							<TableCell align="center">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{tableTemplates.map((template) => (
							<TableRow
								key={template.id}
								hover
								onClick={() => handleView(template)}
								sx={{
									cursor: 'pointer',
									'&:hover': {
										backgroundColor: 'action.hover',
									},
								}}
							>
								<TableCell>
									<Box>
										<Typography variant="subtitle2" fontWeight="medium">
											{EMAIL_TYPE_LABELS[template.email_type]}
										</Typography>
										{/* Show subject on mobile */}
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												display: { xs: 'block', md: 'none' },
												mt: 0.5,
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{template.subject}
										</Typography>
									</Box>
								</TableCell>
								<TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
									<Typography
										variant="body2"
										sx={{
											maxWidth: 300,
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{template.subject}
									</Typography>
								</TableCell>
								<TableCell align="center">
									<Tooltip title="Preview template">
										<IconButton
											size="small"
											onClick={(e) => {
												e.stopPropagation();
												handleView(template);
											}}
										>
											<ViewIcon />
										</IconButton>
									</Tooltip>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);

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

	if (viewingTemplate) {
		return (
			<EmailTemplateViewer
				template={viewingTemplate}
				onClose={handleViewClose}
			/>
		);
	}

	return (
		<Box>
			{/* Client Email Templates */}
			{renderTemplateTable(
				clientTemplates,
				'Emails Sent to Clients',
				'Templates sent to your clients for appointments, payments, and confirmations.'
			)}

			{/* Seamstress Email Templates */}
			{renderTemplateTable(
				seamstressTemplates,
				'Emails Sent to You',
				'Templates sent to you for internal notifications.'
			)}
		</Box>
	);
}
