'use client';

import React, { useState } from 'react';
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	Box,
	Chip,
	Tooltip,
	IconButton,
	Collapse,
	Button,
} from '@mui/material';
import {
	RestoreFromTrash as RestoreIcon,
	Info as InfoIcon,
	ExpandMore as ExpandMoreIcon,
	ChevronRight as ChevronRightIcon,
	OpenInNew as OpenInNewIcon,
	Payment as PaymentIcon,
} from '@mui/icons-material';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import { useRouter } from 'next/navigation';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';
import {
	calculatePaymentStatus,
	type PaymentInfo,
} from '@/lib/utils/payment-calculations';
import { getStageColor } from '@/constants/garmentStages';
import { formatDateSafe } from '@/lib/utils/date-time-utils';
import type { GarmentStage } from '@/types';
import { RemixIcon } from '@/components/dashboard/common';

interface GarmentInfo {
	id: string;
	name: string;
	stage?: string | null;
	due_date?: string | null;
	image_cloud_id?: string | null;
	photo_url?: string | null;
	preset_icon_key?: string | null;
	preset_fill_color?: string | null;
}

interface InvoiceLineItem {
	id: string;
	garment_id: string;
	name: string;
	quantity: number;
	unit_price_cents: number;
	line_total_cents: number;
	description?: string;
	is_removed?: boolean;
	removed_at?: string;
	removal_reason?: string;
}

interface Payment {
	id: string;
	payment_type: string;
	payment_method: string;
	amount_cents: number;
	status: string;
	created_at: string | null;
	processed_at?: string | null;
}

interface EnhancedInvoiceLineItemsProps {
	items: InvoiceLineItem[];
	garments: GarmentInfo[];
	showRemoved?: boolean;
	// When false, hides UI indicators/sections for removed services on screen
	showRemovedIndicators?: boolean;
	onRestoreItem?: (itemId: string, garmentId: string) => void;
	readonly?: boolean;
	orderId?: string | undefined; // Optional order ID for navigation context
	payments?: Payment[] | undefined; // Optional payments array for calculating amount due
	orderStatus?: string | null | undefined; // Optional order status
	paidAt?: string | null | undefined; // Optional paid date
	onRecordPayment?: (() => void) | undefined; // Optional callback to trigger payment recording
	orderSubtotal?: number | undefined; // Optional subtotal for full pricing breakdown
	discountCents?: number | undefined; // Optional discount amount
	taxCents?: number | undefined; // Optional tax amount
}

