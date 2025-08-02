import {
	Container,
	Typography,
	Box,
	Grid,
	Card,
	CardContent,
	Button,
	List,
	ListItem,
	ListItemText,
	Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';

export default function DashboardPage() {
	// Mock data for demonstration
	const upcomingAppointments = [
		{
			id: 1,
			client: 'Jane Smith',
			time: '10:00 AM',
			service: 'Dress Alteration',
		},
		{ id: 2, client: 'John Doe', time: '2:00 PM', service: 'Suit Hemming' },
	];

	const highPriorityGarments = [
		{
			id: 1,
			title: 'Wedding Dress',
			client: 'Sarah Johnson',
			dueDate: 'Tomorrow',
			stage: 'In Progress',
		},
		{
			id: 2,
			title: 'Business Suit',
			client: 'Mike Wilson',
			dueDate: 'In 2 days',
			stage: 'Cutting',
		},
	];

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Welcome back!
				</Typography>
				<Typography color="text.secondary" gutterBottom>
					Here's what's happening in your shop today
				</Typography>

				{/* Quick Actions */}
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid item xs={6} sm={3}>
						<Button
							variant="contained"
							fullWidth
							startIcon={<AddIcon />}
							component={Link}
							href="/orders/new"
						>
							New Order
						</Button>
					</Grid>
					<Grid item xs={6} sm={3}>
						<Button
							variant="outlined"
							fullWidth
							component={Link}
							href="/clients/new"
						>
							Add Client
						</Button>
					</Grid>
					<Grid item xs={6} sm={3}>
						<Button
							variant="outlined"
							fullWidth
							component={Link}
							href="/appointments/new"
						>
							Schedule
						</Button>
					</Grid>
					<Grid item xs={6} sm={3}>
						<Button
							variant="outlined"
							fullWidth
							component={Link}
							href="/invoices/new"
						>
							Create Invoice
						</Button>
					</Grid>
				</Grid>

				{/* Today's Appointments */}
				<Card sx={{ mt: 4 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Today's Appointments
						</Typography>
						<List>
							{upcomingAppointments.map((appointment) => (
								<ListItem key={appointment.id} divider>
									<ListItemText
										primary={appointment.client}
										secondary={`${appointment.time} - ${appointment.service}`}
									/>
								</ListItem>
							))}
						</List>
					</CardContent>
				</Card>

				{/* High Priority Garments */}
				<Card sx={{ mt: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							High Priority Garments
						</Typography>
						<List>
							{highPriorityGarments.map((garment) => (
								<ListItem key={garment.id} divider>
									<ListItemText
										primary={garment.title}
										secondary={`${garment.client} - Due: ${garment.dueDate}`}
									/>
									<Chip label={garment.stage} size="small" />
								</ListItem>
							))}
						</List>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
}
