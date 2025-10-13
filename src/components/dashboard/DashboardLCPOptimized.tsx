import { Suspense } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DashboardHeader } from './DashboardHeader';
import { BusinessOverviewServer } from './business-overview';
import { GarmentPipelineServer } from './garment-pipeline/GarmentPipelineServer';
import { AppointmentsFocusServer } from './todays-focus';
import { DashboardAlertsServer } from './alerts';

// ============================================================================
// LCP-OPTIMIZED DASHBOARD
// ============================================================================
//
// This component optimizes for LCP by:
// 1. Rendering critical above-the-fold content first
// 2. Using progressive loading with Suspense boundaries
// 3. Prioritizing the largest contentful element (likely center column)
// 4. Deferring non-critical content
// ============================================================================

// Refined color palette
const refinedColors = {
	background: '#FAF9F6',
};

/**
 * Critical above-the-fold content that should render immediately
 * This is likely the LCP candidate - optimize for fastest rendering
 */
function CriticalAboveFold() {
	return (
		<>
			{/* Header - Fast loading, no data dependencies */}
			<DashboardHeader />

			{/* Critical alerts - Only renders if data exists */}
			<Suspense fallback={null}>
				<DashboardAlertsServer />
			</Suspense>

			{/* Main content grid with LCP optimization */}
			<Grid container spacing={3}>
				{/* CENTER COLUMN FIRST - Likely LCP candidate (largest content block) */}
				<Grid size={{ xs: 12, lg: 6 }} sx={{ order: { xs: 2, lg: 2 } }}>
					<Suspense fallback={<GarmentPipelineSkeleton />}>
						<GarmentPipelineServer />
					</Suspense>
				</Grid>

				{/* LEFT COLUMN - Business metrics */}
				<Grid size={{ xs: 12, lg: 3 }} sx={{ order: { xs: 1, lg: 1 } }}>
					<Suspense fallback={<BusinessOverviewSkeleton />}>
						<BusinessOverviewServer />
					</Suspense>
				</Grid>

				{/* RIGHT COLUMN - Appointments */}
				<Grid size={{ xs: 12, lg: 3 }} sx={{ order: { xs: 3, lg: 3 } }}>
					<Suspense fallback={<AppointmentsSkeleton />}>
						<AppointmentsFocusServer />
					</Suspense>
				</Grid>
			</Grid>
		</>
	);
}

/**
 * Optimized skeleton for garment pipeline (LCP candidate)
 */
function GarmentPipelineSkeleton() {
	return (
		<Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
			<Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
			<Skeleton
				variant="rectangular"
				width="100%"
				height={120}
				sx={{ mb: 3 }}
			/>
			<Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
			{[1, 2, 3].map((i) => (
				<Skeleton
					key={i}
					variant="rectangular"
					width="100%"
					height={60}
					sx={{ mb: 1 }}
				/>
			))}
		</Box>
	);
}

/**
 * Optimized skeleton for business overview
 */
function BusinessOverviewSkeleton() {
	return (
		<Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
			<Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />
			{[1, 2, 3, 4].map((i) => (
				<Box key={i} sx={{ mb: 2 }}>
					<Skeleton variant="text" width="30%" height={20} />
					<Skeleton variant="text" width="40%" height={28} />
				</Box>
			))}
		</Box>
	);
}

/**
 * Optimized skeleton for appointments
 */
function AppointmentsSkeleton() {
	return (
		<Box sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
			<Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
			<Skeleton
				variant="rectangular"
				width="100%"
				height={100}
				sx={{ mb: 2 }}
			/>
			<Skeleton variant="text" width="50%" height={20} />
		</Box>
	);
}

/**
 * LCP-optimized dashboard component
 */
export function DashboardLCPOptimized() {
	return (
		<Box
			sx={{
				bgcolor: refinedColors.background,
				minHeight: '100vh',
				p: 3,
				// Optimize for LCP rendering
				contain: 'layout style paint',
			}}
		>
			<CriticalAboveFold />
		</Box>
	);
}
