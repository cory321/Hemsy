'use client';

import {
	Box,
	Button,
	IconButton,
	Menu,
	MenuItem,
	Divider,
	ListItemIcon,
	ListItemText,
	CircularProgress,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CancelIcon from '@mui/icons-material/Cancel';
import RestoreIcon from '@mui/icons-material/Restore';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cancelOrder, restoreOrder } from '@/lib/actions/orders-cancellation';
import CancelOrderDialog from './CancelOrderDialog';
import type { Database } from '@/types/supabase';

interface OrderHeaderActionsProps {
	order: {
		id: string;
		order_number: string;
		status: Database['public']['Enums']['order_status'];
		total_cents: number;
	};
	invoice: any;
	shopSettings: {
		invoice_prefix: string;
	};
	garments?: Array<{
		id: string;
		name: string;
		stage: Database['public']['Enums']['garment_stage_enum'] | null;
	}>;
}

export default function OrderHeaderActions({
	order,
	invoice,
	shopSettings,
	garments = [],
}: OrderHeaderActionsProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const canCancel =
		order.status !== 'completed' && order.status !== 'cancelled';
	const canRestore = order.status === 'cancelled';
	const showMoreMenu = canCancel || canRestore;

	// If there's no invoice and no actions available, don't render anything
	if (!invoice && !showMoreMenu) {
		return null;
	}

	const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
	};

	const handleCancelClick = () => {
		handleMenuClose();
		setShowCancelDialog(true);
	};

	const handleCancelOrder = async (reason: string) => {
		setIsLoading(true);
		try {
			const result = await cancelOrder({
				orderId: order.id,
				cancellationReason: reason || undefined,
			});

			if ('success' in result && result.success) {
				toast.success('Order cancelled successfully');
				router.refresh();
			} else if ('errors' in result) {
				const errorMessage =
					result.errors.root?.[0] || 'Failed to cancel order';
				toast.error(errorMessage);
			} else {
				toast.error(result.error || 'Failed to cancel order');
			}
		} catch (error) {
			console.error('Error cancelling order:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRestoreOrder = async () => {
		handleMenuClose();
		setIsLoading(true);
		try {
			const result = await restoreOrder({
				orderId: order.id,
			});

			if ('success' in result && result.success) {
				toast.success(
					`Order restored successfully. Status is now ${result.calculatedStatus?.replace('_', ' ')}.`
				);
				router.refresh();
			} else if ('errors' in result) {
				const errorMessage =
					result.errors.root?.[0] || 'Failed to restore order';
				toast.error(errorMessage);
			} else {
				toast.error(result.error || 'Failed to restore order');
			}
		} catch (error) {
			console.error('Error restoring order:', error);
			toast.error('An unexpected error occurred');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
				{/* Only show View Invoice button if invoice exists */}
				{invoice && (
					<Button
						variant="outlined"
						startIcon={<ReceiptIcon />}
						onClick={() => router.push(`/invoices/${invoice.id}`)}
						size="small"
					>
						View Invoice
					</Button>
				)}

				{/* More actions menu for cancel/restore */}
				{showMoreMenu && (
					<IconButton
						onClick={handleMenuOpen}
						disabled={isLoading}
						sx={{
							border: '1px solid',
							borderColor: 'divider',
							'&:hover': {
								bgcolor: 'action.hover',
							},
						}}
					>
						{isLoading ? <CircularProgress size={20} /> : <MoreVertIcon />}
					</IconButton>
				)}
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleMenuClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				{canCancel && (
					<MenuItem onClick={handleCancelClick} disabled={isLoading}>
						<ListItemIcon>
							<CancelIcon fontSize="small" color="error" />
						</ListItemIcon>
						<ListItemText>Cancel Order</ListItemText>
					</MenuItem>
				)}

				{canRestore && (
					<MenuItem onClick={handleRestoreOrder} disabled={isLoading}>
						<ListItemIcon>
							<RestoreIcon fontSize="small" color="primary" />
						</ListItemIcon>
						<ListItemText>Restore Order</ListItemText>
					</MenuItem>
				)}
			</Menu>

			<CancelOrderDialog
				open={showCancelDialog}
				order={order}
				garments={garments}
				onClose={() => setShowCancelDialog(false)}
				onConfirm={handleCancelOrder}
				isLoading={isLoading}
			/>
		</>
	);
}
