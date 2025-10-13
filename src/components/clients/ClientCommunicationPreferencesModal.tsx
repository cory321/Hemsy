'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	FormControlLabel,
	Switch,
	CircularProgress,
	Alert,
	Box,
	IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateClient } from '@/lib/actions/clients';
import type { Tables } from '@/types/supabase-extended';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

const communicationSchema = z.object({
	accept_email: z.boolean(),
	accept_sms: z.boolean(),
});

type CommunicationFormData = z.infer<typeof communicationSchema>;

interface ClientCommunicationPreferencesModalProps {
	client: Tables<'clients'>;
	children: React.ReactNode;
}

export default function ClientCommunicationPreferencesModal({
	client,
	children,
}: ClientCommunicationPreferencesModalProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { showToast } = useToast();

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<CommunicationFormData>({
		resolver: zodResolver(communicationSchema),
		defaultValues: {
			accept_email: client.accept_email || false,
			accept_sms: client.accept_sms || false,
		},
	});

	const handleOpen = () => {
		setOpen(true);
		setError(null);
		reset({
			accept_email: client.accept_email || false,
			accept_sms: client.accept_sms || false,
		});
	};

	const handleClose = () => {
		setOpen(false);
		setError(null);
		reset();
	};

	const onSubmit = async (data: CommunicationFormData) => {
		setLoading(true);
		setError(null);

		try {
			const result = await updateClient(client.id, {
				accept_email: data.accept_email,
				accept_sms: data.accept_sms,
			});

			if (result.success) {
				setOpen(false);
				showToast('Communication preferences updated successfully', 'success');
				router.refresh();
			} else {
				setError(result.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: 'Failed to update communication preferences';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Box onClick={handleOpen} sx={{ display: 'inline-block' }}>
				{children}
			</Box>

			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="sm"
				fullWidth
				disableScrollLock
				PaperProps={{
					component: 'form',
					onSubmit: handleSubmit(onSubmit),
				}}
			>
				<DialogTitle>
					Communication Preferences
					<IconButton
						aria-label="close"
						onClick={handleClose}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: (theme) => theme.palette.grey[500],
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>

				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid size={12}>
							<Controller
								name="accept_email"
								control={control}
								render={({ field: { value, onChange } }) => (
									<FormControlLabel
										control={
											<Switch
												checked={value}
												onChange={(e) => onChange(e.target.checked)}
											/>
										}
										label="Accept Email Communications"
									/>
								)}
							/>
						</Grid>

						<Grid size={12}>
							<Controller
								name="accept_sms"
								control={control}
								render={({ field: { value, onChange } }) => (
									<FormControlLabel
										control={
											<Switch
												checked={value}
												onChange={(e) => onChange(e.target.checked)}
											/>
										}
										label="Accept SMS Communications"
									/>
								)}
							/>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
					<Button onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={loading}
						startIcon={loading ? <CircularProgress size={20} /> : null}
					>
						{loading ? 'Updating...' : 'Update Preferences'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
