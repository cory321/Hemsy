'use client';

import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	IconButton,
	Skeleton,
	Typography,
	Chip,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import type { Order } from '@/types';
import { OrderListItem } from './OrderListItem';
import { getClientOrders } from '@/lib/actions/clients';

// Reusable button style for contained-to-outlined hover effect
const containedToOutlinedHoverStyle = {
	whiteSpace: 'nowrap' as const,
	border: '2px solid transparent',
	fontSize: '1rem',
	'&:hover': {
		backgroundColor: 'transparent',
		borderColor: 'primary.main',
		borderWidth: '2px',
		color: 'primary.main',
		fontWeight: 600,
	},
	fontWeight: 600,
	transition: 'none',
};

interface ClientOrdersSectionProps {
	clientId: string;
	clientName: string;
}

interface OrderWithGarmentCount extends Order {
	garment_count: number;
}

export function ClientOrdersSection({
	clientId,
	clientName,
}: ClientOrdersSectionProps) {
	const { data, isLoading, error } = useQuery({
		queryKey: ['client', clientId, 'orders'],
		queryFn: async () => {
			const ordersData = await getClientOrders(clientId);
			return ordersData.map((o) => ({
				...o,
				total: (o.total_cents ?? 0) / 100,
			})) as OrderWithGarmentCount[];
		},
		staleTime: 30 * 1000,
		refetchOnWindowFocus: false,
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'new':
				return 'info';
			case 'in_progress':
				return 'warning';
			case 'completed':
				return 'success';
			case 'cancelled':
				return 'error';
			default:
				return 'default';
		}
	};

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(cents / 100);
	};

	return (
		<Card elevation={2} sx={{ mt: 3 }}>
			<CardContent>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 2,
					}}
				>
					<Typography
						variant="h6"
						sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
					>
						<ShoppingBagIcon color="primary" />
						Orders ({data?.length ?? 0})
					</Typography>

					<Button
						component={Link}
						href={`/orders/new?clientId=${clientId}`}
						variant="contained"
						size="small"
						startIcon={<AddIcon />}
						sx={containedToOutlinedHoverStyle}
					>
						Create New Order
					</Button>
				</Box>

				<Divider sx={{ mb: 2 }} />

				{isLoading ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
						<Skeleton variant="rounded" height={80} />
						<Skeleton variant="rounded" height={80} />
						<Skeleton variant="rounded" height={80} />
					</Box>
				) : error ? (
					<Typography color="error" sx={{ mt: 2 }}>
						{String((error as any)?.message || 'Failed to load orders')}
					</Typography>
				) : (data?.length ?? 0) === 0 ? (
					<Typography
						color="text.secondary"
						sx={{ mt: 2, textAlign: 'center' }}
					>
						No orders yet for {clientName}
					</Typography>
				) : (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{(data ?? []).map((order) => (
							<OrderListItem
								key={order.id}
								order={order}
								garmentCount={order.garment_count}
							/>
						))}
					</Box>
				)}
			</CardContent>
		</Card>
	);
}

export default ClientOrdersSection;
