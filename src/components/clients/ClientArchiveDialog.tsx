'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	CircularProgress,
	Alert,
	Box,
	IconButton,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArchiveIcon from '@mui/icons-material/Archive';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestoreIcon from '@mui/icons-material/Restore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { archiveClient } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useQueryClient } from '@tanstack/react-query';

interface ClientArchiveDialogProps {
	clientId: string;
	clientName: string;
	children: React.ReactNode;
}

export default function ClientArchiveDialog({
	clientId,
	clientName,
	children,
}: ClientArchiveDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { showToast } = useToast();
	const queryClient = useQueryClient();

	const handleOpen = () => {
		setOpen(true);
		setError(null);
	};

	const handleClose = () => {
		setOpen(false);
		setError(null);
	};

	const handleArchive = async () => {
		setLoading(true);
		setError(null);

		try {
			await archiveClient(clientId);
			setOpen(false);
			showToast(`${clientName} has been archived successfully`, 'success');
			// Invalidate clients list queries so the list updates immediately on return
			await queryClient.invalidateQueries({ queryKey: ['clients'] });
			router.push('/clients');
			router.refresh();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to archive client';
			setError(errorMessage);
			showToast(errorMessage, 'error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Box onClick={handleOpen} sx={{ display: 'inline-block' }}>
				{children}
			</Box>

			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1,
						position: 'relative',
					}}
				>
					<ArchiveIcon color="warning" />
					Archive Client
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

					<Typography variant="body1" sx={{ mb: 3 }}>
						Are you sure you want to archive <strong>{clientName}</strong>?
					</Typography>

					<Alert severity="info" sx={{ mb: 3 }}>
						<Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
							Archiving this client will:
						</Typography>
						<List dense sx={{ mt: 1 }}>
							<ListItem sx={{ py: 0 }}>
								<ListItemIcon sx={{ minWidth: 32 }}>
									<CheckCircleIcon fontSize="small" color="primary" />
								</ListItemIcon>
								<ListItemText
									primary="Hide them from active client lists"
									primaryTypographyProps={{ variant: 'body2' }}
								/>
							</ListItem>
							<ListItem sx={{ py: 0 }}>
								<ListItemIcon sx={{ minWidth: 32 }}>
									<HistoryIcon fontSize="small" color="primary" />
								</ListItemIcon>
								<ListItemText
									primary="Preserve all order history and payments"
									primaryTypographyProps={{ variant: 'body2' }}
								/>
							</ListItem>
							<ListItem sx={{ py: 0 }}>
								<ListItemIcon sx={{ minWidth: 32 }}>
									<CalendarMonthIcon fontSize="small" color="primary" />
								</ListItemIcon>
								<ListItemText
									primary="Keep appointment records intact"
									primaryTypographyProps={{ variant: 'body2' }}
								/>
							</ListItem>
							<ListItem sx={{ py: 0 }}>
								<ListItemIcon sx={{ minWidth: 32 }}>
									<RestoreIcon fontSize="small" color="primary" />
								</ListItemIcon>
								<ListItemText
									primary="Allow recovery at any time"
									primaryTypographyProps={{ variant: 'body2' }}
								/>
							</ListItem>
						</List>
					</Alert>

					<Typography variant="body2" color="text.secondary">
						The client will remain accessible through order details, appointment
						history, and financial reports.
					</Typography>
				</DialogContent>

				<DialogActions>
					<Button onClick={handleClose} disabled={loading}>
						Cancel
					</Button>
					<Button
						onClick={handleArchive}
						variant="contained"
						color="warning"
						disabled={loading}
						startIcon={
							loading ? <CircularProgress size={20} /> : <ArchiveIcon />
						}
					>
						{loading ? 'Archiving...' : 'Archive Client'}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
