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
	Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

export default function ClientDetailPage({
	params,
}: {
	params: { id: string };
}) {
	// Mock data for demonstration
	const client = {
		id: params.id,
		name: 'Jane Smith',
		phone: '(555) 123-4567',
		email: 'jane.smith@email.com',
		address: '123 Main St, City, State 12345',
		notes: 'Prefers organic fabrics, allergic to certain dyes',
		totalOrders: 15,
		totalSpent: '$1,250',
	};

	const recentOrders = [
		{ id: 1, date: '2024-01-15', items: 3, total: '$125', status: 'Completed' },
		{
			id: 2,
			date: '2024-01-02',
			items: 1,
			total: '$45',
			status: 'In Progress',
		},
		{ id: 3, date: '2023-12-20', items: 2, total: '$80', status: 'Completed' },
	];

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				{/* Header */}
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
					<Avatar sx={{ width: 64, height: 64, mr: 2 }}>
						<PersonIcon sx={{ fontSize: 32 }} />
					</Avatar>
					<Box sx={{ flexGrow: 1 }}>
						<Typography variant="h4" component="h1">
							{client.name}
						</Typography>
						<Typography color="text.secondary">Client since 2023</Typography>
					</Box>
					<Button variant="outlined" startIcon={<EditIcon />}>
						Edit
					</Button>
				</Box>

				{/* Contact Info */}
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Contact Information
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
							<PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
							<Typography>{client.phone}</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
							<EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
							<Typography>{client.email}</Typography>
						</Box>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
							{client.address}
						</Typography>
					</CardContent>
				</Card>

				{/* Stats */}
				<Grid container spacing={2} sx={{ mb: 3 }}>
					<Grid item xs={6}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Total Orders
								</Typography>
								<Typography variant="h5">{client.totalOrders}</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={6}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Total Spent
								</Typography>
								<Typography variant="h5">{client.totalSpent}</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				{/* Notes */}
				{client.notes && (
					<Card sx={{ mb: 3 }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								Notes
							</Typography>
							<Typography>{client.notes}</Typography>
						</CardContent>
					</Card>
				)}

				{/* Recent Orders */}
				<Card>
					<CardContent>
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								mb: 2,
							}}
						>
							<Typography variant="h6">Recent Orders</Typography>
							<Button
								size="small"
								startIcon={<AddIcon />}
								component={Link}
								href={`/orders/new?client=${client.id}`}
							>
								New Order
							</Button>
						</Box>
						<List>
							{recentOrders.map((order) => (
								<ListItem
									key={order.id}
									divider
									component={Link}
									href={`/orders/${order.id}`}
									sx={{ px: 0 }}
								>
									<ListItemText
										primary={`Order #${order.id}`}
										secondary={`${order.date} • ${order.items} items`}
									/>
									<Box sx={{ textAlign: 'right' }}>
										<Typography variant="body2">{order.total}</Typography>
										<Chip
											label={order.status}
											size="small"
											color={
												order.status === 'Completed' ? 'success' : 'warning'
											}
										/>
									</Box>
								</ListItem>
							))}
						</List>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
}

// Add missing import
import { Grid } from '@mui/material';
