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
	TextField,
	InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { useState } from 'react';

export default function InvoicesPage() {
	const [tabValue, setTabValue] = useState(0);

	// Mock data for demonstration
	const invoices = [
		{
			id: '001',
			client: 'Jane Smith',
			amount: '$125.00',
			date: '2024-01-15',
			status: 'paid',
			dueDate: '2024-01-20',
		},
		{
			id: '002',
			client: 'John Doe',
			amount: '$45.00',
			date: '2024-01-14',
			status: 'sent',
			dueDate: '2024-01-28',
		},
		{
			id: '003',
			client: 'Sarah Johnson',
			amount: '$80.00',
			date: '2024-01-13',
			status: 'draft',
			dueDate: '2024-01-27',
		},
		{
			id: '004',
			client: 'Mike Wilson',
			amount: '$200.00',
			date: '2024-01-12',
			status: 'overdue',
			dueDate: '2024-01-10',
		},
		{
			id: '005',
			client: 'Emma Davis',
			amount: '$150.00',
			date: '2024-01-11',
			status: 'paid',
			dueDate: '2024-01-18',
		},
	];

	const filteredInvoices = invoices.filter((invoice) => {
		if (tabValue === 0) return true; // All
		if (tabValue === 1) return invoice.status === 'draft';
		if (tabValue === 2) return invoice.status === 'sent';
		if (tabValue === 3) return invoice.status === 'paid';
		if (tabValue === 4) return invoice.status === 'overdue';
		return true;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'draft':
				return 'default';
			case 'sent':
				return 'warning';
			case 'paid':
				return 'success';
			case 'overdue':
				return 'error';
			default:
				return 'default';
		}
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Invoices
				</Typography>

				{/* Search Bar */}
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search invoices..."
					sx={{ mb: 3 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
				/>

				{/* Tabs */}
				<Tabs
					value={tabValue}
					onChange={(_, newValue) => setTabValue(newValue)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{ mb: 3 }}
				>
					<Tab label="All" />
					<Tab label="Draft" />
					<Tab label="Sent" />
					<Tab label="Paid" />
					<Tab label="Overdue" />
				</Tabs>

				{/* Invoices List */}
				<List>
					{filteredInvoices.map((invoice) => (
						<ListItem
							key={invoice.id}
							component={Link}
							href={`/invoices/${invoice.id}`}
							sx={{
								bgcolor: 'background.paper',
								mb: 1,
								borderRadius: 1,
								'&:hover': {
									bgcolor: 'action.hover',
								},
							}}
						>
							<ListItemText
								primary={`Invoice #${invoice.id} - ${invoice.client}`}
								secondary={`Created: ${invoice.date} • Due: ${invoice.dueDate}`}
							/>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
								<Typography variant="h6">{invoice.amount}</Typography>
								<Chip
									label={invoice.status.toUpperCase()}
									color={getStatusColor(invoice.status) as any}
									size="small"
								/>
							</Box>
						</ListItem>
					))}
				</List>

				{/* Summary Cards */}
				<Grid container spacing={2} sx={{ mt: 3 }}>
					<Grid item xs={6} md={3}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Total Outstanding
								</Typography>
								<Typography variant="h5">$245.00</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={6} md={3}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Overdue
								</Typography>
								<Typography variant="h5" color="error">
									$200.00
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={6} md={3}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Paid This Month
								</Typography>
								<Typography variant="h5" color="success.main">
									$275.00
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={6} md={3}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" gutterBottom>
									Average Invoice
								</Typography>
								<Typography variant="h5">$120.00</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				{/* Floating Action Button */}
				<Fab
					color="primary"
					aria-label="create invoice"
					component={Link}
					href="/invoices/new"
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

// Add missing imports
import { Grid, Card, CardContent } from '@mui/material';
