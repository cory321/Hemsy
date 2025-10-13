'use client';

import {
	Box,
	Chip,
	Typography,
	IconButton,
	TableRow,
	TableCell,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useRouter } from 'next/navigation';
import type { Order } from '@/types';
import {
	getOrderEffectiveDueDate,
	isOrderOverdue,
} from '@/lib/utils/overdue-logic';
import {
	calculateDaysUntilDue,
	formatDateSafeCustom,
} from '@/lib/utils/date-time-utils';

interface OrderListItemProps {
	order: Order;
	garmentCount: number;
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

	// Use timezone-safe date parsing and calculation
	const daysUntilDue = calculateDaysUntilDue(effectiveDueDate);

	// Check if the order is truly overdue (considering service completion)
	const orderIsOverdue = isOrderOverdue({
		order_due_date: orderDueDate,
		garments: garments.map((g) => ({
			...g,
			garment_services: g.garment_services || [],
		})),
	});

	return {
		date: formatDateSafeCustom(effectiveDueDate, 'MMM d, yyyy'),
		shortDate: formatDateSafeCustom(effectiveDueDate, 'MMM d'),
		daysUntilDue,
		isOverdue: orderIsOverdue,
		isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
		isToday: daysUntilDue === 0,
		isTomorrow: daysUntilDue === 1,
	};
}

export function OrderListItem({ order, garmentCount }: OrderListItemProps) {
	const router = useRouter();

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'new':
				return 'default';
			case 'in_progress':
				return 'info';
			case 'ready_for_pickup':
				return 'warning';
			case 'completed':
				return 'success';
			case 'cancelled':
				return 'error';
			default:
				return 'default';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'new':
				return 'New';
			case 'in_progress':
				return 'In Progress';
			case 'ready_for_pickup':
				return 'Ready For Pickup';
			case 'completed':
				return 'Completed';
			case 'cancelled':
				return 'Cancelled';
			default:
				return status.charAt(0).toUpperCase() + status.slice(1);
		}
	};

	const formatCurrency = (cents: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(cents / 100);
	};

	// Get the effective due date info (from order or garments)
	const garments = (order as any).garments || [];
	const dueDateInfo = getDueDateInfo(order.order_due_date ?? null, garments);

	return (
		<TableRow
			hover
			sx={{ cursor: 'pointer' }}
			onClick={() => router.push(`/orders/${order.id}`)}
		>
			<TableCell>
				<Typography variant="body2" fontWeight="bold">
					#{(order as any).order_number?.slice(-3) || order.id.slice(0, 4)}
				</Typography>
			</TableCell>
			<TableCell>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					<Chip
						label={getStatusLabel(order.status || 'new')}
						color={getStatusColor(order.status || 'new')}
						size="small"
					/>
					{(order as any).is_paid && (
						<Chip
							label="Paid"
							color="success"
							size="small"
							variant="outlined"
						/>
					)}
				</Box>
			</TableCell>
			<TableCell>
				<Typography variant="body2">
					{garmentCount} {garmentCount === 1 ? 'garment' : 'garments'}
				</Typography>
			</TableCell>
			<TableCell>
				<Typography variant="body2">
					{formatCurrency(
						(order as any).total_cents ?? (order as any).total ?? 0
					)}
				</Typography>
			</TableCell>
			<TableCell>
				{dueDateInfo ? (
					<Typography
						variant="body2"
						color={
							dueDateInfo.isOverdue
								? 'error.main'
								: dueDateInfo.isUrgent
									? 'warning.main'
									: 'text.secondary'
						}
						fontWeight={
							dueDateInfo.isUrgent || dueDateInfo.isOverdue ? 'bold' : 'normal'
						}
					>
						{dueDateInfo.shortDate}
					</Typography>
				) : (
					<Typography variant="body2" color="text.secondary">
						—
					</Typography>
				)}
			</TableCell>
			<TableCell align="right">
				<IconButton size="small">
					<ChevronRightIcon />
				</IconButton>
			</TableCell>
		</TableRow>
	);
}
