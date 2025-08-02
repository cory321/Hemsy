import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	Button,
	Chip,
	Divider,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';

export default function InvoiceDetailPage({
	params,
}: {
	params: { id: string };
}) {
	// Mock data for demonstration
	const invoice = {
		id: params.id,
		status: 'sent',
		createdDate: '2024-01-14',
		dueDate: '2024-01-28',
		client: {
			name: 'John Doe',
			email: 'john.doe@example.com',
			phone: '(555) 234-5678',
			address: '456 Oak St, City, State 12345',
		},
		business: {
			name: "Sarah's Alterations",
			email: 'sarah@alterations.com',
			phone: '(555) 111-2222',
			address: '123 Main St, City, State 12345',
		},
		items: [
			{ description: 'Hemming - Dress', quantity: 1, price: 35, total: 35 },
			{ description: 'Take in sides', quantity: 1, price: 30, total: 30 },
			{ description: 'Shorten sleeves', quantity: 2, price: 25, total: 50 },
		],
		subtotal: 115,
		tax: 9.2,
		total: 124.2,
		paymentLink: 'https://pay.stripe.com/...',
	};

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
							Invoice #{invoice.id}
						</Typography>
						<Chip
							label={invoice.status.toUpperCase()}
							color={getStatusColor(invoice.status) as any}
							size="small"
							sx={{ mt: 1 }}
						/>
					</Box>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button variant="outlined" startIcon={<EditIcon />}>
							Edit
						</Button>
						<Button variant="outlined" startIcon={<PrintIcon />}>
							Print
						</Button>
						{invoice.status === 'draft' && (
							<Button variant="contained" startIcon={<SendIcon />}>
								Send Invoice
							</Button>
						)}
						{invoice.status === 'sent' && (
							<Button variant="contained" startIcon={<PaymentIcon />}>
								Record Payment
							</Button>
						)}
					</Box>
				</Box>

				<Grid container spacing={3}>
					<Grid item xs={12} md={8}>
						{/* Invoice Details */}
						<Card>
							<CardContent>
								{/* Business & Client Info */}
								<Grid container spacing={3} sx={{ mb: 4 }}>
									<Grid item xs={12} sm={6}>
										<Typography variant="h6" gutterBottom>
											From
										</Typography>
										<Typography variant="body1" fontWeight="bold">
											{invoice.business.name}
										</Typography>
										<Typography variant="body2">
											{invoice.business.address}
										</Typography>
										<Typography variant="body2">
											{invoice.business.email}
										</Typography>
										<Typography variant="body2">
											{invoice.business.phone}
										</Typography>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Typography variant="h6" gutterBottom>
											Bill To
										</Typography>
										<Typography variant="body1" fontWeight="bold">
											{invoice.client.name}
										</Typography>
										<Typography variant="body2">
											{invoice.client.address}
										</Typography>
										<Typography variant="body2">
											{invoice.client.email}
										</Typography>
										<Typography variant="body2">
											{invoice.client.phone}
										</Typography>
									</Grid>
								</Grid>

								<Divider sx={{ my: 3 }} />

								{/* Invoice Items */}
								<TableContainer>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell>Description</TableCell>
												<TableCell align="center">Qty</TableCell>
												<TableCell align="right">Price</TableCell>
												<TableCell align="right">Total</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{invoice.items.map((item, index) => (
												<TableRow key={index}>
													<TableCell>{item.description}</TableCell>
													<TableCell align="center">{item.quantity}</TableCell>
													<TableCell align="right">
														${item.price.toFixed(2)}
													</TableCell>
													<TableCell align="right">
														${item.total.toFixed(2)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</TableContainer>

								{/* Totals */}
								<Box sx={{ mt: 3, ml: 'auto', maxWidth: 300 }}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
										}}
									>
										<Typography>Subtotal</Typography>
										<Typography>${invoice.subtotal.toFixed(2)}</Typography>
									</Box>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											mb: 1,
										}}
									>
										<Typography>Tax (8%)</Typography>
										<Typography>${invoice.tax.toFixed(2)}</Typography>
									</Box>
									<Divider sx={{ my: 1 }} />
									<Box
										sx={{ display: 'flex', justifyContent: 'space-between' }}
									>
										<Typography variant="h6">Total</Typography>
										<Typography variant="h6">
											${invoice.total.toFixed(2)}
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>
					</Grid>

					<Grid item xs={12} md={4}>
						{/* Invoice Info */}
						<Card sx={{ mb: 3 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Invoice Details
								</Typography>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary">
										Invoice Number
									</Typography>
									<Typography>#{invoice.id}</Typography>
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary">
										Created Date
									</Typography>
									<Typography>{invoice.createdDate}</Typography>
								</Box>
								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" color="text.secondary">
										Due Date
									</Typography>
									<Typography>{invoice.dueDate}</Typography>
								</Box>
							</CardContent>
						</Card>

						{/* Payment Link */}
						{invoice.status === 'sent' && (
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Payment Options
									</Typography>
									<Button
										variant="contained"
										fullWidth
										startIcon={<PaymentIcon />}
										sx={{ mb: 2 }}
									>
										Pay Online
									</Button>
									<Typography variant="body2" color="text.secondary">
										Or mark as paid manually if payment was received by cash or
										other means.
									</Typography>
								</CardContent>
							</Card>
						)}
					</Grid>
				</Grid>
			</Box>
		</Container>
	);
}

// Add missing import
import { Grid } from '@mui/material';
