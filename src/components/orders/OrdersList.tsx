'use client';

import { useState, useEffect, useRef } from 'react';
import {
	Box,
	TextField,
	InputAdornment,
	Card,
	CardContent,
	Stack,
	Typography,
	TablePagination,
	Paper,
	IconButton,
	Skeleton,
	Alert,
	Chip,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	CircularProgress,
	Backdrop,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	LinearProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import type { PaginatedOrders, OrdersFilters } from '@/lib/actions/orders';
import type { Database } from '@/types/supabase';
import {
	getOrderStatusColor,
	getOrderStatusLabel,
} from '@/lib/utils/orderStatus';
import {
	calculatePaymentStatus,
	calculateActiveTotal,
	type PaymentInfo,
} from '@/lib/utils/payment-calculations';
import {
	isOrderOverdue,
	getOrderEffectiveDueDate,
	type OrderOverdueInfo,
} from '@/lib/utils/overdue-logic';
import {
	safeParseDate,
	calculateDaysUntilDue,
	formatDateSafeCustom,
} from '@/lib/utils/date-time-utils';

interface OrdersListProps {
	initialData: PaginatedOrders;
	getOrdersAction: (
		page: number,
		pageSize: number,
		filters?: OrdersFilters
	) => Promise<PaginatedOrders>;
}

function formatUSD(cents: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format((cents || 0) / 100);
}

function getPaymentStatusChip(paymentStatus: string): {
	label: string;
	color: 'success' | 'warning' | 'error' | 'default';
} {
	switch (paymentStatus) {
		case 'paid':
			return { label: '✓ PAID', color: 'success' };
		case 'partial':
			return { label: '◉ PARTIAL', color: 'warning' };
		case 'overpaid':
			return { label: '⚠ OVERPAID', color: 'warning' };
		case 'unpaid':
		default:
			return { label: '○ UNPAID', color: 'error' };
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
		date: formatDateSafeCustom(effectiveDueDate, 'MMM d'),
		fullDate: formatDateSafeCustom(effectiveDueDate, 'MMM d, yyyy'),
		daysUntilDue,
		isOverdue: orderIsOverdue,
		isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
		isToday: daysUntilDue === 0,
		isTomorrow: daysUntilDue === 1,
	};
}

function getEarliestEventDate(garments: any[]) {
	const eventDates = garments
		.map((g) => g.event_date)
		.filter((date): date is string => date != null)
		.sort((a, b) => a.localeCompare(b));

	if (eventDates.length === 0) return null;

	const eventDateStr = eventDates[0];
	if (!eventDateStr) return null; // Type guard

	const eventDate = safeParseDate(eventDateStr);
	const daysUntil = calculateDaysUntilDue(eventDateStr);

	return {
		date: formatDateSafeCustom(eventDateStr, 'MMM d'),
		daysUntil,
		isToday: daysUntil === 0,
		isTomorrow: daysUntil === 1,
		isUrgent: daysUntil >= 0 && daysUntil <= 3,
	};
}

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

interface OrderTableRowProps {
	order: any;
	onClick: (orderId: string) => void;
}

function OrderTableRow({ order, onClick }: OrderTableRowProps) {
	const clientName = order.client
		? `${order.client.first_name} ${order.client.last_name}`
		: 'No Client';

	// Calculate payment progress using centralized utility
	// Use active total that accounts for soft-deleted services
	const totalAmount = order.active_total_cents || calculateActiveTotal(order);
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
	const { netPaid, percentage: paymentProgress, paymentStatus } = paymentCalc;
	const paymentStatusChip = getPaymentStatusChip(paymentStatus);

	// Get garment status using the correct stages
	const garmentCount = order.garments?.length || 0;
	const readyCount =
		order.garments?.filter((g: any) => g.stage === 'Ready For Pickup').length ||
		0;
	const inProgressCount =
		order.garments?.filter((g: any) => g.stage === 'In Progress').length || 0;

	// Get due date info
	const dueDateInfo = getDueDateInfo(
		order.order_due_date,
		order.garments || []
	);

	// Get event date info
	const eventDateInfo = getEarliestEventDate(order.garments || []);

	return (
		<TableRow
			hover
			sx={{
				cursor: 'pointer',
				opacity: order.status === 'cancelled' ? 0.6 : 1,
				filter: order.status === 'cancelled' ? 'grayscale(50%)' : 'none',
				'&:hover': {
					bgcolor: 'action.hover',
				},
			}}
			onClick={() => onClick(order.id)}
		>
			{/* Order Number */}
			<TableCell>
				<Typography variant="body2" fontWeight="bold">
					#{order.order_number?.slice(-3) || order.id.slice(0, 4)}
				</Typography>
			</TableCell>

			{/* Client & Garments */}
			<TableCell>
				<Typography variant="body2" noWrap fontWeight="medium">
					{clientName}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{garmentCount} garment{garmentCount !== 1 ? 's' : ''}
					{readyCount > 0 && ` (${readyCount} ready)`}
				</Typography>
			</TableCell>

			{/* Due Date with urgency (or Event Date if more urgent) */}
			<TableCell align="center">
				{(() => {
					// Show event date if it's more urgent than due date or if there's no due date
					const showEventInstead =
						eventDateInfo &&
						(!dueDateInfo ||
							((eventDateInfo.isToday || eventDateInfo.isTomorrow) &&
								!(dueDateInfo.isOverdue || dueDateInfo.isToday)));

					if (showEventInstead && eventDateInfo) {
						return (
							<Box>
								<Typography
									variant="body2"
									color={
										eventDateInfo.isToday
											? 'error.main'
											: eventDateInfo.isTomorrow
												? 'warning.main'
												: eventDateInfo.isUrgent
													? 'warning.main'
													: 'text.primary'
									}
									fontWeight={
										eventDateInfo.isToday || eventDateInfo.isTomorrow
											? 'bold'
											: 'normal'
									}
								>
									EVENT
								</Typography>
								<Typography
									variant="caption"
									color={
										eventDateInfo.isToday
											? 'error.main'
											: eventDateInfo.isTomorrow
												? 'warning.main'
												: 'text.secondary'
									}
								>
									{eventDateInfo.isToday
										? 'Event today'
										: eventDateInfo.isTomorrow
											? 'Event tomorrow'
											: eventDateInfo.daysUntil >= 0
												? `Event in ${eventDateInfo.daysUntil} day${eventDateInfo.daysUntil === 1 ? '' : 's'}`
												: `Event ${Math.abs(eventDateInfo.daysUntil)} day${Math.abs(eventDateInfo.daysUntil) === 1 ? '' : 's'} ago`}
								</Typography>
							</Box>
						);
					} else if (dueDateInfo) {
						return (
							<Box>
								<Typography
									variant="body2"
									color={
										dueDateInfo.isOverdue
											? 'error.main'
											: dueDateInfo.isUrgent
												? 'warning.main'
												: 'text.primary'
									}
									fontWeight={
										dueDateInfo.isUrgent || dueDateInfo.isOverdue
											? 'bold'
											: 'normal'
									}
								>
									{dueDateInfo.date}
								</Typography>
								<Typography
									variant="caption"
									color={
										dueDateInfo.isOverdue
											? 'error.main'
											: dueDateInfo.isUrgent
												? 'warning.main'
												: 'text.secondary'
									}
								>
									{dueDateInfo.daysUntilDue < 0
										? `Overdue by ${Math.abs(dueDateInfo.daysUntilDue)} day${Math.abs(dueDateInfo.daysUntilDue) === 1 ? '' : 's'}`
										: dueDateInfo.isToday
											? 'Due today'
											: dueDateInfo.isTomorrow
												? 'Due tomorrow'
												: `Due in ${dueDateInfo.daysUntilDue} day${dueDateInfo.daysUntilDue === 1 ? '' : 's'}`}
								</Typography>
							</Box>
						);
					} else {
						return (
							<Typography variant="body2" color="text.secondary">
								No due date
							</Typography>
						);
					}
				})()}
			</TableCell>

			{/* Payment Progress */}
			<TableCell align="right">
				<Typography variant="body2">
					{formatUSD(netPaid)}/{formatUSD(totalAmount)}
				</Typography>
				<Box
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.5,
						mt: 0.5,
						justifyContent: 'flex-end',
					}}
				>
					<LinearProgress
						variant="determinate"
						value={Math.min(paymentProgress, 100)}
						sx={{
							width: 100,
							height: 4,
							borderRadius: 2,
							bgcolor: 'grey.200',
							'& .MuiLinearProgress-bar': {
								bgcolor:
									paymentProgress >= 100
										? 'success.main'
										: paymentProgress > 0
											? 'warning.main'
											: 'grey.400',
							},
						}}
					/>
				</Box>
			</TableCell>

			{/* Payment Status */}
			<TableCell align="center">
				<Chip
					label={paymentStatusChip.label}
					color={paymentStatusChip.color}
					size="small"
					sx={{
						height: 22,
						width: 110,
						justifyContent: 'center',
						fontSize: '0.7rem',
						fontWeight: 'bold',
						'& .MuiChip-label': {
							px: 1,
							width: '100%',
							textAlign: 'center',
						},
					}}
				/>
			</TableCell>

			{/* Order Status */}
			<TableCell align="center">
				<Chip
					label={getOrderStatusLabel(order.status || 'new')}
					size="small"
					sx={{
						height: 22,
						width: 110,
						justifyContent: 'center',
						fontSize: '0.7rem',
						fontWeight: 'bold',
						backgroundColor: (() => {
							const status = order.status || 'new';
							switch (status) {
								case 'new':
									return '#A3B5AA';
								case 'in_progress':
									return '#F3C165';
								case 'ready_for_pickup':
									return '#BD8699';
								case 'completed':
									return '#aa90c0';
								default:
									return '#F8F8F5';
							}
						})(),
						color: (() => {
							const status = order.status || 'new';
							switch (status) {
								case 'new':
									return '#000000';
								case 'in_progress':
									return '#000000';
								case 'ready_for_pickup':
									return '#ffffff';
								case 'completed':
									return '#ffffff';
								default:
									return '#000000';
							}
						})(),
						'& .MuiChip-label': {
							px: 1,
							width: '100%',
							textAlign: 'center',
						},
					}}
				/>
			</TableCell>

			{/* Action */}
			<TableCell align="center">
				<IconButton size="small">
					<ChevronRightIcon />
				</IconButton>
			</TableCell>
		</TableRow>
	);
}

