'use client';

import {
	Container,
	Typography,
	Box,
	Stepper,
	Step,
	StepLabel,
	Button,
	Card,
	CardContent,
} from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewOrderPage() {
	const router = useRouter();
	const [activeStep, setActiveStep] = useState(0);

	const steps = [
		'Select Client',
		'Add Garments',
		'Add Services',
		'Review & Confirm',
	];

	const handleNext = () => {
		if (activeStep === steps.length - 1) {
			// TODO: Handle order submission
			router.push('/orders');
		} else {
			setActiveStep((prevStep) => prevStep + 1);
		}
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const renderStepContent = () => {
		switch (activeStep) {
			case 0:
				return (
					<Typography>
						Step 1: Select or create a client for this order.
					</Typography>
				);
			case 1:
				return (
					<Typography>
						Step 2: Add garments to the order and specify details.
					</Typography>
				);
			case 2:
				return (
					<Typography>Step 3: Select services for each garment.</Typography>
				);
			case 3:
				return (
					<Typography>Step 4: Review the order details and confirm.</Typography>
				);
			default:
				return null;
		}
	};

	return (
		<Container maxWidth="md">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Create New Order
				</Typography>

				<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Card>
					<CardContent sx={{ minHeight: 300 }}>
						{renderStepContent()}
					</CardContent>
				</Card>

				<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
					<Button onClick={() => router.back()} variant="outlined">
						Cancel
					</Button>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button disabled={activeStep === 0} onClick={handleBack}>
							Back
						</Button>
						<Button variant="contained" onClick={handleNext}>
							{activeStep === steps.length - 1 ? 'Create Order' : 'Next'}
						</Button>
					</Box>
				</Box>
			</Box>
		</Container>
	);
}
