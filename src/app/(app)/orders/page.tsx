import { Typography, Box, Button, Fab } from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import OrdersList from '@/components/orders/OrdersList';
import OrderStatsCards from '@/components/orders/OrderStatsCards';
import { BusinessHealth } from '@/components/dashboard/business-overview/BusinessHealth';
import { getOrdersPaginated, getOrderStats } from '@/lib/actions/orders';
import { getDashboardDataOptimized } from '@/lib/actions/dashboard-optimized';

// Reusable button style for contained-to-outlined hover effect
const containedToOutlinedHoverStyle = {
	whiteSpace: 'nowrap' as const,
	border: '2px solid transparent',
	fontSize: '1rem',
	'&:hover': {
		backgroundColor: 'transparent',
		borderColor: 'primary.main',
		borderWidth: '2px',
		color: 'primary.main',
		fontWeight: 600,
	},
	fontWeight: 600,
	transition: 'none',
};

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
	// Fetch initial data server-side with active orders filter by default
	const [initialData, statsData, dashboardData] = await Promise.all([
		getOrdersPaginated(1, 10, { onlyActive: true }),
		getOrderStats(),
		getDashboardDataOptimized(),
	]);

	// Extract business health data from optimized dashboard data
	const businessHealthData = dashboardData.businessHealthData;

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ mt: 2, mb: 4 }}>
				{/* Header with title and desktop CTA */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						mb: 3,
					}}
				>
					<Typography variant="h4" component="h1">
						Orders
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						component={Link}
						href="/orders/new"
						sx={{
							display: { xs: 'none', sm: 'flex' },
							...containedToOutlinedHoverStyle,
						}}
					>
						Create Order
					</Button>
				</Box>

				{/* Main Content Grid */}
				<Grid container spacing={3}>
					{/* Left Column - Main Content */}
					<Grid size={{ xs: 12, lg: 9 }}>
						{/* Orders List with pagination */}
						<OrdersList
							initialData={initialData}
							getOrdersAction={getOrdersPaginated}
						/>
					</Grid>

					{/* Right Column - Business Metrics */}
					<Grid size={{ xs: 12, lg: 3 }}>
						{/* Business Health */}
						<Box sx={{ mb: 3 }}>
							<BusinessHealth
								{...businessHealthData}
								hideUnpaidBalance={true}
							/>
						</Box>

						{/* Order Stats */}
						<OrderStatsCards
							stats={statsData}
							excludeMonthlyRevenue={true}
							verticalLayout={true}
						/>
					</Grid>
				</Grid>

				{/* Floating Action Button */}
				<Fab
					color="primary"
					aria-label="add order"
					component={Link}
					href="/orders/new"
					sx={{
						position: 'fixed',
						bottom: 80,
						right: 16,
						display: { xs: 'flex', sm: 'none' },
					}}
				>
					<AddIcon />
				</Fab>
			</Box>
		</Box>
	);
}
