import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	List,
	ListItem,
	ListItemText,
	Button,
	Chip,
	Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Link from 'next/link';

export default function OrderDetailPage({
	params,
}: {
	params: { id: string };
}) {
	// Mock data for demonstration
	const order = {
		id: params.id,
		client: { id: 1, name: 'Jane Smith', phone: '(555) 123-4567' },
		status: 'in_progress',
		createdAt: '2024-01-15',
		dueDate: '2024-01-25',
		total: '$125.00',
		paid: false,
		garments: [
			{
				id: 1,
				title: 'Blue Dress',
				services: ['Hemming', 'Take in sides'],
				stage: 'Cutting',
				price: '$65',
			},
			{
				id: 2,
				title: 'Black Pants',
				services: ['Hemming'],
				stage: 'Sewing',
				price: '$35',
			},
			{
				id: 3,
				title: 'White Shirt',
				services: ['Shorten sleeves'],
				stage: 'Pressing',
				price: '$25',
			},
		],
	};

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

	const getStageColor = (stage: string) => {
		switch (stage.toLowerCase()) {
			case 'intake':
				return 'default';
			case 'cutting':
				return 'info';
			case 'sewing':
				return 'warning';
			case 'pressing':
				return 'success';
			case 'ready':
				return 'success';
			default:
				return 'default';
		}
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				{/* Header */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 3,
					}}
				>
					<Box>
						<Typography variant="h4" component="h1">
							Order #{order.id}
						</Typography>
						<Typography color="text.secondary">
							Created on {order.createdAt}
						</Typography>
					</Box>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button variant="outlined" startIcon={<EditIcon />}>
							Edit
						</Button>
						<Button
							variant="contained"
							startIcon={<ReceiptIcon />}
							component={Link}
							href={`/invoices/new?order=${order.id}`}
						>
							Create Invoice
						</Button>
					</Box>
				</Box>

				{/* Order Info */}
				<Grid container spacing={3}>
					<Grid item xs={12} md={8}>
						{/* Client Info */}
						<Card sx={{ mb: 3 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Client Information
								</Typography>
								<Typography variant="body1">
									<Link
										href={`/clients/${order.client.id}`}
										style={{ textDecoration: 'none', color: 'inherit' }}
									>
										{order.client.name}
									</Link>
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{order.client.phone}
								</Typography>
							</CardContent>
						</Card>

						{/* Garments */}
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Garments ({order.garments.length})
								</Typography>
								<List>
									{order.garments.map((garment, index) => (
										<Box key={garment.id}>
											<ListItem
												component={Link}
												href={`/garments/${garment.id}`}
												sx={{ px: 0 }}
											>
												<ListItemText
													primary={garment.title}
													secondary={<Box>{garment.services.join(', ')}</Box>}
												/>
												<Box
													sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
												>
													<Chip
														label={garment.stage}
														size="small"
														color={getStageColor(garment.stage) as any}
													/>
													<Typography variant="body1">
														{garment.price}
													</Typography>
												</Box>
											</ListItem>
											{index < order.garments.length - 1 && <Divider />}
										</Box>
									))}
								</List>
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} md={4}>
						{/* Order Summary */}
						<Card>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Order Summary
								</Typography>
								<Box sx={{ mb: 2 }}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
										}}
									>
										<Typography color="text.secondary">Status</Typography>
										<Chip
											label={order.status.split('_').join(' ').toUpperCase()}
											color={getStatusColor(order.status) as any}
											size="small"
										/>
									</Box>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
										}}
									>
										<Typography color="text.secondary">Due Date</Typography>
										<Typography>{order.dueDate}</Typography>
									</Box>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
										}}
									>
										<Typography color="text.secondary">Payment</Typography>
										<Chip
											label={order.paid ? 'Paid' : 'Unpaid'}
											color={order.paid ? 'success' : 'error'}
											size="small"
										/>
									</Box>
								</Box>
								<Divider sx={{ my: 2 }} />
								<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
									<Typography variant="h6">Total</Typography>
									<Typography variant="h6">{order.total}</Typography>
								</Box>
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			</Box>
		</Container>
	);
}

// Add missing import
import { Grid } from '@mui/material';
