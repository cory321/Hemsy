import { Box, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';

// Refined color palette to match DashboardServer
const refinedColors = {
	background: '#FAF9F6',
};

export default function Loading() {
	return (
		<Box sx={{ bgcolor: refinedColors.background, minHeight: '100vh', p: 3 }}>
			{/* Header Skeleton - matches DashboardHeader */}
			<Box sx={{ mb: 4 }}>
				{/* Date */}
				<Skeleton variant="text" width={200} height={24} sx={{ mb: 0.5 }} />
				{/* Greeting */}
				<Skeleton variant="text" width={300} height={40} sx={{ mb: 0.5 }} />
				{/* Activity Summary */}
				<Skeleton variant="text" width={250} height={24} />
			</Box>

			{/* Alert Section Skeleton */}
			<Box sx={{ mb: 3 }}>
				<Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
			</Box>

			{/* Main Content Grid - matches current layout: Business (lg:3), Garment (lg:6), Appointments (lg:3) */}
			<Grid container spacing={3}>
				{/* Left Column - Business Overview */}
				<Grid size={{ xs: 12, lg: 3 }}>
					<Box
						sx={{
							p: 3,
							border: '1px solid #e0e0e0',
							borderRadius: 1,
							height: 'fit-content',
						}}
					>
						<Skeleton variant="text" width={120} height={28} sx={{ mb: 2 }} />
						{/* Business Health Cards */}
						<Box sx={{ mb: 3 }}>
							<Skeleton
								variant="rectangular"
								height={80}
								sx={{ mb: 2, borderRadius: 1 }}
							/>
							<Skeleton
								variant="rectangular"
								height={80}
								sx={{ mb: 2, borderRadius: 1 }}
							/>
							<Skeleton
								variant="rectangular"
								height={80}
								sx={{ borderRadius: 1 }}
							/>
						</Box>
					</Box>
				</Grid>

				{/* Center Column - Garment Pipeline */}
				<Grid size={{ xs: 12, lg: 6 }}>
					<Box
						sx={{
							p: 3,
							border: '1px solid #e0e0e0',
							borderRadius: 1,
							height: 'fit-content',
						}}
					>
						<Skeleton variant="text" width={150} height={28} sx={{ mb: 3 }} />

						{/* Pipeline Overview Skeleton */}
						<Box sx={{ mb: 4 }}>
							<Box
								sx={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									mb: 2,
								}}
							>
								{[1, 2, 3, 4].map((index) => (
									<Box key={index} sx={{ textAlign: 'center', flex: 1 }}>
										<Skeleton
											variant="circular"
											width={40}
											height={40}
											sx={{ mx: 'auto', mb: 1 }}
										/>
										<Skeleton
											variant="text"
											width={60}
											height={16}
											sx={{ mx: 'auto' }}
										/>
									</Box>
								))}
							</Box>
						</Box>

						{/* Pipeline Details */}
						<Box>
							<Skeleton
								variant="rectangular"
								height={200}
								sx={{ borderRadius: 1 }}
							/>
						</Box>
					</Box>
				</Grid>

				{/* Right Column - Appointments Focus */}
				<Grid size={{ xs: 12, lg: 3 }}>
					<Box
						sx={{
							p: 3,
							border: '1px solid #e0e0e0',
							borderRadius: 1,
							height: 'fit-content',
						}}
					>
						<Skeleton variant="text" width={120} height={28} sx={{ mb: 3 }} />

						{/* Next Appointment Skeleton */}
						<Box
							sx={{
								p: 2,
								bgcolor: 'rgba(92, 127, 142, 0.05)',
								border: '1px solid rgba(92, 127, 142, 0.2)',
								borderRadius: 1,
								mb: 3,
							}}
						>
							<Skeleton variant="text" width={100} height={16} sx={{ mb: 1 }} />
							<Skeleton variant="text" width={80} height={32} sx={{ mb: 1 }} />
							<Skeleton variant="text" width={120} height={20} sx={{ mb: 2 }} />
							<Box sx={{ display: 'flex', gap: 1 }}>
								<Skeleton
									variant="rectangular"
									width={80}
									height={32}
									sx={{ borderRadius: 1 }}
								/>
								<Skeleton
									variant="rectangular"
									width={70}
									height={32}
									sx={{ borderRadius: 1 }}
								/>
							</Box>
						</Box>

						{/* Today's Schedule */}
						<Skeleton variant="text" width={100} height={20} sx={{ mb: 2 }} />
						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							<Skeleton
								variant="rectangular"
								height={40}
								sx={{ borderRadius: 1 }}
							/>
							<Skeleton
								variant="rectangular"
								height={40}
								sx={{ borderRadius: 1 }}
							/>
							<Skeleton
								variant="rectangular"
								height={40}
								sx={{ borderRadius: 1 }}
							/>
						</Box>
					</Box>
				</Grid>
			</Grid>
		</Box>
	);
}
