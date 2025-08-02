'use client';

import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	CardMedia,
	Chip,
	Button,
	List,
	ListItem,
	ListItemText,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useState } from 'react';

export default function GarmentDetailPage({
	params,
}: {
	params: { id: string };
}) {
	const [stage, setStage] = useState('Sewing');

	// Mock data for demonstration
	const garment = {
		id: params.id,
		title: 'Blue Wedding Dress',
		client: { id: 1, name: 'Jane Smith' },
		order: { id: 1, number: '#001' },
		image: '/api/placeholder/400/400',
		stage: stage,
		dueDate: '2024-01-25',
		eventDate: '2024-02-01',
		createdAt: '2024-01-10',
		notes: 'Customer requested extra care with the lace details',
		services: [
			{ name: 'Hemming', price: '$35', completed: true },
			{ name: 'Take in sides', price: '$30', completed: false },
			{ name: 'Add bustle', price: '$45', completed: false },
		],
		measurements: {
			bust: '36"',
			waist: '28"',
			hips: '38"',
			length: '58"',
		},
	};

	const stages = [
		'Intake',
		'Cutting',
		'Sewing',
		'Pressing',
		'Ready',
		'Picked Up',
	];

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
			case 'Picked Up':
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
							{garment.title}
						</Typography>
						<Typography color="text.secondary">
							Order {garment.order.number} • {garment.client.name}
						</Typography>
					</Box>
					<Button variant="outlined" startIcon={<EditIcon />}>
						Edit
					</Button>
				</Box>

				<Grid container spacing={3}>
					{/* Left Column - Image and Stage */}
					<Grid item xs={12} md={4}>
						<Card sx={{ mb: 3 }}>
							<CardMedia
								component="img"
								image={garment.image}
								alt={garment.title}
								sx={{ height: 400, objectFit: 'cover' }}
							/>
							<Box sx={{ p: 2 }}>
								<Button
									variant="outlined"
									fullWidth
									startIcon={<CameraAltIcon />}
								>
									Update Photo
								</Button>
							</Box>
						</Card>

						{/* Stage Selector */}
						<Card>
							<CardContent>
								<FormControl fullWidth>
									<InputLabel>Stage</InputLabel>
									<Select
										value={stage}
										label="Stage"
										onChange={(e) => setStage(e.target.value)}
									>
										{stages.map((s) => (
											<MenuItem key={s} value={s}>
												{s}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</CardContent>
						</Card>
					</Grid>

					{/* Right Column - Details */}
					<Grid item xs={12} md={8}>
						{/* Key Dates */}
						<Card sx={{ mb: 3 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Important Dates
								</Typography>
								<Box sx={{ display: 'flex', gap: 3 }}>
									<Box>
										<Typography variant="body2" color="text.secondary">
											Due Date
										</Typography>
										<Typography variant="body1">{garment.dueDate}</Typography>
									</Box>
									<Box>
										<Typography variant="body2" color="text.secondary">
											Event Date
										</Typography>
										<Typography variant="body1">{garment.eventDate}</Typography>
									</Box>
									<Box>
										<Typography variant="body2" color="text.secondary">
											Created
										</Typography>
										<Typography variant="body1">{garment.createdAt}</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>

						{/* Services */}
						<Card sx={{ mb: 3 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Services
								</Typography>
								<List>
									{garment.services.map((service, index) => (
										<ListItem
											key={index}
											divider={index < garment.services.length - 1}
										>
											<ListItemText
												primary={service.name}
												secondary={service.price}
											/>
											<Chip
												label={service.completed ? 'Completed' : 'Pending'}
												color={service.completed ? 'success' : 'default'}
												size="small"
											/>
										</ListItem>
									))}
								</List>
								<Typography variant="h6" sx={{ mt: 2, textAlign: 'right' }}>
									Total: $110
								</Typography>
							</CardContent>
						</Card>

						{/* Measurements */}
						<Card sx={{ mb: 3 }}>
							<CardContent>
								<Typography variant="h6" gutterBottom>
									Measurements
								</Typography>
								<Grid container spacing={2}>
									{Object.entries(garment.measurements).map(([key, value]) => (
										<Grid item xs={6} sm={3} key={key}>
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ textTransform: 'capitalize' }}
											>
												{key}
											</Typography>
											<Typography variant="body1">{value}</Typography>
										</Grid>
									))}
								</Grid>
							</CardContent>
						</Card>

						{/* Notes */}
						{garment.notes && (
							<Card>
								<CardContent>
									<Typography variant="h6" gutterBottom>
										Notes
									</Typography>
									<Typography>{garment.notes}</Typography>
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
