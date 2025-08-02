'use client';

import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	IconButton,
	Fab,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { useState } from 'react';

export default function AppointmentsPage() {
	const [currentDate, setCurrentDate] = useState(new Date());

	// Mock data for demonstration
	const appointments = [
		{
			id: 1,
			time: '09:00 AM',
			client: 'Jane Smith',
			service: 'Fitting',
			duration: '30 min',
			color: '#2196F3',
		},
		{
			id: 2,
			time: '10:00 AM',
			client: 'John Doe',
			service: 'Pick up',
			duration: '15 min',
			color: '#4CAF50',
		},
		{
			id: 3,
			time: '11:30 AM',
			client: 'Sarah Johnson',
			service: 'Consultation',
			duration: '45 min',
			color: '#FF9800',
		},
		{
			id: 4,
			time: '02:00 PM',
			client: 'Mike Wilson',
			service: 'Fitting',
			duration: '30 min',
			color: '#2196F3',
		},
		{
			id: 5,
			time: '03:30 PM',
			client: 'Emma Davis',
			service: 'Drop off',
			duration: '15 min',
			color: '#9C27B0',
		},
	];

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const goToPreviousDay = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() - 1);
		setCurrentDate(newDate);
	};

	const goToNextDay = () => {
		const newDate = new Date(currentDate);
		newDate.setDate(newDate.getDate() + 1);
		setCurrentDate(newDate);
	};

	const goToToday = () => {
		setCurrentDate(new Date());
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Appointments
				</Typography>

				{/* Date Navigation */}
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<IconButton onClick={goToPreviousDay}>
								<ChevronLeftIcon />
							</IconButton>
							<Box sx={{ textAlign: 'center' }}>
								<Typography variant="h6">{formatDate(currentDate)}</Typography>
								{currentDate.toDateString() !== new Date().toDateString() && (
									<Button variant="text" size="small" onClick={goToToday}>
										Go to Today
									</Button>
								)}
							</Box>
							<IconButton onClick={goToNextDay}>
								<ChevronRightIcon />
							</IconButton>
						</Box>
					</CardContent>
				</Card>

				{/* Appointments List */}
				<Box sx={{ position: 'relative' }}>
					{appointments.map((appointment) => (
						<Card
							key={appointment.id}
							sx={{
								mb: 2,
								borderLeft: `4px solid ${appointment.color}`,
								cursor: 'pointer',
								'&:hover': {
									boxShadow: 3,
								},
							}}
						>
							<CardContent>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Box>
										<Typography variant="h6" component="div">
											{appointment.time}
										</Typography>
										<Typography variant="body1">
											{appointment.client}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{appointment.service} • {appointment.duration}
										</Typography>
									</Box>
									<Chip
										label={appointment.service}
										size="small"
										sx={{ bgcolor: appointment.color, color: 'white' }}
									/>
								</Box>
							</CardContent>
						</Card>
					))}
				</Box>

				{/* Week View Button */}
				<Box sx={{ mt: 3, textAlign: 'center' }}>
					<Button variant="outlined">Switch to Week View</Button>
				</Box>

				{/* Floating Action Button */}
				<Fab
					color="primary"
					aria-label="add appointment"
					component={Link}
					href="/appointments/new"
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
import { Button, Chip } from '@mui/material';
