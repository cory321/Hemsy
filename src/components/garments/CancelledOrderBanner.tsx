'use client';

import { Paper, Stack, Box, Typography, Button, alpha } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import Link from 'next/link';

interface CancelledOrderBannerProps {
	orderNumber: string;
	orderId: string;
}

export default function CancelledOrderBanner({
	orderNumber,
	orderId,
}: CancelledOrderBannerProps) {
	const color = '#D94F40'; // error color from AlertCard

	return (
		<Paper
			elevation={0}
			sx={{
				p: 2,
				border: `1px solid ${alpha(color, 0.3)}`,
				bgcolor: alpha(color, 0.05),
				borderRadius: 2,
				mb: 3,
			}}
		>
			<Stack direction="row" alignItems="center" justifyContent="space-between">
				<Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
					<Box sx={{ color, display: 'flex' }}>
						<WarningIcon sx={{ fontSize: 20 }} />
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography
							variant="body2"
							sx={{ fontWeight: 600, color: '#1a1a1a' }}
						>
							Order Canceled
						</Typography>
						<Typography variant="caption" sx={{ color: '#666666' }}>
							Services cannot be modified for cancelled orders. You can restore
							Order {orderNumber} to continue working on it.
						</Typography>
					</Box>
				</Stack>
				<Button
					component={Link}
					href={`/orders/${orderId}`}
					size="small"
					sx={{
						color: '#1a1a1a',
						minWidth: 140,
						flexShrink: 0,
						bgcolor: alpha(color, 0.1),
						'&:hover': {
							bgcolor: alpha(color, 0.2),
						},
					}}
				>
					Go to Order
				</Button>
			</Stack>
		</Paper>
	);
}
