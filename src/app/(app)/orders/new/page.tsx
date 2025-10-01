import { Suspense } from 'react';
import { Container, Typography, Box, Skeleton } from '@mui/material';
import Link from 'next/link';
import { OrderFlowProvider } from '@/contexts/OrderFlowContext';
import OrderFlowStepper from '@/components/orders/OrderFlowStepper';
import { getShopTaxPercent } from '@/lib/actions/shop-settings';
import NewOrderClient from './NewOrderClient';

// Server Component - fetches data
export default async function NewOrderPage({
	searchParams,
}: {
	searchParams: Promise<{ clientId?: string }>;
}) {
	// Fetch tax percent on server (Next.js 15 best practice)
	const taxPercent = await getShopTaxPercent();
	const params = await searchParams;
	const clientId = params.clientId;

	return (
		<Suspense fallback={<OrderLoadingSkeleton />}>
			<NewOrderClient
				initialClientId={clientId || undefined}
				taxPercent={taxPercent}
			/>
		</Suspense>
	);
}

function OrderLoadingSkeleton() {
	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 2 }}>
				<Skeleton variant="text" width={200} height={40} />
				<Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
			</Box>
		</Container>
	);
}
