'use client';

import { useQuery } from '@tanstack/react-query';
import {
	Box,
	Button,
	Paper,
	Skeleton,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import type { Order } from '@/types';
import { OrderListItem } from './OrderListItem';
import { getClientOrders } from '@/lib/actions/clients';

// Reusable button style for contained-to-outlined hover effect
// fontSize uses body1 (16px) from theme
const containedToOutlinedHoverStyle = {
	whiteSpace: 'nowrap' as const,
	border: '2px solid transparent',
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

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Typography variant="h6">Orders</Typography>

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

			<TableContainer component={Paper} elevation={1}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Order #</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Garments</TableCell>
							<TableCell>Total</TableCell>
							<TableCell>Due Date</TableCell>
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 3 }).map((_, index) => (
								<TableRow key={index}>
									<TableCell>
										<Skeleton variant="text" width={100} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={80} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={80} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={80} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={100} />
									</TableCell>
									<TableCell align="right">
										<Skeleton variant="circular" width={24} height={24} />
									</TableCell>
								</TableRow>
							))
						) : error ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									<Typography color="error" sx={{ py: 4 }}>
										{String((error as any)?.message || 'Failed to load orders')}
									</Typography>
								</TableCell>
							</TableRow>
						) : (data?.length ?? 0) === 0 ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ py: 4 }}
									>
										No orders yet for {clientName}
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							(data ?? []).map((order) => (
								<OrderListItem
									key={order.id}
									order={order}
									garmentCount={order.garment_count}
								/>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	);
}

export default ClientOrdersSection;
