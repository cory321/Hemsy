'use client';

import {
	Container,
	Typography,
	Box,
	Tabs,
	Tab,
	Grid,
	Card,
	CardContent,
	CardMedia,
	Chip,
	IconButton,
	Menu,
	MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';
import Link from 'next/link';

export default function GarmentsPage() {
	const [tabValue, setTabValue] = useState(0);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

	// Mock data for demonstration
	const garments = [
		{
			id: 1,
			title: 'Blue Wedding Dress',
			client: 'Jane Smith',
			dueDate: '2024-01-20',
			stage: 'Cutting',
			image: '/api/placeholder/200/200',
		},
		{
			id: 2,
			title: 'Black Suit',
			client: 'John Doe',
			dueDate: '2024-01-22',
			stage: 'Sewing',
			image: '/api/placeholder/200/200',
		},
		{
			id: 3,
			title: 'Red Evening Gown',
			client: 'Sarah Johnson',
			dueDate: '2024-01-25',
			stage: 'Intake',
			image: '/api/placeholder/200/200',
		},
		{
			id: 4,
			title: 'Navy Blazer',
			client: 'Mike Wilson',
			dueDate: '2024-01-23',
			stage: 'Pressing',
			image: '/api/placeholder/200/200',
		},
		{
			id: 5,
			title: 'White Shirt',
			client: 'Emma Davis',
			dueDate: '2024-01-21',
			stage: 'Ready',
			image: '/api/placeholder/200/200',
		},
		{
			id: 6,
			title: 'Green Dress',
			client: 'Lisa Brown',
			dueDate: '2024-01-24',
			stage: 'Sewing',
			image: '/api/placeholder/200/200',
		},
	];

	const stages = ['All', 'Intake', 'Cutting', 'Sewing', 'Pressing', 'Ready'];

	const filteredGarments = garments.filter((garment) => {
		if (tabValue === 0) return true;
		return garment.stage === stages[tabValue];
	});

	const getStageColor = (stage: string) => {
		switch (stage) {
			case 'Intake':
				return 'default';
			case 'Cutting':
				return 'info';
			case 'Sewing':
				return 'warning';
			case 'Pressing':
				return 'secondary';
			case 'Ready':
				return 'success';
			default:
				return 'default';
		}
	};

	const getDueDateColor = (dueDate: string) => {
		const due = new Date(dueDate);
		const today = new Date();
		const daysUntilDue = Math.ceil(
			(due.getTime() - today.getTime()) / (1000 * 3600 * 24)
		);

		if (daysUntilDue < 0) return 'error';
		if (daysUntilDue <= 2) return 'warning';
		return 'default';
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Garments
				</Typography>

				{/* Stage Tabs */}
				<Tabs
					value={tabValue}
					onChange={(_, newValue) => setTabValue(newValue)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{ mb: 3 }}
				>
					{stages.map((stage) => (
						<Tab key={stage} label={stage} />
					))}
				</Tabs>

				{/* Garments Grid */}
				<Grid container spacing={2}>
					{filteredGarments.map((garment) => (
						<Grid item xs={12} sm={6} md={4} key={garment.id}>
							<Card
								component={Link}
								href={`/garments/${garment.id}`}
								sx={{
									textDecoration: 'none',
									'&:hover': {
										boxShadow: 3,
									},
								}}
							>
								<CardMedia
									component="img"
									height="200"
									image={garment.image}
									alt={garment.title}
									sx={{ objectFit: 'cover' }}
								/>
								<CardContent>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'flex-start',
										}}
									>
										<Box sx={{ flex: 1 }}>
											<Typography variant="h6" component="div" gutterBottom>
												{garment.title}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{garment.client}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												Due: {garment.dueDate}
											</Typography>
										</Box>
										<IconButton
											size="small"
											onClick={(e) => {
												e.preventDefault();
												setAnchorEl(e.currentTarget);
											}}
										>
											<MoreVertIcon />
										</IconButton>
									</Box>
									<Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
										<Chip
											label={garment.stage}
											size="small"
											color={getStageColor(garment.stage) as any}
										/>
										<Chip
											label={`Due: ${garment.dueDate}`}
											size="small"
											color={getDueDateColor(garment.dueDate) as any}
											variant="outlined"
										/>
									</Box>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>

				<Menu
					anchorEl={anchorEl}
					open={Boolean(anchorEl)}
					onClose={() => setAnchorEl(null)}
				>
					<MenuItem onClick={() => setAnchorEl(null)}>Edit</MenuItem>
					<MenuItem onClick={() => setAnchorEl(null)}>Change Stage</MenuItem>
					<MenuItem onClick={() => setAnchorEl(null)}>Delete</MenuItem>
				</Menu>
			</Box>
		</Container>
	);
}
