'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	CircularProgress,
	Alert,
	Box,
	IconButton,
	Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateClient, archiveClient } from '@/lib/actions/clients';
import type { Tables } from '@/types/supabase-extended';
import { useRouter } from 'next/navigation';
import PhoneInput from '@/components/ui/PhoneInput';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

const clientSchema = z.object({
	first_name: z.string().min(1, 'First name is required'),
	last_name: z.string().min(1, 'Last name is required'),
	email: z.string().email('Invalid email address'),
	phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
	notes: z.string().optional(),
	mailing_address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientEditDialogProps {
	client: Tables<'clients'>;
	children: React.ReactNode;
}

export default function ClientEditDialog({
	client,
	children,
}: ClientEditDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [archiveLoading, setArchiveLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { showToast } = useToast();
	const queryClient = useQueryClient();

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			first_name: client.first_name,
			last_name: client.last_name,
			email: client.email,
			phone_number: client.phone_number,
			notes: client.notes || '',
			mailing_address: client.mailing_address || '',
		},
	});

	const handleOpen = () => {
		setOpen(true);
		setError(null);
		reset({
			first_name: client.first_name,
			last_name: client.last_name,
			email: client.email,
			phone_number: client.phone_number,
			notes: client.notes || '',
			mailing_address: client.mailing_address || '',
		});
	};

	const handleClose = () => {
		setOpen(false);
		setError(null);
		reset();
	};

	const onSubmit = async (data: ClientFormData) => {
		setLoading(true);
		setError(null);

		try {
			const result = await updateClient(client.id, {
				...data,
				notes: data.notes || null,
				mailing_address: data.mailing_address || null,
			});

			if (result.success) {
				setOpen(false);
				router.refresh();
			} else {
				setError(result.error);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update client');
		} finally {
			setLoading(false);
		}
	};

	const handleArchive = async () => {
		if (
			!confirm(
				`Are you sure you want to archive ${client.first_name} ${client.last_name}?`
			)
		) {
			return;
		}

		setArchiveLoading(true);
		setError(null);

		try {
			await archiveClient(client.id);
			setOpen(false);
			showToast(
				`${client.first_name} ${client.last_name} has been archived successfully`,
				'success'
			);
			await queryClient.invalidateQueries({ queryKey: ['clients'] });
			router.push('/clients');
			router.refresh();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to archive client';
			setError(errorMessage);
			showToast(errorMessage, 'error');
		} finally {
			setArchiveLoading(false);
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
				maxWidth="md"
				fullWidth
				disableScrollLock
				PaperProps={{
					component: 'form',
					onSubmit: handleSubmit(onSubmit),
				}}
			>
				<DialogTitle>
					Edit Client Information
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
						<Grid size={{ xs: 12, sm: 6 }}>
							<Controller
								name="first_name"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="First Name"
										fullWidth
										required
										error={!!errors.first_name}
										helperText={errors.first_name?.message}
									/>
								)}
							/>
						</Grid>

						<Grid size={{ xs: 12, sm: 6 }}>
							<Controller
								name="last_name"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="Last Name"
										fullWidth
										required
										error={!!errors.last_name}
										helperText={errors.last_name?.message}
									/>
								)}
							/>
						</Grid>

						<Grid size={12}>
							<Controller
								name="email"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="Email"
										type="email"
										fullWidth
										required
										error={!!errors.email}
										helperText={errors.email?.message}
									/>
								)}
							/>
						</Grid>

						<Grid size={12}>
							<Controller
								name="phone_number"
								control={control}
								render={({ field }) => (
									<PhoneInput
										{...field}
										label="Phone Number"
										fullWidth
										required
										error={!!errors.phone_number}
										helperText={errors.phone_number?.message}
										onChange={(value, isValid) => {
											field.onChange(value);
										}}
									/>
								)}
							/>
						</Grid>

						<Grid size={12}>
							<Controller
								name="mailing_address"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="Mailing Address"
										fullWidth
										multiline
										rows={3}
										error={!!errors.mailing_address}
										helperText={errors.mailing_address?.message}
									/>
								)}
							/>
						</Grid>

						<Grid size={12}>
							<Controller
								name="notes"
								control={control}
								render={({ field }) => (
									<TextField
										{...field}
										label="Notes"
										fullWidth
										multiline
										rows={3}
										error={!!errors.notes}
										helperText={errors.notes?.message}
									/>
								)}
							/>
						</Grid>
					</Grid>
				</DialogContent>

				<DialogActions sx={{ px: 3, pb: 2, pt: 2 }}>
					<Box sx={{ flex: 1 }}>
						<Button
							onClick={handleArchive}
							color="warning"
							disabled={loading || archiveLoading}
							startIcon={
								archiveLoading ? (
									<CircularProgress size={20} />
								) : (
									<ArchiveIcon />
								)
							}
						>
							{archiveLoading ? 'Archiving...' : 'Archive Client'}
						</Button>
					</Box>
					<Button onClick={handleClose} disabled={loading || archiveLoading}>
						Cancel
					</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={loading || archiveLoading}
						startIcon={loading ? <CircularProgress size={20} /> : null}
					>
						{loading ? 'Updating...' : 'Update Client'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
