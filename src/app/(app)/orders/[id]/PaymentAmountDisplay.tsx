import { Typography, Box } from '@mui/material';
import type { PaymentInfo } from '@/lib/utils/payment-calculations';

interface PaymentAmountDisplayProps {
	garmentServices: Array<{
		quantity: number;
		unit_price_cents: number;
		line_total_cents: number | null;
		is_removed?: boolean | null;
	}>;
	payments: PaymentInfo[];
	discountCents: number;
	taxCents: number;
}

function formatUSD(cents: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 2,
	}).format(cents / 100);
}

export default function PaymentAmountDisplay({
	garmentServices,
	payments,
	discountCents,
	taxCents,
}: PaymentAmountDisplayProps) {
	// Calculate active total from garment services (excluding soft-deleted)
	const activeServicesSubtotal = garmentServices
		.filter((service) => !service.is_removed)
		.reduce((sum, service) => {
			const lineTotal =
				service.line_total_cents || service.quantity * service.unit_price_cents;
			return sum + lineTotal;
		}, 0);

	// Apply discount and tax to get active total
	const activeTotal = activeServicesSubtotal - discountCents + taxCents;

	// Calculate net paid amount from payments
	const netPaid = payments
		.filter(
			(p) =>
				p.status === 'completed' ||
				p.status === 'partially_refunded' ||
				p.status === 'refunded'
		)
		.reduce(
			(sum, p) => sum + p.amount_cents - (p.refunded_amount_cents || 0),
			0
		);

	return (
		<Box>
			<Typography variant="h6" fontWeight="600">
				{formatUSD(netPaid)} / {formatUSD(activeTotal)}
			</Typography>
		</Box>
	);
}
