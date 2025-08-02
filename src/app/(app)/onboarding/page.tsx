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
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
	const router = useRouter();
	const [activeStep, setActiveStep] = useState(0);
	const [formData, setFormData] = useState({
		businessName: '',
		businessType: '',
		address: '',
		phone: '',
		workingHours: {},
		paymentPreference: 'after',
	});

	const steps = [
		'Business Info',
		'Location & Hours',
		'Payment Preferences',
		'Get Started',
	];

	const handleNext = () => {
		if (activeStep === steps.length - 1) {
			// TODO: Save onboarding data
			router.push('/dashboard');
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
					<Box>
						<Typography variant="h6" gutterBottom>
							Tell us about your business
						</Typography>
						<TextField
							fullWidth
							label="Business Name"
							value={formData.businessName}
							onChange={(e) =>
								setFormData({ ...formData, businessName: e.target.value })
							}
							sx={{ mb: 3 }}
							required
						/>
						<FormControl fullWidth sx={{ mb: 3 }}>
							<InputLabel>Business Type</InputLabel>
							<Select
								value={formData.businessType}
								label="Business Type"
								onChange={(e) =>
									setFormData({ ...formData, businessType: e.target.value })
								}
							>
								<MenuItem value="alterations">Alterations Shop</MenuItem>
								<MenuItem value="tailor">Custom Tailoring</MenuItem>
								<MenuItem value="both">Both Alterations & Tailoring</MenuItem>
								<MenuItem value="mobile">Mobile/Home Service</MenuItem>
							</Select>
						</FormControl>
						<TextField
							fullWidth
							label="Phone Number"
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: e.target.value })
							}
							type="tel"
						/>
					</Box>
				);
			case 1:
				return (
					<Box>
						<Typography variant="h6" gutterBottom>
							Where is your business located?
						</Typography>
						<TextField
							fullWidth
							label="Business Address"
							value={formData.address}
							onChange={(e) =>
								setFormData({ ...formData, address: e.target.value })
							}
							multiline
							rows={2}
							sx={{ mb: 3 }}
							helperText="Leave blank if you work from home or are mobile-only"
						/>
						<Typography variant="body1" gutterBottom sx={{ mt: 3 }}>
							What are your typical working hours?
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							You can customize these later in settings
						</Typography>
						{/* Simplified working hours for onboarding */}
						<Box sx={{ mt: 2 }}>
							<TextField
								label="Weekday Hours"
								defaultValue="9:00 AM - 6:00 PM"
								fullWidth
								sx={{ mb: 2 }}
							/>
							<TextField
								label="Weekend Hours"
								defaultValue="10:00 AM - 4:00 PM"
								fullWidth
							/>
						</Box>
					</Box>
				);
			case 2:
				return (
					<Box>
						<Typography variant="h6" gutterBottom>
							How do you prefer to handle payments?
						</Typography>
						<FormControl fullWidth>
							<InputLabel>Payment Preference</InputLabel>
							<Select
								value={formData.paymentPreference}
								label="Payment Preference"
								onChange={(e) =>
									setFormData({
										...formData,
										paymentPreference: e.target.value,
									})
								}
							>
								<MenuItem value="before">
									<Box>
										<Typography>Payment before service</Typography>
										<Typography variant="body2" color="text.secondary">
											Customers pay when dropping off garments
										</Typography>
									</Box>
								</MenuItem>
								<MenuItem value="after">
									<Box>
										<Typography>Payment after service</Typography>
										<Typography variant="body2" color="text.secondary">
											Customers pay when picking up completed items
										</Typography>
									</Box>
								</MenuItem>
								<MenuItem value="mixed">
									<Box>
										<Typography>Flexible payment</Typography>
										<Typography variant="body2" color="text.secondary">
											Decide payment timing per order
										</Typography>
									</Box>
								</MenuItem>
							</Select>
						</FormControl>
						<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
							You can change this preference anytime and override it for
							individual orders.
						</Typography>
					</Box>
				);
			case 3:
				return (
					<Box sx={{ textAlign: 'center' }}>
						<Typography variant="h5" gutterBottom>
							You're all set! 🎉
						</Typography>
						<Typography variant="body1" color="text.secondary" paragraph>
							Your 14-day free trial starts now. No credit card required.
						</Typography>
						<Typography variant="body1" paragraph>
							We've set up your account with the information you provided. You
							can start adding clients and creating orders right away.
						</Typography>
						<Box
							sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}
						>
							<Typography variant="h6" gutterBottom>
								Quick Start Tips:
							</Typography>
							<Typography variant="body2" align="left">
								• Add your alteration services and pricing
								<br />
								• Create your first client
								<br />
								• Schedule your first appointment
								<br />• Explore the dashboard for quick actions
							</Typography>
						</Box>
					</Box>
				);
			default:
				return null;
		}
	};

	return (
		<Container maxWidth="sm">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" align="center" gutterBottom>
					Welcome to Threadfolio
				</Typography>
				<Typography
					variant="body1"
					color="text.secondary"
					align="center"
					paragraph
				>
					Let's get your seamstress business set up in just a few minutes
				</Typography>

				<Stepper activeStep={activeStep} sx={{ mb: 4 }}>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Card>
					<CardContent sx={{ minHeight: 400, p: 4 }}>
						{renderStepContent()}
					</CardContent>
				</Card>

				<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
					<Button disabled={activeStep === 0} onClick={handleBack}>
						Back
					</Button>
					<Button variant="contained" onClick={handleNext} size="large">
						{activeStep === steps.length - 1 ? 'Go to Dashboard' : 'Next'}
					</Button>
				</Box>
			</Box>
		</Container>
	);
}
