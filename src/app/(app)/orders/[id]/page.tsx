import {
	Container,
	Typography,
	Box,
	Card,
	CardContent,
	Button,
	Chip,
	Divider,
	LinearProgress,
	Alert,
	Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { RemixIcon } from '@/components/dashboard/common';
import Link from 'next/link';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';
import { getInvoicePaymentHistory } from '@/lib/actions/payments';
import { getOrderStatusLabel } from '@/lib/utils/orderStatus';
import OrderDetailClient from './OrderDetailClient';
import OptimisticOrderWrapper from './OptimisticOrderWrapper';
import OrderHeaderActions from '@/components/orders/OrderHeaderActions';
import CreditBalanceCheck from './CreditBalanceCheck';
import PaymentStatusChip from './PaymentStatusChip';
import PaymentAmountDisplay from './PaymentAmountDisplay';
import PaymentProgressBar from './PaymentProgressBar';
import type { Database } from '@/types/supabase';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { formatDateSafe } from '@/lib/utils/date-time-utils';
import {
	calculatePaymentStatus,
	calculateActiveTotal,
	type PaymentInfo,
} from '@/lib/utils/payment-calculations';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

function formatUSD(cents: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format((cents || 0) / 100);
}

function getClientInitials(firstName: string, lastName: string) {
	const f = firstName?.trim() || '';
	const l = lastName?.trim() || '';
	const fi = f ? f[0] : '';
	const li = l ? l[0] : '';
	return `${fi}${li}`.toUpperCase() || '?';
}

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { shop } = await ensureUserAndShop();
	const supabase = await createSupabaseClient();
	const { id } = await params;

	const { data: order } = (await supabase
		.from('orders')
		.select(
			'id, client_id, status, order_due_date, subtotal_cents, discount_cents, tax_cents, total_cents, created_at, order_number, is_paid, paid_at, paid_amount_cents, notes'
		)
		.eq('id', id)
		.single()) as {
		data: Database['public']['Tables']['orders']['Row'] | null;
	};

	let client = null;
	if (order?.client_id) {
		const { data } = (await supabase
			.from('clients')
			.select('id, first_name, last_name, phone_number, email, mailing_address')
			.eq('id', order.client_id)
			.single()) as {
			data: Database['public']['Tables']['clients']['Row'] | null;
		};
		client = data;
	}

	const { data: garments } = await supabase
		.from('garments')
		.select(
			`id, name, stage, notes, due_date, event_date, is_done, preset_icon_key, preset_fill_color, image_cloud_id, photo_url`
		)
		.eq('order_id', id)
		.order('created_at', { ascending: true });

	// Get invoice without payments first
	const { data: invoice } = await supabase
		.from('invoices')
		.select('*')
		.eq('order_id', id)
		.single();

	// Get payment history (payments + refunds) if invoice exists
	let paymentHistory: any[] = [];
	if (invoice) {
		try {
			paymentHistory = await getInvoicePaymentHistory(invoice.id);
		} catch (error) {
			console.error('Error fetching payment history:', error);
			// Fallback to empty array if there's an error
			paymentHistory = [];
		}
	}

	// Get shop settings
	const { data: shopSettings, error: shopSettingsError } = await supabase
		.from('shop_settings')
		.select('invoice_prefix')
		.eq('shop_id', shop.id)
		.single();

	// Log error for debugging but continue with defaults
	if (shopSettingsError) {
		console.warn('Failed to fetch shop settings:', shopSettingsError.message);
	}

	// Fetch garment services with removal information (same as invoice page)
	// Try the full query first, fall back to basic query if removal fields don't exist
	let lines: any[] = [];
	let servicesError: any = null;

	try {
		const { data, error } = await supabase
			.from('garment_services')
			.select(
				`
				id,
				garment_id,
				name,
				description,
				quantity,
				unit,
				unit_price_cents,
				line_total_cents,
				is_done,
				is_removed,
				removed_at,
				removed_by,
				removal_reason,
				garments!inner(
					id,
					name,
					order_id
				)
				`
			)
			.eq('garments.order_id', id)
			.order('created_at', { ascending: true });

		if (error) {
			throw error;
		}
		lines = data || [];
	} catch (error) {
		console.warn(
			'Failed to fetch services with removal fields, falling back to basic query:',
			error
		);
		// Fallback to basic query without removal fields
		const garmentIds = (garments || []).map((g: any) => g.id);
		if (garmentIds.length > 0) {
			const { data: basicLines, error: basicError } = await supabase
				.from('garment_services')
				.select(
					`
					id,
					garment_id,
					name,
					description,
					quantity,
					unit,
					unit_price_cents,
					line_total_cents,
					is_done
					`
				)
				.in('garment_id', garmentIds)
				.order('created_at', { ascending: true });

			if (basicError) {
				console.error('Error fetching basic garment services:', basicError);
				servicesError = basicError;
			} else {
				// Transform basic data to include garment names and default removal fields
				lines = (basicLines || []).map((service: any) => {
					const garment = garments?.find(
						(g: any) => g.id === service.garment_id
					);
					return {
						...service,
						is_removed: false,
						removed_at: null,
						removed_by: null,
						removal_reason: null,
						garments: garment
							? {
									id: garment.id,
									name: garment.name,
									order_id: id,
								}
							: {
									id: service.garment_id,
									name: 'Unknown Garment',
									order_id: id,
								},
					};
				});
			}
		}
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

	const activeSubtotal = lines
		.filter((service: any) => !service.is_removed)
		.reduce((sum: number, service: any) => {
			const lineTotal =
				service.line_total_cents || service.quantity * service.unit_price_cents;
			return sum + lineTotal;
		}, 0);

	// Prepare order data for the centralized calculation
	const orderWithServices = {
		total_cents: order?.total_cents || 0,
		discount_cents: order?.discount_cents || 0,
		tax_cents: order?.tax_cents || 0,
		garments:
			garments?.map((g: any) => ({
				garment_services: g.garment_services?.map((gs: any) => ({
					id: gs.id,
					quantity: gs.quantity,
					unit_price_cents: gs.unit_price_cents,
					line_total_cents: gs.line_total_cents,
					is_removed: gs.is_removed,
				})),
			})) || [],
	};

	const activeTotal = calculateActiveTotal(orderWithServices);

	// Calculate payment status using the shared utility with actual payment history
	const paymentCalc = calculatePaymentStatus(
		activeTotal,
		(paymentHistory as PaymentInfo[]) || []
	);

	const {
		totalPaid,
		totalRefunded,
		netPaid,
		amountDue,
		percentage,
		paymentStatus: calcPaymentStatus,
	} = paymentCalc;

	// Create a getPaymentStatus function that returns the expected format for the UI
	const getPaymentStatus = () => {
		// Handle overpayment/refund situation first (covers zero total with payments)
		if (calcPaymentStatus === 'overpaid') {
			const creditAmount = -amountDue;
			return {
				label: 'Credit Balance',
				color: 'info',
				percentage,
				amountDue: -creditAmount, // negative indicates credit
				isRefundRequired: true,
				creditAmount,
			};
		}

		// Handle no charges case (but only if there are truly no payments)
		if (activeTotal === 0 && netPaid === 0)
			return {
				label: 'No Charges',
				color: 'default',
				percentage: 0,
				amountDue: 0,
				isRefundRequired: false,
			};

		if (calcPaymentStatus === 'paid')
			return {
				label: 'Paid in Full',
				color: 'success',
				percentage: 100,
				amountDue: 0,
				isRefundRequired: false,
			};

		// Partial payment statuses
		if (calcPaymentStatus === 'partial') {
			if (percentage >= 75)
				return {
					label: `${Math.round(percentage)}% Paid`,
					color: 'info',
					percentage,
					amountDue,
					isRefundRequired: false,
				};
			if (percentage >= 50)
				return {
					label: `${Math.round(percentage)}% Paid`,
					color: 'info',
					percentage,
					amountDue,
					isRefundRequired: false,
				};
			if (percentage > 0)
				return {
					label: `${Math.round(percentage)}% Paid`,
					color: 'info',
					percentage,
					amountDue,
					isRefundRequired: false,
				};
		}

		return {
			label: 'Unpaid',
			color: 'error',
			percentage: 0,
			amountDue,
			isRefundRequired: false,
		};
	};

	const paymentStatus = getPaymentStatus();

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
							Order {order?.order_number || `#${order?.id.slice(0, 8)}`}
						</Typography>
						<Typography color="text.secondary">
							Created on {formatDateSafe(order?.created_at)}
						</Typography>
					</Box>
					{order && (
						<OrderHeaderActions
							order={{
								id: order.id,
								order_number: order.order_number,
								status: order.status,
								total_cents: order.total_cents,
							}}
							invoice={invoice}
							shopSettings={{
								invoice_prefix: shopSettings?.invoice_prefix ?? 'INV',
							}}
							garments={
								garments?.map((g: any) => ({
									id: g.id,
									name: g.name,
									stage: g.stage,
								})) || []
							}
						/>
					)}
				</Box>

				{/* Credit Balance Warning Banner */}
				<CreditBalanceCheck
					garmentServices={lines || []}
					payments={(paymentHistory as PaymentInfo[]) || []}
					discountCents={order?.discount_cents || 0}
					taxCents={order?.tax_cents || 0}
				/>

				{/* Condensed Order Overview */}
				<Card
					sx={{
						mb: 3,
						borderRadius: 2,
						boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
						border: '1px solid',
						borderColor: 'grey.200',
					}}
				>
					<CardContent sx={{ p: 3 }}>
						<Grid container spacing={4} alignItems="center">
							{/* Client Information with Avatar */}
							<Grid size={{ xs: 12, md: 3 }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
									<Avatar
										sx={{
											width: 48,
											height: 48,
											bgcolor: 'primary.main',
											color: 'primary.contrastText',
											fontSize: '1.1rem',
											fontWeight: 600,
										}}
									>
										{client ? (
											getClientInitials(client.first_name, client.last_name)
										) : (
											<PersonIcon />
										)}
									</Avatar>
									<Box sx={{ minWidth: 0, flex: 1 }}>
										<Typography
											variant="h6"
											sx={{
												fontWeight: 600,
												lineHeight: 1.2,
												mb: 0.5,
											}}
										>
											<Link
												href={`/clients/${client?.id}`}
												style={{
													textDecoration: 'none',
													color: 'inherit',
												}}
											>
												{client
													? `${client.first_name} ${client.last_name}`
													: 'Unknown Client'}
											</Link>
										</Typography>
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												flexWrap: 'wrap',
											}}
										>
											{client?.email && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 0.5,
													}}
												>
													<EmailIcon
														sx={{ fontSize: 14, color: 'text.secondary' }}
													/>
													<Typography variant="caption" color="text.secondary">
														{client.email}
													</Typography>
												</Box>
											)}
											{client?.phone_number && (
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														gap: 0.5,
													}}
												>
													<PhoneIcon
														sx={{ fontSize: 14, color: 'text.secondary' }}
													/>
													<Typography variant="caption" color="text.secondary">
														{formatPhoneNumber(client.phone_number)}
													</Typography>
												</Box>
											)}
										</Box>
									</Box>
								</Box>
							</Grid>

							{/* Payment Status */}
							<Grid size={{ xs: 12, md: 5 }}>
								<Box>
									<Box
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 2,
											mb: 1,
											width: '100%',
											maxWidth: 420,
											mx: 'auto',
										}}
									>
										<PaymentStatusChip
											garmentServices={lines || []}
											payments={(paymentHistory as PaymentInfo[]) || []}
											discountCents={order?.discount_cents || 0}
											taxCents={order?.tax_cents || 0}
										/>
										<PaymentAmountDisplay
											garmentServices={lines || []}
											payments={(paymentHistory as PaymentInfo[]) || []}
											discountCents={order?.discount_cents || 0}
											taxCents={order?.tax_cents || 0}
										/>
										{activeTotal !== (order?.total_cents || 0) && (
											<Typography
												variant="body2"
												color="text.secondary"
												sx={{ textDecoration: 'line-through' }}
											>
												{formatUSD(order?.total_cents || 0)}
											</Typography>
										)}
									</Box>

									{/* Progress Bar */}
									<PaymentProgressBar
										garmentServices={lines || []}
										payments={(paymentHistory as PaymentInfo[]) || []}
										discountCents={order?.discount_cents || 0}
										taxCents={order?.tax_cents || 0}
									/>
								</Box>
							</Grid>

							{/* Actions & Alerts */}
							<Grid size={{ xs: 12, md: 1 }}>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'flex-end',
										gap: 1,
									}}
								>
									{/* Order Notes Indicator */}
									{order?.notes && (
										<Chip
											label="📝 Notes"
											variant="outlined"
											size="small"
											sx={{ fontSize: '0.7rem' }}
										/>
									)}
								</Box>
							</Grid>

							{/* Order Status - Far Right */}
							<Grid size={{ xs: 12, md: 3 }}>
								<Box sx={{ textAlign: 'right' }}>
									<Typography
										variant="h5"
										sx={{
											fontWeight: 700,
											lineHeight: 1.2,
											color:
												getStatusColor(order?.status || 'new') === 'success'
													? 'success.main'
													: getStatusColor(order?.status || 'new') === 'warning'
														? 'warning.main'
														: getStatusColor(order?.status || 'new') === 'info'
															? 'info.main'
															: getStatusColor(order?.status || 'new') ===
																  'error'
																? 'error.main'
																: 'text.primary',
											textTransform: 'capitalize',
											mb: 1,
										}}
									>
										{getOrderStatusLabel(order?.status || 'new')}
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Services and Payment History Sections */}
				<OptimisticOrderWrapper
					garmentServices={lines || []}
					garments={
						garments?.map((g: any) => ({
							id: g.id,
							name: g.name,
							stage: g.stage,
							due_date: g.due_date,
							image_cloud_id: g.image_cloud_id,
							photo_url: g.photo_url,
							preset_icon_key: g.preset_icon_key,
							preset_fill_color: g.preset_fill_color,
						})) || []
					}
					invoice={invoice}
					initialPayments={paymentHistory}
					orderStatus={order?.status || null}
					paidAt={order?.paid_at || null}
					{...(client?.email && { clientEmail: client.email })}
					orderId={order?.id || ''}
					orderTotal={activeTotal}
					orderSubtotal={activeSubtotal}
					discountCents={order?.discount_cents || 0}
					taxCents={order?.tax_cents || 0}
				/>
			</Box>
		</Container>
	);
}
