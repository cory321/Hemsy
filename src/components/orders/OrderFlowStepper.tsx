'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
	Box,
	Stepper,
	Step,
	StepLabel,
	Button,
	Typography,
	Card,
	CardContent,
	useTheme,
	useMediaQuery,
	Container,
	CircularProgress,
	MobileStepper,
	IconButton,
	Paper,
	Chip,
	Avatar,
} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { toast } from 'react-hot-toast';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import { useResponsive } from '@/hooks/useResponsive';

import type { GarmentDraft, ServiceLine } from '@/contexts/OrderFlowContext';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import Step1ClientSelection from './steps/Step1ClientSelection';
import Step2GarmentDetails from './steps/Step2GarmentDetails';
import Step3Summary from './steps/Step3Summary';
import { createOrder } from '@/lib/actions/orders';
import { createOrderWithPayment } from '@/lib/actions/orders-with-payment';
import OrderPaymentDialog from './OrderPaymentDialog';

const steps = ['Select Client', 'Add Garments & Services', 'Review & Confirm'];

export default function OrderFlowStepper() {
	const theme = useTheme();
	const { isMobile, isDesktop } = useResponsive();
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isNavigating, setIsNavigating] = useState(false);
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [createdOrder, setCreatedOrder] = useState<any>(null);

	const {
		currentStep,
		setCurrentStep,
		orderDraft,
		resetOrder,
		updateOrderDraft,
		taxPercent, // Use tax percent from context (server-fetched)
	} = useOrderFlow();

	const getSubmitButtonText = () => {
		if (!orderDraft.paymentIntent) {
			return 'Select Payment Option';
		}

		if (orderDraft.paymentIntent.collectNow) {
			// If collectNow is true, a payment method must be selected
			if (!orderDraft.paymentIntent.method) {
				return 'Select Payment Method';
			}

			switch (orderDraft.paymentIntent.method) {
				case 'stripe':
					return 'Create Order & Charge Card';
				case 'cash':
					return 'Create Order & Record Cash Payment';
				case 'external_pos':
					return 'Create Order & Record POS Payment';
				default:
					return 'Create Order';
			}
		}

		return 'Create Order & Send Invoice';
	};

	const handlePaymentSuccess = () => {
		// Payment successful, order already created, just navigate
		toast.success('Payment processed successfully!');
		setShowPaymentDialog(false);
		setIsNavigating(true);
		router.replace(`/orders/${createdOrder.orderId}`);
		resetOrder();
	};

	const handleNext = () => {
		if (currentStep === 0 && !orderDraft.clientId) {
			toast.error('Please select a client before proceeding');
			return;
		}
		if (currentStep === 1 && orderDraft.garments.length === 0) {
			toast.error('Please add at least one garment before proceeding');
			return;
		}
		setCurrentStep(currentStep + 1);
	};

	const handleBack = () => {
		setCurrentStep(currentStep - 1);
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			// Prepare the order data
			const garmentsNormalized = assignDefaultGarmentNames<GarmentDraft>(
				orderDraft.garments
			);
			const orderData = {
				clientId: orderDraft.clientId,
				discountCents: orderDraft.discountCents,
				notes: orderDraft.notes,
				taxPercent: taxPercent, // Already in percent form (7.5 for 7.5%)
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				garments: garmentsNormalized.map((garment: GarmentDraft) => {
					const garmentData = {
						name: garment.name,
						notes: garment.notes,
						dueDate: garment.dueDate || undefined,
						eventDate: garment.eventDate || undefined,
						presetIconKey: garment.presetIconKey || undefined,
						presetFillColor: garment.presetFillColor || undefined,
						imageCloudId:
							garment.imageCloudId || garment.cloudinaryPublicId || undefined,
						imageUrl: garment.imageUrl || undefined,
						services: garment.services.map((service: ServiceLine) => ({
							quantity: service.quantity,
							unit: service.unit,
							unitPriceCents: service.unitPriceCents,
							serviceId: service.serviceId,
							name: service.name,
							description: service.description,
						})),
					};

					// Debug logging to verify icon/image data is present
					if (process.env.NODE_ENV === 'development') {
						console.log('Garment submission data:', {
							name: garmentData.name,
							presetIconKey: garmentData.presetIconKey,
							presetFillColor: garmentData.presetFillColor,
							imageCloudId: garmentData.imageCloudId,
							imageUrl: garmentData.imageUrl,
						});
					}

					return garmentData;
				}),
			};

			// Calculate total amount for payment dialog
			const subtotal = orderDraft.garments.reduce((total, garment) => {
				return (
					total +
					garment.services.reduce(
						(sum, service) => sum + service.quantity * service.unitPriceCents,
						0
					)
				);
			}, 0);
			const afterDiscount = subtotal - orderDraft.discountCents;
			const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
			const totalAmount = afterDiscount + taxAmount;

			// Debug: Log what we're sending
			console.log('💰 Order submission data:', {
				subtotal,
				afterDiscount,
				taxPercent,
				taxPercentType: typeof taxPercent,
				taxAmount,
				totalAmount,
				orderDataTaxPercent: orderData.taxPercent,
				orderDataType: typeof orderData.taxPercent,
			});

			// Always create order with invoice first
			const result = await createOrderWithPayment({
				orderData,
				paymentIntent: orderDraft.paymentIntent || {
					collectNow: false, // Create invoice even if no payment intent selected
				},
			});

			if (result.success) {
				// If Stripe payment was selected, show payment dialog
				if (
					orderDraft.paymentIntent?.collectNow &&
					orderDraft.paymentIntent.method === 'stripe'
				) {
					setCreatedOrder({
						orderId: result.orderId,
						invoiceId: result.invoiceId,
						orderNumber: `Order ${result.orderId.slice(0, 8)}`,
						totalAmount,
						depositAmount: orderDraft.paymentIntent.depositAmount,
					});
					setShowPaymentDialog(true);
					setIsSubmitting(false);
					return; // Don't navigate yet, wait for payment
				}

				// For other payment methods or invoice-only, navigate immediately
				toast.success('Order created successfully!');
				setIsNavigating(true);
				router.replace(`/orders/${result.orderId}`);
				resetOrder();
			} else {
				console.error('Order creation failed:', result);
				// Show specific error message if available
				let errorMessage = 'Failed to create order. Please try again.';

				if ('error' in result && result.error) {
					errorMessage = result.error;
				} else if ('errors' in result && result.errors) {
					const errors = result.errors as any;
					errorMessage =
						errors?.root?.[0] ||
						Object.values(errors || {}).flat()[0] ||
						'Failed to create order. Please try again.';
				}

				toast.error(errorMessage);
			}
		} catch (error) {
			console.error('Error submitting order:', error);
			toast.error('An error occurred. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStepContent = () => {
		switch (currentStep) {
			case 0:
				return <Step1ClientSelection />;
			case 1:
				return <Step2GarmentDetails />;
			case 2:
				return (
					<Step3Summary
						onSubmit={handleSubmit}
						isSubmitting={isSubmitting}
						canSubmit={canProceed()}
						submitText={getSubmitButtonText()}
					/>
				);
			default:
				return 'Unknown step';
		}
	};

	const canProceed = () => {
		switch (currentStep) {
			case 0:
				return !!orderDraft.clientId;
			case 1:
				// Garment name is optional now; only require at least one garment
				// and at least one service per garment.
				return (
					orderDraft.garments.length > 0 &&
					orderDraft.garments.every((g) => g.services.length > 0)
				);
			case 2:
				// Require payment intent to be selected
				if (!orderDraft.paymentIntent) {
					return false;
				}
				// If collectNow is true, a payment method must be selected
				if (
					orderDraft.paymentIntent.collectNow &&
					!orderDraft.paymentIntent.method
				) {
					return false;
				}
				return true;
			default:
				return false;
		}
	};

	// Show loading state during navigation to prevent step flash
	if (isNavigating) {
		return (
			<Container maxWidth="lg">
				<Box
					sx={{
						width: '100%',
						mt: 4,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: '400px',
					}}
				>
					<Box sx={{ textAlign: 'center' }}>
						<CircularProgress size={40} />
						<Typography variant="body1" sx={{ mt: 2 }}>
							Creating new order...
						</Typography>
					</Box>
				</Box>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg">
			<Box sx={{ width: '100%', mt: isMobile ? 2 : 4 }}>
				{/* Desktop Stepper */}
				{!isMobile && (
					<Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
						{steps.map((label) => (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						))}
					</Stepper>
				)}

				{/* Mobile Step Indicator */}
				{isMobile && (
					<Box sx={{ mb: 2, textAlign: 'center' }}>
						<Typography variant="overline" color="text.secondary">
							Step {currentStep + 1} of {steps.length}
						</Typography>
						<Typography variant="h6">{steps[currentStep]}</Typography>
					</Box>
				)}

				{/* Selected Client Display - Show on Step 2 only */}
				{currentStep === 1 && orderDraft.client && (
					<Paper
						elevation={0}
						sx={{
							mb: 3,
							p: 2,
							backgroundColor: 'grey.50',
							border: '1px solid',
							borderColor: 'divider',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							flexWrap: 'wrap',
							gap: 1,
						}}
					>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								flexWrap: 'wrap',
							}}
						>
							<Avatar
								sx={{
									width: 32,
									height: 32,
									bgcolor: 'primary.main',
									color: 'white',
								}}
							>
								<PersonIcon fontSize="small" />
							</Avatar>
							<Typography variant="body1" fontWeight="medium">
								{orderDraft.client.first_name} {orderDraft.client.last_name}
							</Typography>
							<Chip
								icon={<EmailIcon />}
								label={orderDraft.client.email}
								size="small"
								variant="outlined"
							/>
							{orderDraft.client.phone_number && (
								<Chip
									icon={<PhoneIcon />}
									label={orderDraft.client.phone_number}
									size="small"
									variant="outlined"
								/>
							)}
						</Box>
						{currentStep === 1 && (
							<Button
								size="small"
								onClick={() => {
									updateOrderDraft({
										clientId: '',
										client: undefined,
									});
									setCurrentStep(0);
								}}
							>
								Change Client
							</Button>
						)}
					</Paper>
				)}

				{/* Content */}
				<Card sx={{ mb: 4 }}>
					<CardContent sx={{ p: isMobile ? 2 : 3 }}>
						{getStepContent()}
					</CardContent>
				</Card>

				{/* Navigation */}
				{isMobile ? (
					<MobileStepper
						variant="dots"
						steps={steps.length}
						position="static"
						activeStep={currentStep}
						sx={{ flexGrow: 1, bgcolor: 'transparent' }}
						nextButton={
							currentStep === steps.length - 1 ? (
								<Button
									size="small"
									onClick={handleSubmit}
									disabled={isSubmitting || !canProceed()}
									endIcon={
										isSubmitting ? (
											<CircularProgress size={16} color="inherit" />
										) : undefined
									}
								>
									{isSubmitting ? 'Processing' : 'Complete'}
								</Button>
							) : (
								<Button
									size="small"
									onClick={handleNext}
									disabled={!canProceed()}
									endIcon={<KeyboardArrowRight />}
								>
									Next
								</Button>
							)
						}
						backButton={
							<Button
								size="small"
								onClick={handleBack}
								disabled={currentStep === 0}
								startIcon={<KeyboardArrowLeft />}
							>
								Back
							</Button>
						}
					/>
				) : (
					<Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
						<Button
							disabled={currentStep === 0}
							onClick={handleBack}
							sx={{ mr: 1 }}
						>
							Back
						</Button>
						<Box sx={{ flex: '1' }} />
						{currentStep === steps.length - 1 ? (
							<Button
								variant="contained"
								onClick={handleSubmit}
								disabled={isSubmitting || !canProceed()}
								startIcon={
									isSubmitting ? (
										<CircularProgress size={16} color="inherit" />
									) : undefined
								}
							>
								{isSubmitting ? 'Processing...' : getSubmitButtonText()}
							</Button>
						) : (
							<Button
								variant="contained"
								onClick={handleNext}
								disabled={!canProceed()}
							>
								Next
							</Button>
						)}
					</Box>
				)}

				{/* Payment Dialog for Stripe payments */}
				{showPaymentDialog && createdOrder && orderDraft.client && (
					<OrderPaymentDialog
						open={showPaymentDialog}
						onClose={() => {
							setShowPaymentDialog(false);
							setCreatedOrder(null);
						}}
						order={{
							id: createdOrder.orderId,
							orderNumber: createdOrder.orderNumber,
							total: createdOrder.totalAmount,
						}}
						invoice={{
							id: createdOrder.invoiceId,
							invoiceNumber: `INV-${createdOrder.orderId.slice(0, 8)}`,
						}}
						client={{
							email: orderDraft.client.email,
							firstName: orderDraft.client.first_name,
							lastName: orderDraft.client.last_name,
						}}
						paymentType={createdOrder.depositAmount ? 'custom' : 'remainder'}
						depositAmount={createdOrder.depositAmount}
						onPaymentSuccess={handlePaymentSuccess}
					/>
				)}
			</Box>
		</Container>
	);
}
