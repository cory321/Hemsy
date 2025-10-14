import { Container, Typography, Box } from '@mui/material';
import { Suspense } from 'react';
import ClientsList from '@/components/clients/ClientsList';
import { getClients, getArchivedClientsCount } from '@/lib/actions/clients';
import AddClientCtas from '@/components/clients/AddClientCtas';
import { SkeletonList } from '@/components/ui/Skeleton';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

// Async component that fetches data
async function ClientsData() {
	const [initialData, archivedCount] = await Promise.all([
		getClients(1, 10),
		getArchivedClientsCount(),
	]);

	return (
		<ClientsList
			initialData={initialData}
			getClientsAction={getClients}
			archivedClientsCount={archivedCount}
		/>
	);
}

// Main page component with Suspense boundary
export default function ClientsPageWithSuspense() {
	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				{/* Header with title and desktop CTA - loads immediately */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 3,
					}}
				>
					<Typography variant="h2" component="h1">
						Clients
					</Typography>
					<AddClientCtas />
				</Box>

				{/* Suspense boundary for data fetching - shows skeleton while loading */}
				<Suspense fallback={<SkeletonList count={6} />}>
					<ClientsData />
				</Suspense>

				{/* Mobile FAB is rendered inside AddClientCtas */}
			</Box>
		</Container>
	);
}
