'use client';

import {
	Box,
	Card,
	CardContent,
	Typography,
	LinearProgress,
	Chip,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import { format, differenceInDays } from 'date-fns';
import {
	safeParseDate,
	calculateDaysUntilDue,
} from '@/lib/utils/date-time-utils';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { getStageColor } from '@/constants/garmentStages';
import {
	getOrderStatusColor,
	getOrderStatusLabel,
} from '@/lib/utils/orderStatus';
import {
	calculatePaymentStatus,
	type PaymentInfo,
} from '@/lib/utils/payment-calculations';
import {
	isOrderOverdue,
	getOrderEffectiveDueDate,
	type OrderOverdueInfo,
} from '@/lib/utils/overdue-logic';
import type { GarmentStage } from '@/types';

interface OrderCardCompactProps {
	order: any;
	onClick: (orderId: string) => void;
}

function formatUSD(cents: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format((cents || 0) / 100);
}

function getPaymentStatusDisplay(paymentStatus: string): {
	label: string;
	color: 'success' | 'warning' | 'error' | 'info';
} {
	switch (paymentStatus) {
		case 'paid':
			return { label: 'PAID IN FULL', color: 'success' };
		case 'partially_paid':
			return { label: 'PARTIAL PAID', color: 'warning' };
		case 'overpaid':
			return { label: 'REFUND DUE', color: 'warning' };
		case 'unpaid':
		default:
			return { label: 'UNPAID', color: 'error' };
	}
}

function getDueDateInfo(orderDueDate: string | null, garments: any[]) {
	// Get effective due date from order or garments
	const effectiveDueDate = getOrderEffectiveDueDate({
		order_due_date: orderDueDate,
		garments: garments.map((g) => ({
			...g,
			garment_services: g.garment_services || [],
		})),
	});

	if (!effectiveDueDate) return null;

	const due = new Date(effectiveDueDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	due.setHours(0, 0, 0, 0);
	const daysUntilDue = differenceInDays(due, today);

	// Check if the order is truly overdue (considering service completion)
	const orderIsOverdue = isOrderOverdue({
		order_due_date: orderDueDate,
		garments: garments.map((g) => ({
			...g,
			garment_services: g.garment_services || [],
		})),
	});

	return {
		date: format(due, 'MMM d, yyyy'),
		shortDate: format(due, 'MMM d'),
		daysUntilDue,
		isOverdue: orderIsOverdue,
		isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
		isToday: daysUntilDue === 0,
		isTomorrow: daysUntilDue === 1,
	};
}

function getEventDateInfo(garments: any[]) {
	// Find the earliest event date from all garments
	const eventDates = garments
		.map((g) => g.event_date)
		.filter((date): date is string => date != null)
		.sort((a, b) => a.localeCompare(b));

	if (eventDates.length === 0) {
		return null;
	}

	const eventDateStr = eventDates[0];
	if (!eventDateStr) return null; // Type guard

	const eventDate = safeParseDate(eventDateStr);
	const daysUntilEvent = calculateDaysUntilDue(eventDateStr);

	return {
		date: format(eventDate, 'MMM d, yyyy'),
		shortDate: format(eventDate, 'MMM d'),
		daysUntilEvent,
		isPast: daysUntilEvent < 0,
		isUrgent: daysUntilEvent >= 0 && daysUntilEvent <= 3,
		isToday: daysUntilEvent === 0,
		isTomorrow: daysUntilEvent === 1,
	};
}

// Calculate overall garment progress based on stages
function calculateGarmentProgress(garments: any[]): number {
	if (!garments.length) return 0;

	const stageWeights: Record<string, number> = {
		New: 0,
		'In Progress': 40,
		'Ready For Pickup': 80,
		Done: 100,
	};

	const totalProgress = garments.reduce((sum, garment) => {
		return sum + (stageWeights[garment.stage] || 0);
	}, 0);

	return totalProgress / garments.length;
}

// Get progress bar color based on completion percentage
function getProgressColor(progress: number): string {
	if (progress >= 80) return 'success.main';
	if (progress >= 40) return 'warning.main';
	return 'info.main';
}

// Get urgency banner text and color
function getUrgencyInfo(dueDateInfo: any, eventDateInfo: any) {
	if (dueDateInfo?.isOverdue) {
		return {
			text: `${Math.abs(dueDateInfo.daysUntilDue)} DAYS OVERDUE`,
			color: 'error.main',
			icon: <ErrorIcon sx={{ fontSize: 16 }} />,
		};
	}
	if (dueDateInfo?.isToday) {
		return {
			text: 'DUE TODAY',
			color: 'warning.main',
			icon: <WarningAmberIcon sx={{ fontSize: 16 }} />,
		};
	}
	if (dueDateInfo?.isTomorrow) {
		return {
			text: 'DUE TOMORROW',
			color: 'warning.main',
			icon: <WarningAmberIcon sx={{ fontSize: 16 }} />,
		};
	}
	if (eventDateInfo?.isToday) {
		return {
			text: 'EVENT TODAY',
			color: 'error.main',
			icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />,
		};
	}
	if (eventDateInfo?.isTomorrow) {
		return {
			text: 'EVENT TOMORROW',
			color: 'warning.main',
			icon: <CalendarTodayIcon sx={{ fontSize: 16 }} />,
		};
	}
	return null;
}

export default function OrderCardCompact({
	order,
	onClick,
}: OrderCardCompactProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	const clientName = order.client
		? `${order.client.first_name} ${order.client.last_name}`
		: 'No Client';
	const clientPhone = order.client?.phone_number;

	// Calculate payment progress using centralized utility
	const totalAmount = order.total_cents || 0;
	const paidAmount = order.paid_amount_cents || 0;

	// Create a simplified payment info for the card (server already calculated net amount)
	const paymentInfo: PaymentInfo[] = [
		{
			id: 'summary',
			amount_cents: paidAmount,
			refunded_amount_cents: 0,
			status: 'completed',
		},
	];

	const paymentCalc = calculatePaymentStatus(totalAmount, paymentInfo);
	const {
		netPaid,
		amountDue,
		percentage: paymentProgress,
		paymentStatus,
	} = paymentCalc;
	const paymentStatusDisplay = getPaymentStatusDisplay(paymentStatus);

	// Calculate garment progress
	const garmentCount = order.garments?.length || 0;
	const garmentProgress = calculateGarmentProgress(order.garments || []);

	// Get due date info
	const dueDateInfo = getDueDateInfo(
		order.order_due_date,
		order.garments || []
	);

	// Get event date info
	const eventDateInfo = getEventDateInfo(order.garments || []);

	// Get urgency info for banner
	const urgencyInfo = getUrgencyInfo(dueDateInfo, eventDateInfo);
	const showUrgentBanner = urgencyInfo !== null;

	// Format client info for display
	const clientDisplayText = clientPhone
		? `${clientName} • ${formatPhoneNumber(clientPhone)}`
		: clientName;

	// Format due date for display
	const dueDateDisplay = dueDateInfo
		? dueDateInfo.shortDate
		: eventDateInfo
			? `Event ${eventDateInfo.shortDate}`
			: 'No date';

	return (
		<Card
			role="button"
			tabIndex={0}
			aria-label={`Order ${order.order_number} for ${clientName}, ${paymentStatusDisplay.label}`}
			sx={{
				cursor: 'pointer',
				transition: 'all 0.2s ease-in-out',
				opacity: order.status === 'cancelled' ? 0.6 : 1,
				filter: order.status === 'cancelled' ? 'grayscale(50%)' : 'none',
				'&:hover': {
					bgcolor: 'action.hover',
					transform: 'translateY(-1px)',
					boxShadow: 2,
				},
				'&:focus': {
					outline: '2px solid',
					outlineColor: 'primary.main',
					outlineOffset: '2px',
				},
				border: 1,
				borderColor: order.status === 'cancelled' ? 'error.main' : 'divider',
				borderStyle: order.status === 'cancelled' ? 'dashed' : 'solid',
				position: 'relative',
			}}
			onClick={() => onClick(order.id)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onClick(order.id);
				}
			}}
		>
			{/* Urgent Banner - Full Width */}
			{showUrgentBanner && urgencyInfo && (
				<Box
					sx={(theme) => ({
						bgcolor: urgencyInfo.color,
						color: 'white',
						py: 0.5,
						px: 2,
						fontSize: theme.typography.caption.fontSize, // 12px
						fontWeight: 'bold',
						textAlign: 'center',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 0.5,
					})}
				>
					{urgencyInfo.icon}
					{urgencyInfo.text}
				</Box>
			)}

			<CardContent sx={{ py: isMobile ? 1.5 : 2 }}>
				{isMobile ? (
					// Mobile Layout - Stacked
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{/* Row 1: Order Number and Status Chips */}
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<Typography variant="subtitle1" fontWeight="bold">
								#{order.order_number || order.id.slice(0, 8)}
							</Typography>
							<Box sx={{ display: 'flex', gap: 0.5 }}>
								<Chip
									label={getOrderStatusLabel(order.status || 'new')}
									color={getOrderStatusColor(order.status || 'new')}
									size="small"
									sx={{ fontWeight: 'bold' }}
								/>
								<Chip
									label={paymentStatusDisplay.label}
									color={paymentStatusDisplay.color}
									size="small"
									sx={{ fontWeight: 'bold' }}
								/>
							</Box>
						</Box>

						{/* Row 2: Client Info */}
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
							<PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
							<Typography variant="body2" fontWeight="medium" noWrap>
								{clientDisplayText}
							</Typography>
						</Box>

						{/* Row 3: Date and Progress */}
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<CalendarTodayIcon
									sx={{ fontSize: 16, color: 'text.secondary' }}
								/>
								<Typography variant="body2" color="text.secondary">
									{dueDateDisplay}
								</Typography>
							</Box>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<CheckroomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
								<Typography variant="body2" fontWeight="medium">
									{garmentCount} items • {Math.round(garmentProgress)}%
								</Typography>
							</Box>
						</Box>

						{/* Row 4: Payment Amount */}
						<Box
							sx={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<Typography variant="body2" fontWeight="bold">
								{formatUSD(netPaid)} / {formatUSD(totalAmount)}
							</Typography>
							{amountDue > 0 && (
								<Typography
									variant="body2"
									color="error.main"
									fontWeight="bold"
								>
									{formatUSD(amountDue)} due
								</Typography>
							)}
						</Box>
					</Box>
				) : (
					// Desktop Layout - Grid
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
						{/* Row 1: Primary Information */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: 'auto 1fr auto auto',
								gap: 2,
								alignItems: 'center',
							}}
						>
							{/* Order Number */}
							<Typography variant="subtitle1" fontWeight="bold">
								#{order.order_number || order.id.slice(0, 8)}
							</Typography>

							{/* Client Info - Condensed */}
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
								<Typography variant="body1" fontWeight="medium" noWrap>
									{clientDisplayText}
								</Typography>
							</Box>

							{/* Order Status */}
							<Chip
								label={getOrderStatusLabel(order.status || 'new')}
								color={getOrderStatusColor(order.status || 'new')}
								sx={{
									fontWeight: 'bold',
									minWidth: 85,
								}}
							/>

							{/* Payment Status - Prominent */}
							<Chip
								label={paymentStatusDisplay.label}
								color={paymentStatusDisplay.color}
								sx={{
									fontWeight: 'bold',
									minWidth: 100,
								}}
							/>
						</Box>

						{/* Row 2: Secondary Information */}
						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: 'auto 1fr auto',
								gap: 2,
								alignItems: 'center',
							}}
						>
							{/* Due Date */}
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
								<CalendarTodayIcon
									sx={{ fontSize: 16, color: 'text.secondary' }}
								/>
								<Typography variant="body2" color="text.secondary">
									{dueDateDisplay}
								</Typography>
							</Box>

							{/* Garment Progress - Unified */}
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: 1,
									justifyContent: 'center',
								}}
							>
								<CheckroomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
								<Typography variant="body2" fontWeight="medium">
									{garmentCount} items • {Math.round(garmentProgress)}% complete
								</Typography>
								<LinearProgress
									variant="determinate"
									value={garmentProgress}
									sx={{
										width: 100,
										height: 6,
										borderRadius: 3,
										bgcolor: 'grey.200',
										'& .MuiLinearProgress-bar': {
											bgcolor: getProgressColor(garmentProgress),
										},
									}}
								/>
							</Box>

							{/* Payment Amount */}
							<Box sx={{ textAlign: 'right' }}>
								<Typography variant="body2" fontWeight="bold">
									{formatUSD(netPaid)} / {formatUSD(totalAmount)}
								</Typography>
								{amountDue > 0 && (
									<Typography
										variant="caption"
										color="error.main"
										fontWeight="bold"
									>
										{formatUSD(amountDue)} due
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
