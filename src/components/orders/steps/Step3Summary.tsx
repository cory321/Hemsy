'use client';

import React, { useState, useEffect } from 'react';
import {
	calculateDaysUntilDue,
	formatDateForDisplay,
} from '@/lib/utils/date-time-utils';
import {
	Box,
	Typography,
	Card,
	CardContent,
	Divider,
	TextField,
	Chip,
	IconButton,
	Collapse,
	Button,
	Avatar,
	Stack,
	alpha,
	useTheme,
	Alert,
	useMediaQuery,
	Table,
	TableBody,
	TableCell,
	TableRow,
	CircularProgress,
} from '@mui/material';
import {
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	AccessTime as TimeIcon,
	Event as EventIcon,
	ShoppingBag as ShoppingBagIcon,
	Person as PersonIcon,
	Email as EmailIcon,
	Phone as PhoneIcon,
	LocationOn as LocationIcon,
	AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import { formatCurrency, dollarsToCents } from '@/lib/utils/currency';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';
import { resolveGarmentDisplayImage } from '@/utils/displayImage';
import PaymentCollectionCard from '../PaymentCollectionCard';
import { formatPhoneNumber } from '@/lib/utils/phone';

// Helper Components
interface CollapsibleSectionProps {
	title: string;
	icon?: React.ReactNode;
	defaultOpen?: boolean;
	children: React.ReactNode;
	badge?: string | number;
	forceOpen?: boolean; // For desktop view
}

function CollapsibleSection({
	title,
	icon,
	defaultOpen = false,
	children,
	badge,
	forceOpen = false,
}: CollapsibleSectionProps) {
	const [open, setOpen] = useState(defaultOpen);
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
	const isOpen = forceOpen || (isDesktop ? true : open);

	return (
		<Card sx={{ mb: 2, overflow: 'visible' }}>
			<CardContent sx={{ pb: isOpen ? 2 : 1 }}>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						cursor: isDesktop ? 'default' : 'pointer',
						userSelect: 'none',
					}}
					onClick={() => !isDesktop && setOpen(!open)}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{icon}
						<Typography variant="h6">{title}</Typography>
						{badge && (
							<Chip label={badge} size="small" color="primary" sx={{ ml: 1 }} />
						)}
					</Box>
					{!isDesktop && (
						<IconButton size="small">
							{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</IconButton>
					)}
				</Box>
				<Collapse in={isOpen}>
					<Box sx={{ mt: 2 }}>{children}</Box>
				</Collapse>
			</CardContent>
		</Card>
	);
}

interface GarmentCardProps {
	garment: any;
	index: number;
}

