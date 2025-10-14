'use client';

import { useState, useCallback } from 'react';
import { Button, Fab, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import type { Client } from '@/types';
import { RemixIcon } from '@/components/dashboard/common/RemixIcon';
import { actionButtonStyle } from '@/constants/buttonStyles';

export default function AddClientCtas() {
	const router = useRouter();
	const [open, setOpen] = useState(false);

	const handleOpen = useCallback(() => setOpen(true), []);
	const handleClose = useCallback(() => setOpen(false), []);

	const handleCreated = useCallback(
		(client: Client) => {
			// Navigate to the newly created client's detail page
			router.push(`/clients/${client.id}`);
		},
		[router]
	);

	return (
		<>
			{/* Desktop button shown in header */}
			<Button
				variant="contained"
				onClick={handleOpen}
				sx={{
					display: { xs: 'none', sm: 'flex' },
					...actionButtonStyle,
				}}
			>
				<RemixIcon name="ri-user-add-line" size={18} color="inherit" />
				<Box component="span">Add Client</Box>
			</Button>

			{/* Mobile floating action button */}
			<Fab
				color="primary"
				aria-label="add client"
				onClick={handleOpen}
				sx={{
					position: 'fixed',
					bottom: 80,
					right: 16,
					display: { xs: 'flex', sm: 'none' },
				}}
			>
				<AddIcon />
			</Fab>

			{open && (
				<ClientCreateDialog
					open={open}
					onClose={handleClose}
					onCreated={handleCreated}
				/>
			)}
		</>
	);
}
