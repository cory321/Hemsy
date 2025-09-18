'use client';

import { useState } from 'react';
import {
	Box,
	Typography,
	Button,
	RadioGroup,
	FormControlLabel,
	Radio,
	TextField,
	Switch,
	Alert,
	CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ClientSearchField } from '@/components/appointments/ClientSearchField';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import { useResponsive } from '@/hooks/useResponsive';
import { createClient } from '@/lib/actions/clients';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import type { Client } from '@/types';
import PhoneInput from '@/components/ui/PhoneInput';

const clientSchema = z.object({
	first_name: z.string().min(1, 'First name is required'),
	last_name: z.string().min(1, 'Last name is required'),
	email: z.string().email('Invalid email address'),
	phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
	accept_email: z.boolean().default(true),
	accept_sms: z.boolean().default(false),
	notes: z.string().optional(),
	mailing_address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function Step1ClientSelection() {
	const { orderDraft, updateOrderDraft, setCurrentStep } = useOrderFlow();
	const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { isMobile, isDesktop } = useResponsive();

	const {
		control,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ClientFormData>({
		resolver: zodResolver(clientSchema),
		defaultValues: {
			first_name: '',
			last_name: '',
			email: '',
			phone_number: '',
			accept_email: true,
			accept_sms: false,
			notes: '',
			mailing_address: '',
		},
	});

	const handleClientSelect = (client: Client | null) => {
		updateOrderDraft({
			clientId: client?.id || '',
			client: (client as any) || undefined,
		});

		// Auto-advance to step 2 when a client is selected
		if (client) {
			setCurrentStep(1);
		}
	};

	const onSubmit = async (data: ClientFormData) => {
		setLoading(true);
		setError(null);

		try {
			const result = await createClient({
				...data,
				notes: data.notes || null,
				mailing_address: data.mailing_address || null,
				archived_at: null,
				archived_by: null,
				is_archived: false,
			});

			if (result.success) {
				toast.success('Client created successfully');
				handleClientSelect(result.data as Client);
				reset();
			} else {
				throw new Error(result.error);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to create client';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	// Unified view with radio toggle
	return (
		<Box sx={{ maxWidth: 600, mx: 'auto' }}>
			<Typography variant="h5" gutterBottom align="center">
				Add Client
			</Typography>

			<Box sx={{ py: 2 }}>
				<RadioGroup
					value={clientMode}
					onChange={(e) => setClientMode(e.target.value as 'existing' | 'new')}
					row
					sx={{ mb: 3, justifyContent: 'center' }}
				>
					<FormControlLabel
						value="existing"
						control={<Radio />}
						label="Existing client"
					/>
					<FormControlLabel
						value="new"
						control={<Radio />}
						label="Create new client"
					/>
				</RadioGroup>

				{clientMode === 'existing' ? (
					// Existing client search
					<Box>
						<ClientSearchField
							value={orderDraft.client || null}
							onChange={handleClientSelect}
							placeholder="Find client by name"
						/>
					</Box>
				) : (
					// New client form
					<Box component="form" onSubmit={handleSubmit(onSubmit)}>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}

						<Grid container spacing={2}>
							<Grid size={12}>
								<Typography variant="subtitle1" gutterBottom>
									Basic Information
								</Typography>
							</Grid>

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
											disabled={loading}
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
											disabled={loading}
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
											label="Email Address"
											type="email"
											fullWidth
											required
											error={!!errors.email}
											helperText={errors.email?.message}
											disabled={loading}
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
											disabled={loading}
											onChange={(value, isValid) => {
												field.onChange(value);
											}}
										/>
									)}
								/>
							</Grid>

							<Grid size={12}>
								<Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
									Communication Preferences*
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: 'block', mb: 1 }}
								>
									*By checking the Email and SMS boxes I confirm that the client
									has agreed to receive SMS or email notifications regarding
									appointment reminders and other notifications. Message and
									data rates may apply. The client can reply STOP to opt-out
									from SMS at any time.
								</Typography>
							</Grid>

							<Grid size={{ xs: 12, sm: 6 }}>
								<Controller
									name="accept_email"
									control={control}
									render={({ field: { value, onChange } }) => (
										<FormControlLabel
											control={
												<Switch
													checked={value}
													onChange={(e) => onChange(e.target.checked)}
													disabled={loading}
												/>
											}
											label="Accept Email Communications"
										/>
									)}
								/>
							</Grid>

							<Grid size={{ xs: 12, sm: 6 }}>
								<Controller
									name="accept_sms"
									control={control}
									render={({ field: { value, onChange } }) => (
										<FormControlLabel
											control={
												<Switch
													checked={value}
													onChange={(e) => onChange(e.target.checked)}
													disabled={loading}
												/>
											}
											label="Accept SMS Communications"
										/>
									)}
								/>
							</Grid>

							<Grid size={12}>
								<Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
									Additional Information
								</Typography>
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
											placeholder={'123 Main St\nCity, State 12345'}
											error={!!errors.mailing_address}
											helperText={errors.mailing_address?.message}
											disabled={loading}
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
											placeholder="Any additional notes about this client..."
											error={!!errors.notes}
											helperText={errors.notes?.message}
											disabled={loading}
										/>
									)}
								/>
							</Grid>

							<Grid size={12}>
								<Box
									sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}
								>
									<Button
										type="submit"
										variant="contained"
										disabled={loading}
										startIcon={
											loading ? <CircularProgress size={20} /> : undefined
										}
									>
										{loading ? 'Adding...' : 'Add Client'}
									</Button>
								</Box>
							</Grid>
						</Grid>
					</Box>
				)}
			</Box>
		</Box>
	);
}