function GarmentCard({ garment, index }: GarmentCardProps) {
	const theme = useTheme();
	const daysUntilDue = garment.dueDate
		? calculateDaysUntilDue(garment.dueDate)
		: null;
	const isUrgent = daysUntilDue !== null && daysUntilDue <= 2;

	const garmentTotal = garment.services.reduce(
		(sum: number, service: any) =>
			sum + service.quantity * service.unitPriceCents,
		0
	);

	return (
		<Card
			sx={{
				mb: 2,
			}}
		>
			<CardContent>
				{/* Garment Header */}
				<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
					<Box
						sx={{
							width: 48,
							height: 48,
							borderRadius: 2,
							overflow: 'hidden',
							bgcolor: 'grey.100',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						{(() => {
							const resolved = resolveGarmentDisplayImage({
								cloudPublicId: garment.cloudinaryPublicId,
								photoUrl: garment.cloudinaryUrl,
								presetIconKey: garment.presetIconKey,
							});

							if (resolved.kind === 'cloud') {
								return (
									<img
										src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,h_96,w_96/${garment.cloudinaryPublicId}`}
										alt={garment.name || 'Garment'}
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											borderRadius: 'inherit',
										}}
									/>
								);
							}

							return (
								<InlinePresetSvg
									src={resolved.src || '/presets/garments/select-garment.svg'}
									{...(garment.presetFillColor
										? { fillColor: garment.presetFillColor }
										: {})}
								/>
							);
						})()}
					</Box>
					<Box sx={{ flex: 1 }}>
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							{garment.name}
						</Typography>
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
							{isUrgent && (
								<Chip
									icon={<TimeIcon />}
									label="Rush"
									size="small"
									color="error"
								/>
							)}
							{garment.dueDate && (
								<Chip
									icon={<TimeIcon />}
									label={`Due ${formatDateForDisplay(garment.dueDate)}`}
									size="small"
									variant={isUrgent ? 'filled' : 'outlined'}
									color={isUrgent ? 'error' : 'default'}
								/>
							)}
							{garment.eventDate && (
								<Chip
									icon={<EventIcon />}
									label={`Event ${formatDateForDisplay(garment.eventDate)}`}
									size="small"
									color="secondary"
								/>
							)}
						</Box>
					</Box>
					<Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
						{formatCurrency(garmentTotal / 100)}
					</Typography>
				</Box>

				{/* Services */}
				<Box sx={{ mb: garment.notes ? 2 : 0 }}>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
						Services:
					</Typography>
					<Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1.5 }}>
						<Table
							size="small"
							sx={{ '& .MuiTableCell-root': { border: 0, py: 0.5 } }}
						>
							<TableBody>
								{garment.services.map((service: any, idx: number) => (
									<TableRow key={idx} sx={{ '&:last-child td': { pb: 0 } }}>
										<TableCell sx={{ pl: 0, fontWeight: 500 }}>
											{service.name}
										</TableCell>
										<TableCell
											align="right"
											sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
										>
											{(() => {
												if (service.unit === 'flat_rate') {
													return 'flat rate';
												} else if (service.unit === 'hour') {
													const hourlyRate = service.unitPriceCents / 100;
													return `${service.quantity} ${service.quantity === 1 ? 'hour' : 'hours'} (${formatCurrency(hourlyRate)}/hr)`;
												} else if (service.unit === 'day') {
													const dailyRate = service.unitPriceCents / 100;
													return `${service.quantity} ${service.quantity === 1 ? 'day' : 'days'} (${formatCurrency(dailyRate)}/day)`;
												} else {
													// For other units like 'item', 'yard', etc.
													return `${service.quantity} ${service.unit}${service.quantity !== 1 ? 's' : ''}`;
												}
											})()}
										</TableCell>
										<TableCell
											align="right"
											sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}
										>
											{formatCurrency(
												(service.quantity * service.unitPriceCents) / 100
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Box>
				</Box>

				{/* Notes */}
				{garment.notes && (
					<Alert severity="info" icon={false} sx={{ py: 1 }}>
						<Typography variant="body2">{garment.notes}</Typography>
					</Alert>
				)}
			</CardContent>
		</Card>
	);
}

interface Step3SummaryProps {
	onSubmit?: () => void;
	isSubmitting?: boolean;
	canSubmit?: boolean;
	submitText?: string;
}

export default function Step3Summary({
	onSubmit,
	isSubmitting,
	canSubmit,
	submitText,
}: Step3SummaryProps) {
	const {
		orderDraft,
		updateOrderDraft,
		calculateSubtotal,
		calculateTotal,
		taxPercent,
	} = useOrderFlow();
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
	const isMedium = useMediaQuery(theme.breakpoints.up('md'));
	const [discountDollars, setDiscountDollars] = useState(
		(orderDraft.discountCents / 100).toFixed(2)
	);

	const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setDiscountDollars(value);

		const cents = dollarsToCents(parseFloat(value) || 0);
		updateOrderDraft({ discountCents: Math.max(0, cents) });
	};

	const handleQuickDiscount = (percent: number) => {
		const subtotal = calculateSubtotal();
		const discountAmount = (subtotal * percent) / 100;
		const discountDollars = (discountAmount / 100).toFixed(2);
		setDiscountDollars(discountDollars);
		updateOrderDraft({ discountCents: Math.max(0, discountAmount) });
	};

	const subtotal = calculateSubtotal();
	const afterDiscount = subtotal - orderDraft.discountCents;
	const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
	const total = afterDiscount + taxAmount;

	const handlePaymentMethodSelect = (
		method: 'stripe' | 'cash' | 'external_pos' | 'send_invoice'
	) => {
		console.log('Payment method selected:', method);
	};

	const handlePaymentIntentChange = (paymentIntent: any) => {
		updateOrderDraft({ paymentIntent });
	};

	const handleStripePaymentSuccess = (paymentMethodId: string) => {
		console.log('Stripe payment method collected:', paymentMethodId);
		// The payment method is now ready for charging when order is submitted
	};

	// Calculate urgency indicators
	const urgentGarments = orderDraft.garments.filter((g) => {
		if (!g.dueDate) return false;
		const daysUntilDue = Math.ceil(calculateDaysUntilDue(g.dueDate));
		return daysUntilDue <= 2;
	});

	const shouldExpandGarments =
		urgentGarments.length > 0 || orderDraft.garments.length <= 3;

	// Get client initials for avatar
	const clientInitials = orderDraft.client
		? `${orderDraft.client.first_name?.[0] || ''}${orderDraft.client.last_name?.[0] || ''}`
		: '';

	// Desktop/Tablet layout - single column
	if (isMedium) {
		return (
			<Box sx={{ maxWidth: 1200, mx: 'auto' }}>
				{/* Desktop Header */}
				<Box sx={{ mb: 3 }}>
					<Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
						Order Summary
					</Typography>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
							<Avatar
								sx={{
									width: 48,
									height: 48,
									bgcolor: 'primary.main',
									color: 'white',
								}}
							>
								{clientInitials}
							</Avatar>
							<Box>
								<Typography variant="h6">
									{orderDraft.client?.first_name} {orderDraft.client?.last_name}
								</Typography>
								<Stack direction="row" spacing={2}>
									<Typography variant="body2" color="text.secondary">
										{orderDraft.client?.email}
									</Typography>
									{orderDraft.client?.phone_number && (
										<>
											<Divider orientation="vertical" flexItem />
											<Typography variant="body2" color="text.secondary">
												{formatPhoneNumber(
													orderDraft.client?.phone_number || ''
												)}
											</Typography>
										</>
									)}
								</Stack>
							</Box>
						</Box>
					</Box>
				</Box>

				{/* Garments Section */}
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								mb: 2,
							}}
						>
							<Typography variant="h6">Garments & Services</Typography>
							<Chip
								label={orderDraft.garments.length}
								size="small"
								color="primary"
							/>
						</Box>

						<Box>
							{orderDraft.garments.map((garment, index) => (
								<GarmentCard key={garment.id} garment={garment} index={index} />
							))}
						</Box>
					</CardContent>
				</Card>

				{/* Payment Collection */}
				<PaymentCollectionCard
					totalAmount={total}
					clientEmail={orderDraft.client?.email || ''}
					onPaymentMethodSelect={handlePaymentMethodSelect}
					onPaymentIntentChange={handlePaymentIntentChange}
					onStripePaymentSuccess={handleStripePaymentSuccess}
					{...(orderDraft.paymentIntent && {
						initialPaymentIntent: orderDraft.paymentIntent,
					})}
				/>

				{/* Order Notes */}
				<Card sx={{ mt: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Order Notes
						</Typography>
						<TextField
							fullWidth
							multiline
							rows={4}
							value={orderDraft.notes || ''}
							onChange={(e) => updateOrderDraft({ notes: e.target.value })}
							placeholder="Any additional notes for this order..."
							sx={{
								'& .MuiOutlinedInput-root': {
									bgcolor: 'background.paper',
								},
							}}
						/>
					</CardContent>
				</Card>

				{/* Pricing Breakdown - Now below Order Notes */}
				<Card sx={{ mt: 3 }}>
					<CardContent>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								mb: 2,
							}}
						>
							<MoneyIcon />
							<Typography variant="h6">Pricing Breakdown</Typography>
						</Box>

						{/* Pricing Details */}
						<Stack spacing={2}>
							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant="body1">Subtotal</Typography>
								<Typography variant="body1" sx={{ fontWeight: 500 }}>
									{formatCurrency(subtotal / 100)}
								</Typography>
							</Box>

							{/* Discount Section */}
							<Box>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										mb: 1,
									}}
								>
									<Typography variant="body1">Discount</Typography>
									<TextField
										size="small"
										value={discountDollars}
										onChange={handleDiscountChange}
										InputProps={{
											startAdornment: '$',
										}}
										sx={{ width: '120px' }}
									/>
								</Box>
								<Box sx={{ display: 'flex', gap: 1 }}>
									<Button
										size="small"
										variant="outlined"
										onClick={() => handleQuickDiscount(10)}
									>
										-10%
									</Button>
									<Button
										size="small"
										variant="outlined"
										onClick={() => handleQuickDiscount(15)}
									>
										-15%
									</Button>
									<Button
										size="small"
										variant="outlined"
										onClick={() => handleQuickDiscount(20)}
									>
										-20%
									</Button>
								</Box>
							</Box>

							{taxAmount > 0 && (
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
									}}
								>
									<Typography variant="body1">
										Sales Tax ({taxPercent.toFixed(1)}%)
									</Typography>
									<Typography variant="body1" sx={{ fontWeight: 500 }}>
										{formatCurrency(taxAmount / 100)}
									</Typography>
								</Box>
							)}

							<Divider />

							<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
								<Typography variant="h6">Total</Typography>
								<Typography
									variant="h6"
									color="primary"
									sx={{ fontWeight: 700 }}
								>
									{formatCurrency(total / 100)}
								</Typography>
							</Box>

							{/* Create Order Button below Total */}
							<Box sx={{ pt: 2 }}>
								<Button
									fullWidth
									variant="contained"
									onClick={onSubmit}
									disabled={Boolean(isSubmitting) || canSubmit === false}
									startIcon={
										isSubmitting ? (
											<CircularProgress size={16} color="inherit" />
										) : undefined
									}
								>
									{isSubmitting
										? 'Processing...'
										: submitText || 'Create Order'}
								</Button>
							</Box>

							{total > 500 && (
								<Alert severity="info" icon={<MoneyIcon />}>
									Consider collecting a 50% deposit (
									{formatCurrency(total / 2 / 100)})
								</Alert>
							)}
						</Stack>
					</CardContent>
				</Card>
			</Box>
		);
	}

	// Mobile/Tablet Layout (existing code)
	return (
		<Box sx={{ pb: isMedium ? 0 : 8 }}>
			{/* Hero Card */}
			<Card
				sx={{
					mb: 3,
					background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
					color: 'white',
				}}
			>
				<CardContent sx={{ p: 3 }}>
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<Box>
							<Typography variant="h3" sx={{ fontWeight: 700 }}>
								{formatCurrency(total / 100)}
							</Typography>
							<Typography variant="body2" sx={{ opacity: 0.9 }}>
								Total Amount
							</Typography>
						</Box>
						<Box sx={{ textAlign: 'right' }}>
							<Chip
								icon={<ShoppingBagIcon />}
								label={`${orderDraft.garments.length} garment${orderDraft.garments.length !== 1 ? 's' : ''}`}
								sx={{
									bgcolor: 'rgba(255, 255, 255, 0.2)',
									color: 'white',
									mb: 1,
								}}
							/>
							{urgentGarments.length > 0 && (
								<Chip
									icon={<TimeIcon />}
									label={`${urgentGarments.length} urgent`}
									color="error"
									sx={{ display: 'block', ml: 'auto' }}
								/>
							)}
						</Box>
					</Box>
				</CardContent>
			</Card>

			{/* Garments Section */}
			<CollapsibleSection
				title="Garments & Services"
				defaultOpen={shouldExpandGarments}
				badge={orderDraft.garments.length}
			>
				{orderDraft.garments.map((garment, index) => (
					<GarmentCard key={garment.id} garment={garment} index={index} />
				))}
			</CollapsibleSection>

			{/* Client Details Section */}
			<CollapsibleSection
				title="Client Details"
				icon={<PersonIcon />}
				defaultOpen={false}
			>
				{orderDraft.client && (
					<Stack spacing={2}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<PersonIcon fontSize="small" color="action" />
							<Typography variant="body1">
								{orderDraft.client.first_name} {orderDraft.client.last_name}
							</Typography>
						</Box>
						{orderDraft.client.email && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<EmailIcon fontSize="small" color="action" />
								<Typography variant="body1">
									{orderDraft.client.email}
								</Typography>
							</Box>
						)}
						{orderDraft.client.phone_number && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<PhoneIcon fontSize="small" color="action" />
								<Typography variant="body1">
									{formatPhoneNumber(orderDraft.client.phone_number || '')}
								</Typography>
							</Box>
						)}
						{orderDraft.client.mailing_address && (
							<Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
								<LocationIcon fontSize="small" color="action" />
								<Typography variant="body1">
									{orderDraft.client.mailing_address}
								</Typography>
							</Box>
						)}
					</Stack>
				)}
			</CollapsibleSection>

			{/* Pricing Section */}
			<CollapsibleSection
				title="Pricing Breakdown"
				icon={<MoneyIcon />}
				defaultOpen={true}
			>
				{/* Pricing Details */}
				<Stack spacing={2}>
					<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
						<Typography variant="body1">Subtotal</Typography>
						<Typography variant="body1" sx={{ fontWeight: 500 }}>
							{formatCurrency(subtotal / 100)}
						</Typography>
					</Box>

					{/* Discount Section */}
					<Box>
						<Box
							sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
						>
							<Typography variant="body1">Discount</Typography>
							<TextField
								size="small"
								value={discountDollars}
								onChange={handleDiscountChange}
								InputProps={{
									startAdornment: '$',
								}}
								sx={{ width: '120px' }}
							/>
						</Box>
						<Box sx={{ display: 'flex', gap: 1 }}>
							<Button
								size="small"
								variant="outlined"
								onClick={() => handleQuickDiscount(10)}
							>
								-10%
							</Button>
							<Button
								size="small"
								variant="outlined"
								onClick={() => handleQuickDiscount(15)}
							>
								-15%
							</Button>
							<Button
								size="small"
								variant="outlined"
								onClick={() => handleQuickDiscount(20)}
							>
								-20%
							</Button>
						</Box>
					</Box>

					{taxAmount > 0 && (
						<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
							<Typography variant="body1">
								Sales Tax ({taxPercent.toFixed(1)}%)
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 500 }}>
								{formatCurrency(taxAmount / 100)}
							</Typography>
						</Box>
					)}

					<Divider />

					<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
						<Typography variant="h6">Total</Typography>
						<Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
							{formatCurrency(total / 100)}
						</Typography>
					</Box>

					{total > 500 && (
						<Alert severity="info" icon={<MoneyIcon />}>
							Consider collecting a 50% deposit (
							{formatCurrency(total / 2 / 100)})
						</Alert>
					)}
				</Stack>
			</CollapsibleSection>

			{/* Order Notes */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Order Notes
					</Typography>
					<TextField
						fullWidth
						multiline
						rows={3}
						value={orderDraft.notes || ''}
						onChange={(e) => updateOrderDraft({ notes: e.target.value })}
						placeholder="Any additional notes for this order..."
						sx={{
							'& .MuiOutlinedInput-root': {
								bgcolor: 'background.paper',
							},
						}}
					/>
				</CardContent>
			</Card>

			{/* Payment Collection - Now more prominent */}
			<Box
				sx={{
					position: 'sticky',
					bottom: 0,
					bgcolor: 'background.default',
					pb: 2,
					pt: 1,
				}}
			>
				<PaymentCollectionCard
					totalAmount={total}
					clientEmail={orderDraft.client?.email || ''}
					onPaymentMethodSelect={handlePaymentMethodSelect}
					onPaymentIntentChange={handlePaymentIntentChange}
					onStripePaymentSuccess={handleStripePaymentSuccess}
					{...(orderDraft.paymentIntent && {
						initialPaymentIntent: orderDraft.paymentIntent,
					})}
				/>
			</Box>
		</Box>
	);
}