export default function EnhancedInvoiceLineItems({
	items,
	garments,
	showRemoved = true,
	showRemovedIndicators = true,
	onRestoreItem,
	readonly = false,
	orderId,
	payments = [],
	orderStatus,
	paidAt,
	onRecordPayment,
	orderSubtotal,
	discountCents,
	taxCents,
}: EnhancedInvoiceLineItemsProps) {
	const router = useRouter();
	const [expandedGarments, setExpandedGarments] = useState<Set<string>>(
		new Set(garments.map((g) => g.id)) // All expanded by default
	);
	const [hoveredGarment, setHoveredGarment] = useState<string | null>(null);

	// Group services by garment
	const servicesByGarment = items.reduce(
		(acc, item) => {
			if (!acc[item.garment_id]) {
				acc[item.garment_id] = [];
			}
			acc[item.garment_id]!.push(item);
			return acc;
		},
		{} as Record<string, InvoiceLineItem[]>
	);

	// Get garment info
	const getGarmentInfo = (garmentId: string): GarmentInfo | undefined => {
		return garments.find((g) => g.id === garmentId);
	};

	// Calculate totals for a garment
	const getGarmentTotals = (garmentId: string) => {
		const garmentServices = servicesByGarment[garmentId] || [];
		const activeServices = garmentServices.filter((s) => !s.is_removed);
		const removedServices = garmentServices.filter((s) => s.is_removed);

		return {
			activeTotal: activeServices.reduce(
				(sum, item) => sum + item.line_total_cents,
				0
			),
			removedTotal: removedServices.reduce(
				(sum, item) => sum + item.line_total_cents,
				0
			),
			activeCount: activeServices.length,
			removedCount: removedServices.length,
		};
	};

	// Calculate overall totals
	const overallTotals = Object.keys(servicesByGarment).reduce(
		(acc, garmentId) => {
			const totals = getGarmentTotals(garmentId);
			acc.activeTotal += totals.activeTotal;
			acc.removedTotal += totals.removedTotal;
			acc.activeCount += totals.activeCount;
			acc.removedCount += totals.removedCount;
			return acc;
		},
		{ activeTotal: 0, removedTotal: 0, activeCount: 0, removedCount: 0 }
	);

	// Calculate final total after discount and tax
	const finalTotal =
		overallTotals.activeTotal - (discountCents || 0) + (taxCents || 0);

	// Calculate payment totals and amount due using shared utility
	const paymentCalc = calculatePaymentStatus(
		finalTotal,
		(payments?.map((p) => ({
			...p,
			refunded_amount_cents: (p as any).refunded_amount_cents || 0,
		})) as PaymentInfo[]) || []
	);

	const {
		totalPaid,
		totalRefunded,
		netPaid,
		amountDue,
		percentage: paymentProgress,
		paymentStatus,
	} = paymentCalc;

	const toggleGarment = (garmentId: string) => {
		setExpandedGarments((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(garmentId)) {
				newSet.delete(garmentId);
			} else {
				newSet.add(garmentId);
			}
			return newSet;
		});
	};

	const renderGarmentImage = (garment: GarmentInfo) => {
		const imageCloudId = garment.image_cloud_id;
		const photoUrl = garment.photo_url;
		const key = garment.preset_icon_key;
		const fillColor = garment.preset_fill_color;

		// Check for Cloudinary image first
		if (imageCloudId) {
			return (
				<img
					src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,h_40,w_40/${imageCloudId}`}
					alt={garment.name}
					style={{
						width: 40,
						height: 40,
						objectFit: 'cover',
						borderRadius: '4px',
					}}
				/>
			);
		}

		// Then check for photo URL
		if (photoUrl) {
			return (
				<img
					src={photoUrl}
					alt={garment.name}
					style={{
						width: 40,
						height: 40,
						objectFit: 'cover',
						borderRadius: '4px',
					}}
				/>
			);
		}

		// Finally fall back to preset icon
		const url = key ? getPresetIconUrl(key) : null;
		return (
			<span
				style={{
					width: 40,
					height: 40,
					display: 'inline-block',
				}}
			>
				<InlinePresetSvg
					src={url || '/presets/garments/select-garment.svg'}
					{...(fillColor ? { fillColor: fillColor } : {})}
				/>
			</span>
		);
	};

	const renderServiceRow = (item: InvoiceLineItem, isRemoved = false) => (
		<TableRow
			key={item.id}
			sx={{
				opacity: isRemoved ? 0.6 : 1,
				backgroundColor: 'inherit',
			}}
		>
			<TableCell sx={{ pl: 6 }}>
				<Box display="flex" alignItems="center" gap={1}>
					<Typography
						variant="body2"
						sx={{
							textDecoration: isRemoved ? 'line-through' : 'none',
							color: isRemoved ? 'text.secondary' : 'text.primary',
						}}
					>
						{item.name}
					</Typography>
					{isRemoved && showRemovedIndicators && (
						<Chip
							label="Removed"
							size="small"
							color="default"
							variant="outlined"
						/>
					)}
				</Box>
				{item.description && (
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							textDecoration: isRemoved ? 'line-through' : 'none',
							display: 'block',
							mt: 0.5,
						}}
					>
						{item.description}
					</Typography>
				)}
			</TableCell>

			<TableCell align="right">
				<Typography
					variant="body2"
					sx={{
						textDecoration: isRemoved ? 'line-through' : 'none',
						color: isRemoved ? 'text.secondary' : 'text.primary',
					}}
				>
					{item.quantity}
				</Typography>
			</TableCell>

			<TableCell align="right">
				<Typography
					variant="body2"
					sx={{
						textDecoration: isRemoved ? 'line-through' : 'none',
						color: isRemoved ? 'text.secondary' : 'text.primary',
					}}
				>
					{formatCentsAsCurrency(item.unit_price_cents)}
				</Typography>
			</TableCell>

			<TableCell align="right">
				<Box
					display="flex"
					alignItems="center"
					justifyContent="flex-end"
					gap={1}
				>
					<Typography
						variant="body2"
						sx={{
							textDecoration: isRemoved ? 'line-through' : 'none',
							color: isRemoved ? 'text.secondary' : 'text.primary',
							fontWeight: isRemoved ? 'normal' : 'medium',
						}}
					>
						{formatCentsAsCurrency(item.line_total_cents)}
					</Typography>

					{isRemoved && (
						<>
							{item.removal_reason && (
								<Tooltip title={`Removed: ${item.removal_reason}`}>
									<InfoIcon fontSize="small" color="action" />
								</Tooltip>
							)}

							{!readonly && onRestoreItem && (
								<Tooltip title="Restore this service">
									<IconButton
										size="small"
										onClick={() => onRestoreItem(item.id, item.garment_id)}
										color="primary"
									>
										<RestoreIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</>
					)}
				</Box>
			</TableCell>
		</TableRow>
	);

	const renderGarmentSection = (garmentId: string, isLast: boolean) => {
		const garment = getGarmentInfo(garmentId);
		const services = servicesByGarment[garmentId] || [];
		const activeServices = services.filter((s) => !s.is_removed);
		const removedServices = services.filter((s) => s.is_removed);
		const totals = getGarmentTotals(garmentId);
		const isExpanded = expandedGarments.has(garmentId);
		const isHovered = hoveredGarment === garmentId;

		if (!garment) return null;

		const handleGarmentClick = (e: React.MouseEvent) => {
			e.stopPropagation();
			// Include order context in navigation if available
			const url = orderId
				? `/garments/${garmentId}?from=order&orderId=${orderId}`
				: `/garments/${garmentId}`;
			router.push(url);
		};

		return (
			<React.Fragment key={garmentId}>
				{/* Garment Header Row */}
				<TableRow
					sx={{
						backgroundColor: 'inherit',
						'&:hover': {
							backgroundColor: 'action.selected',
						},
					}}
					onMouseEnter={() => setHoveredGarment(garmentId)}
					onMouseLeave={() => setHoveredGarment(null)}
				>
					<TableCell colSpan={4}>
						<Box display="flex" alignItems="center" gap={2}>
							{/* Expand/Collapse Button */}
							<Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										toggleGarment(garmentId);
									}}
									sx={{
										p: 0.5,
										'&:hover': {
											backgroundColor: 'action.hover',
										},
									}}
								>
									{isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
								</IconButton>
							</Tooltip>

							{/* Clickable Garment Area */}
							<Box
								display="flex"
								alignItems="center"
								gap={2}
								flex={1}
								onClick={handleGarmentClick}
								sx={{
									cursor: 'pointer',
									borderRadius: 1,
									p: 0.5,
									transition: 'all 0.2s ease',
									'&:hover': {
										backgroundColor: 'rgba(0, 0, 0, 0.02)',
										transform: 'translateX(2px)',
									},
								}}
							>
								{/* Garment Image */}
								<Box
									sx={{
										position: 'relative',
										flexShrink: 0,
										'&::after': isHovered
											? {
													content: '""',
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													backgroundColor: 'rgba(0, 0, 0, 0.05)',
													borderRadius: '4px',
													pointerEvents: 'none',
												}
											: {},
									}}
								>
									{renderGarmentImage(garment)}
								</Box>

								{/* Garment Name */}
								<Typography
									variant="subtitle1"
									fontWeight="medium"
									sx={{
										textDecoration: isHovered ? 'underline' : 'none',
										textDecorationColor: 'primary.main',
										textUnderlineOffset: 2,
										flexShrink: 0,
									}}
								>
									{garment.name}
								</Typography>

								{isHovered && (
									<OpenInNewIcon
										fontSize="small"
										color="primary"
										sx={{
											opacity: 0.7,
											flexShrink: 0,
											animation: 'fadeIn 0.2s ease',
											'@keyframes fadeIn': {
												from: { opacity: 0 },
												to: { opacity: 0.7 },
											},
										}}
									/>
								)}

								{/* Due Date */}
								{garment.due_date && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ flexShrink: 0 }}
									>
										Due: {formatDateSafe(garment.due_date)}
									</Typography>
								)}

								{/* Spacer to push remaining items to the right */}
								<Box flex={1} />

								{/* Service Count */}
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ flexShrink: 0 }}
								>
									{totals.activeCount} service
									{totals.activeCount !== 1 ? 's' : ''}
									{totals.removedCount > 0 &&
										` (${totals.removedCount} removed)`}
								</Typography>
							</Box>

							{/* Stage Box - Far right, outside clickable area */}
							{garment.stage && (
								<Box
									sx={{
										px: 2,
										py: 0.75,
										borderRadius: 1,
										backgroundColor: getStageColor(
											garment.stage as GarmentStage
										),
										flexShrink: 0,
										minWidth: 120,
										textAlign: 'center',
									}}
								>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 600,
											color: 'white',
											textShadow: '0 1px 2px rgba(0,0,0,0.1)',
										}}
									>
										{garment.stage}
									</Typography>
								</Box>
							)}
						</Box>
					</TableCell>
				</TableRow>

				{/* Services for this garment (collapsible) */}
				{isExpanded && (
					<>
						{/* Column Headers for this garment */}
						<TableRow>
							<TableCell sx={{ pl: 6, py: 1 }}>
								<Typography
									variant="caption"
									fontWeight="medium"
									color="text.secondary"
								>
									Service
								</Typography>
							</TableCell>
							<TableCell align="right" sx={{ py: 1 }}>
								<Typography
									variant="caption"
									fontWeight="medium"
									color="text.secondary"
								>
									Qty
								</Typography>
							</TableCell>
							<TableCell align="right" sx={{ py: 1 }}>
								<Typography
									variant="caption"
									fontWeight="medium"
									color="text.secondary"
								>
									Unit Price
								</Typography>
							</TableCell>
							<TableCell align="right" sx={{ py: 1 }}>
								<Typography
									variant="caption"
									fontWeight="medium"
									color="text.secondary"
								>
									Total
								</Typography>
							</TableCell>
						</TableRow>

						{/* Active Services */}
						{activeServices.map((item) => renderServiceRow(item, false))}

						{/* Removed Services */}
						{showRemoved &&
							removedServices.length > 0 &&
							showRemovedIndicators && (
								<>
									<TableRow>
										<TableCell colSpan={4} sx={{ py: 0.5, pl: 6 }}>
											<Typography variant="caption" color="text.secondary">
												Removed services (not charged):
											</Typography>
										</TableCell>
									</TableRow>
									{removedServices.map((item) => renderServiceRow(item, true))}
								</>
							)}
						{/* When indicators are hidden, still render removed items without header */}
						{showRemoved &&
							removedServices.length > 0 &&
							!showRemovedIndicators && (
								<>
									{removedServices.map((item) => renderServiceRow(item, true))}
								</>
							)}

						{/* Garment subtotal */}
						<TableRow>
							<TableCell colSpan={3} sx={{ pl: 6, borderBottom: 'none' }}>
								<Typography variant="body2" fontWeight="medium">
									Subtotal for {garment.name}
								</Typography>
							</TableCell>
							<TableCell align="right" sx={{ borderBottom: 'none' }}>
								<Typography variant="body2" fontWeight="bold">
									{formatCentsAsCurrency(totals.activeTotal)}
								</Typography>
							</TableCell>
						</TableRow>
					</>
				)}

				{/* Add spacing between garment sections (except for last) */}
				{!isLast && (
					<TableRow>
						<TableCell
							colSpan={4}
							sx={{ py: 1, borderBottom: '2px solid', borderColor: 'divider' }}
						/>
					</TableRow>
				)}
			</React.Fragment>
		);
	};

	return (
		<TableContainer>
			<Table size="small">
				<TableBody>
					{/* Render each garment section */}
					{Object.keys(servicesByGarment).map((garmentId, index, array) =>
						renderGarmentSection(garmentId, index === array.length - 1)
					)}

					{/* Overall Totals Section */}
					<TableRow sx={{ backgroundColor: 'inherit' }}>
						<TableCell colSpan={3}>
							<Typography variant="subtitle1" fontWeight="medium">
								Order Subtotal
							</Typography>
						</TableCell>
						<TableCell align="right">
							<Typography variant="subtitle1" fontWeight="bold">
								{formatCentsAsCurrency(overallTotals.activeTotal)}
							</Typography>
						</TableCell>
					</TableRow>

					{/* Show detailed pricing breakdown if discount or tax are provided */}
					{(discountCents && discountCents > 0) ||
					(taxCents && taxCents > 0) ? (
						<>
							{/* Discount */}
							{discountCents !== undefined && discountCents > 0 && (
								<TableRow>
									<TableCell colSpan={3} sx={{ borderBottom: 'none' }}>
										<Typography variant="body2" color="success.main">
											Discount
										</Typography>
									</TableCell>
									<TableCell align="right" sx={{ borderBottom: 'none' }}>
										<Typography variant="body2" color="success.main">
											-{formatCentsAsCurrency(discountCents!)}
										</Typography>
									</TableCell>
								</TableRow>
							)}

							{/* Tax */}
							{taxCents !== undefined && taxCents > 0 && (
								<TableRow>
									<TableCell colSpan={3} sx={{ borderBottom: 'none' }}>
										<Box
											sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
										>
											<Typography variant="body2">Sales Tax</Typography>
											<Tooltip
												title="Tax calculated at merchant's configured rate. Merchant is responsible for tax compliance and remittance to appropriate tax authorities."
												arrow
												placement="top"
											>
												<InfoIcon
													sx={{
														fontSize: 16,
														color: 'text.secondary',
														cursor: 'help',
													}}
												/>
											</Tooltip>
										</Box>
									</TableCell>
									<TableCell align="right" sx={{ borderBottom: 'none' }}>
										<Typography variant="body2">
											{formatCentsAsCurrency(taxCents!)}
										</Typography>
									</TableCell>
								</TableRow>
							)}

							{/* Final Total */}
							<TableRow>
								<TableCell colSpan={3} sx={{ borderBottom: 'none' }}>
									<Typography variant="subtitle1" fontWeight="bold">
										Total
									</Typography>
								</TableCell>
								<TableCell align="right" sx={{ borderBottom: 'none' }}>
									<Typography variant="subtitle1" fontWeight="bold">
										{formatCentsAsCurrency(
											overallTotals.activeTotal -
												(discountCents || 0) +
												(taxCents || 0)
										)}
									</Typography>
								</TableCell>
							</TableRow>
						</>
					) : null}

					{overallTotals.removedCount > 0 &&
						showRemoved &&
						showRemovedIndicators && (
							<TableRow>
								<TableCell colSpan={3}>
									<Typography variant="caption" color="text.secondary">
										Removed services (not charged):
									</Typography>
								</TableCell>
								<TableCell align="right">
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ textDecoration: 'line-through' }}
									>
										{formatCentsAsCurrency(overallTotals.removedTotal)}
									</Typography>
								</TableCell>
							</TableRow>
						)}

					{/* Payment Information Section - Only show if payments are provided */}
					{payments && payments.length > 0 && totalPaid > 0 && (
						<TableRow>
							<TableCell colSpan={3}>
								<Typography
									variant="subtitle1"
									fontWeight="medium"
									color="success.main"
								>
									Payments Received
								</Typography>
								{paymentProgress > 0 && (
									<Typography variant="body2" color="text.secondary">
										{Math.round(paymentProgress)}% of total
									</Typography>
								)}
							</TableCell>
							<TableCell align="right">
								<Box>
									<Typography
										variant="subtitle1"
										fontWeight="bold"
										color="success.main"
									>
										{formatCentsAsCurrency(netPaid)}
									</Typography>
									{totalRefunded > 0 && (
										<Typography variant="caption" color="text.secondary">
											({formatCentsAsCurrency(totalPaid)} paid -{' '}
											{formatCentsAsCurrency(totalRefunded)} refunded)
										</Typography>
									)}
								</Box>
							</TableCell>
						</TableRow>
					)}

					{/* Total Amount Due with Payment Status */}
					<TableRow>
						<TableCell colSpan={4} sx={{ borderBottom: 'none', p: 0 }}>
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 2,
									px: 2,
									py: 1.5,
									mt: 0.5,
									borderRadius: '8px',
									backgroundColor:
										paymentStatus === 'paid'
											? 'success.main'
											: paymentStatus === 'overpaid'
												? '#FFF7E9'
												: 'primary.main',
								}}
							>
								<Box>
									<Typography
										variant="h6"
										sx={{
											color:
												paymentStatus === 'paid'
													? 'white'
													: paymentStatus === 'overpaid'
														? 'text.primary'
														: 'primary.contrastText',
										}}
									>
										{paymentStatus === 'overpaid'
											? 'Credit Balance'
											: 'Total Amount Due'}
									</Typography>
									{paymentStatus === 'paid' && (
										<Typography
											variant="body2"
											sx={{ color: 'white', opacity: 0.9 }}
										>
											Order fully paid
										</Typography>
									)}
									{paymentStatus === 'overpaid' && (
										<Typography
											variant="body2"
											sx={{ color: 'text.primary', opacity: 1 }}
										>
											Customer has a credit of{' '}
											{formatCentsAsCurrency(Math.abs(amountDue))}
										</Typography>
									)}
									{paymentStatus === 'partial' &&
										payments &&
										payments.length > 0 && (
											<Typography
												variant="body2"
												sx={{ color: 'white', opacity: 0.9 }}
											>
												{formatCentsAsCurrency(netPaid)} paid of{' '}
												{formatCentsAsCurrency(finalTotal)}
												{totalRefunded > 0 &&
													` (${formatCentsAsCurrency(totalRefunded)} refunded)`}
											</Typography>
										)}
								</Box>

								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Typography
										variant="h6"
										fontWeight="bold"
										sx={{
											color:
												paymentStatus === 'paid'
													? 'white'
													: paymentStatus === 'overpaid'
														? 'text.primary'
														: 'primary.contrastText',
										}}
									>
										{paymentStatus === 'overpaid'
											? formatCentsAsCurrency(Math.abs(amountDue))
											: formatCentsAsCurrency(Math.max(0, amountDue))}
									</Typography>
									{paymentStatus !== 'paid' &&
										paymentStatus !== 'overpaid' &&
										overallTotals.activeTotal > 0 &&
										onRecordPayment && (
											<Button
												variant="contained"
												size="medium"
												startIcon={<PaymentIcon />}
												onClick={onRecordPayment}
												sx={{
													backgroundColor: 'white',
													color: 'primary.main',
													fontWeight: 'medium',
													whiteSpace: 'nowrap',
													minWidth: 'auto',
													'&:hover': {
														backgroundColor: 'rgba(255, 255, 255, 0.9)',
													},
												}}
											>
												Collect Payment
											</Button>
										)}
								</Box>
							</Box>
						</TableCell>
					</TableRow>

					{/* Payment Status Messages */}
					{paymentStatus === 'paid' && (
						<TableRow>
							<TableCell
								colSpan={4}
								sx={{
									textAlign: 'center',
									py: 2,
								}}
							>
								<Typography
									variant="body2"
									color="success.dark"
									fontWeight="medium"
								>
									✓ This order has been fully paid
									{paidAt && (
										<Typography component="span" variant="body2" sx={{ ml: 1 }}>
											on {formatDateSafe(paidAt)}
										</Typography>
									)}
								</Typography>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