export default function OrdersList({
	initialData,
	getOrdersAction,
}: OrdersListProps) {
	const router = useRouter();
	const [data, setData] = useState<PaginatedOrders>(initialData);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState<
		Database['public']['Enums']['order_status'] | 'active' | 'all'
	>('active');
	const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
	const [page, setPage] = useState(initialData.page - 1);
	const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	const [isFiltering, setIsFiltering] = useState(false);

	const debouncedSearch = useDebounce(search, 300);
	const getOrdersActionRef = useRef(getOrdersAction);

	useEffect(() => {
		getOrdersActionRef.current = getOrdersAction;
	}, [getOrdersAction]);

	useEffect(() => {
		// Skip the initial load since we already have data
		if (isInitialLoad) {
			setIsInitialLoad(false);
			return;
		}

		const fetchData = async () => {
			// Use isFiltering for search/status changes, loading for pagination
			const isSearchOrStatusChange =
				debouncedSearch !== '' ||
				statusFilter !== 'active' ||
				paymentStatusFilter !== 'all';
			if (isSearchOrStatusChange) {
				setIsFiltering(true);
			} else {
				setLoading(true);
			}
			setError(null);
			try {
				const status = statusFilter === 'active' ? undefined : statusFilter;
				const paymentStatus =
					paymentStatusFilter === 'all' ? undefined : paymentStatusFilter;

				// Handle cancelled order filtering
				const onlyCancelled = statusFilter === 'cancelled';
				const includeCancelled = statusFilter === 'cancelled';

				// Handle active orders filtering (exclude completed and cancelled)
				const onlyActive = statusFilter === 'active';

				const filters: OrdersFilters = {
					search: debouncedSearch,
					...(status && status !== 'cancelled' && { status }),
					...(paymentStatus && { paymentStatus }),
					sortBy: 'created_at',
					sortOrder: 'desc',
					includeCancelled,
					onlyCancelled,
					onlyActive,
				};
				const result = await getOrdersActionRef.current(
					page + 1,
					rowsPerPage,
					filters
				);
				setData(result);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to fetch orders');
			} finally {
				setLoading(false);
				setIsFiltering(false);
			}
		};

		fetchData();
	}, [
		page,
		rowsPerPage,
		debouncedSearch,
		statusFilter,
		paymentStatusFilter,
		isInitialLoad,
	]);

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleCardClick = (orderId: string) => {
		router.push(`/orders/${orderId}`);
	};

	// The paid amount is now calculated on the server from actual invoice payments
	// No need to estimate here anymore
	const ordersWithPaymentInfo = data.data;

	return (
		<Box data-testid="orders-list">
			{/* Filters */}
			<Stack spacing={2} sx={{ mb: 3 }}>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search by order number or notes..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
				/>
				<Box sx={{ display: 'flex', gap: 2 }}>
					<FormControl size="small" sx={{ minWidth: 200 }}>
						<InputLabel>Order Status</InputLabel>
						<Select
							value={statusFilter}
							label="Order Status"
							onChange={(e) =>
								setStatusFilter(
									e.target.value as
										| Database['public']['Enums']['order_status']
										| 'active'
								)
							}
							MenuProps={{
								disableScrollLock: true,
							}}
						>
							<MenuItem value="active">All Active Orders</MenuItem>
							<MenuItem value="new">New</MenuItem>
							<MenuItem value="in_progress">In Progress</MenuItem>
							<MenuItem value="ready_for_pickup">Ready For Pickup</MenuItem>
							<MenuItem value="completed">Completed</MenuItem>
							<MenuItem value="cancelled">Cancelled</MenuItem>
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 200 }}>
						<InputLabel>Payment Status</InputLabel>
						<Select
							value={paymentStatusFilter}
							label="Payment Status"
							onChange={(e) => setPaymentStatusFilter(e.target.value)}
							MenuProps={{
								disableScrollLock: true,
							}}
						>
							<MenuItem value="all">All Payment Statuses</MenuItem>
							<MenuItem value="unpaid">Unpaid</MenuItem>
							<MenuItem value="partial">Partially Paid</MenuItem>
							<MenuItem value="paid">Paid</MenuItem>
							<MenuItem value="overpaid">Overpaid</MenuItem>
						</Select>
					</FormControl>
				</Box>
			</Stack>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Orders List */}
			<Box sx={{ position: 'relative' }}>
				{/* Subtle loading overlay for filtering */}
				{isFiltering && (
					<Backdrop
						open={isFiltering}
						sx={{
							position: 'absolute',
							zIndex: 1,
							backgroundColor: 'rgba(255, 255, 255, 0.7)',
							borderRadius: 1,
						}}
					>
						<CircularProgress size={40} />
					</Backdrop>
				)}

				{loading ? (
					// Loading skeletons for table
					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Order #</TableCell>
									<TableCell>Client & Garments</TableCell>
									<TableCell align="center">Due Date</TableCell>
									<TableCell align="right">Payment</TableCell>
									<TableCell align="center">Payment Status</TableCell>
									<TableCell align="center">Order Status</TableCell>
									<TableCell align="center">Action</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{Array.from({ length: rowsPerPage }).map((_, index) => (
									<TableRow key={index}>
										<TableCell>
											<Skeleton variant="text" width="60%" />
										</TableCell>
										<TableCell>
											<Skeleton variant="text" width="80%" />
											<Skeleton variant="text" width="60%" />
										</TableCell>
										<TableCell align="center">
											<Skeleton variant="text" width="70%" />
										</TableCell>
										<TableCell align="right">
											<Skeleton variant="text" width="80%" />
										</TableCell>
										<TableCell align="center">
											<Skeleton
												variant="rectangular"
												height={24}
												width="100%"
											/>
										</TableCell>
										<TableCell align="center">
											<Skeleton
												variant="rectangular"
												height={24}
												width="100%"
											/>
										</TableCell>
										<TableCell align="center">
											<Skeleton variant="circular" width={24} height={24} />
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				) : data.data.length === 0 ? (
					<Card>
						<CardContent sx={{ textAlign: 'center', py: 5 }}>
							<Typography variant="h6" color="text.secondary" gutterBottom>
								{search || statusFilter !== 'all'
									? 'No orders found matching your filters'
									: 'No orders yet'}
							</Typography>
						</CardContent>
					</Card>
				) : (
					<TableContainer component={Paper}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Order #</TableCell>
									<TableCell>Client & Garments</TableCell>
									<TableCell align="center">Due Date</TableCell>
									<TableCell align="right">Payment</TableCell>
									<TableCell align="center">Payment Status</TableCell>
									<TableCell align="center">Order Status</TableCell>
									<TableCell align="center">Action</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{ordersWithPaymentInfo.map((order) => (
									<OrderTableRow
										key={order.id}
										order={order}
										onClick={handleCardClick}
									/>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</Box>

			{/* Pagination */}
			<Paper elevation={1} sx={{ mt: 3 }}>
				<TablePagination
					rowsPerPageOptions={[5, 10, 25, 50]}
					component="div"
					count={data.count}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			</Paper>
		</Box>
	);
}
