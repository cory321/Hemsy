'use client';

import {
	Container,
	Typography,
	Box,
	Tabs,
	Tab,
	List,
	ListItem,
	ListItemText,
	Chip,
	Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useState } from 'react';

export default function OrdersPage() {
	const [tabValue, setTabValue] = useState(0);

	// Mock data for demonstration
	const orders = [
		{
			id: 1,
			client: 'Jane Smith',
			items: 3,
			total: '$125',
			status: 'pending',
			createdAt: '2024-01-15',
		},
		{
			id: 2,
			client: 'John Doe',
			items: 1,
			total: '$45',
			status: 'in_progress',
			createdAt: '2024-01-14',
		},
		{
			id: 3,
			client: 'Sarah Johnson',
			items: 2,
			total: '$80',
			status: 'completed',
			createdAt: '2024-01-13',
		},
		{
			id: 4,
			client: 'Mike Wilson',
			items: 4,
			total: '$200',
			status: 'in_progress',
			createdAt: '2024-01-12',
		},
	];

	const filteredOrders = orders.filter((order) => {
		if (tabValue === 0) return true; // All
		if (tabValue === 1) return order.status === 'pending';
		if (tabValue === 2) return order.status === 'in_progress';
		if (tabValue === 3) return order.status === 'completed';
		return true;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'warning';
			case 'in_progress':
				return 'info';
			case 'completed':
				return 'success';
			default:
				return 'default';
		}
	};

	const getStatusLabel = (status: string) => {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Orders
				</Typography>

				{/* Tabs */}
				<Tabs
					value={tabValue}
					onChange={(_, newValue) => setTabValue(newValue)}
					sx={{ mb: 3 }}
				>
					<Tab label="All" />
					<Tab label="Pending" />
					<Tab label="In Progress" />
					<Tab label="Completed" />
				</Tabs>

				{/* Orders List */}
				<List>
					{filteredOrders.map((order) => (
						<ListItem
							key={order.id}
							component={Link}
							href={`/orders/${order.id}`}
							sx={{
								bgcolor: 'background.paper',
								mb: 1,
								borderRadius: 1,
								display: 'flex',
								alignItems: 'center',
								'&:hover': {
									bgcolor: 'action.hover',
								},
							}}
						>
							<ListItemText
								primary={`Order #${order.id} - ${order.client}`}
								secondary={`${order.items} items • ${order.createdAt}`}
							/>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography variant="h6">{order.total}</Typography>
								<Chip
									label={getStatusLabel(order.status)}
									color={getStatusColor(order.status) as any}
									size="small"
								/>
							</Box>
						</ListItem>
					))}
				</List>

				{/* Floating Action Button */}
				<Fab
					color="primary"
					aria-label="add order"
					component={Link}
					href="/orders/new"
					sx={{
						position: 'fixed',
						bottom: 80,
						right: 16,
					}}
				>
					<AddIcon />
				</Fab>
			</Box>
		</Container>
	);
}
