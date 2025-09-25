'use client';

import {
	Card,
	CardContent,
	Typography,
	Box,
	Link as MuiLink,
} from '@mui/material';
import { getStageColor } from '@/constants/garmentStages';
import Grid from '@mui/material/Grid2';
import GarmentDetailClient from './GarmentDetailClient';
import GarmentServicesManager from '@/components/garments/GarmentServicesManager';
import GarmentTimeTracker from '@/components/garments/GarmentTimeTracker';
import { useGarment } from '@/contexts/GarmentContext';
import Link from 'next/link';
import { formatDateSafe } from '@/lib/utils/date-time-utils';

interface GarmentRightColumnProps {
	clientName: string;
}

export default function GarmentRightColumn({
	clientName,
}: GarmentRightColumnProps) {
	const { garment, historyKey } = useGarment();

	return (
		<>
			{/* Header with Status and Edit Button */}
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					mb: 3,
				}}
			>
				<Box sx={{ flex: 1 }}>
					<Typography variant="h4" component="h1">
						{garment.name || 'Untitled Garment'}
					</Typography>
					<Typography color="text.secondary">
						{garment.order_id ? (
							<MuiLink
								component={Link}
								href={`/orders/${garment.order_id}`}
								color="inherit"
								sx={{
									textDecoration: 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}
							>
								Order #{garment.order?.order_number || 'N/A'}
							</MuiLink>
						) : (
							<>Order #{garment.order?.order_number || 'N/A'}</>
						)}{' '}
						•{' '}
						{garment.order?.client?.id ? (
							<MuiLink
								component={Link}
								href={`/clients/${garment.order.client.id}`}
								color="inherit"
								sx={{
									textDecoration: 'none',
									'&:hover': {
										textDecoration: 'underline',
									},
								}}
							>
								{clientName}
							</MuiLink>
						) : (
							clientName
						)}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
					<GarmentDetailClient />
					{/* Status Indicator */}
					<Box
						sx={{
							minWidth: 120,
							height: 44,
							px: 2,
							borderRadius: 1,
							backgroundColor: getStageColor(garment.stage as any),
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Typography variant="h6" sx={{ fontWeight: 600 }}>
							{garment.stage}
						</Typography>
					</Box>
				</Box>
			</Box>

			{/* Key Dates */}
			<Card sx={{ mb: 3 }}>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						Important Dates
					</Typography>
					<Grid container spacing={3}>
						<Grid size={{ xs: 6, sm: 4 }}>
							<Typography variant="body2" color="text.secondary">
								Due Date
							</Typography>
							<Typography variant="body1">
								{formatDateSafe(garment.due_date)}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6, sm: 4 }}>
							<Typography variant="body2" color="text.secondary">
								Event Date
							</Typography>
							<Typography variant="body1">
								{formatDateSafe(garment.event_date)}
							</Typography>
						</Grid>
						<Grid size={{ xs: 6, sm: 4 }}>
							<Typography variant="body2" color="text.secondary">
								Created
							</Typography>
							<Typography variant="body1">
								{formatDateSafe(garment.created_at)}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Services */}
			<Box sx={{ mb: 3 }}>
				<GarmentServicesManager />
			</Box>

			{/* Time Tracker */}
			<Box sx={{ mb: 3 }}>
				<GarmentTimeTracker
					garmentId={garment.id}
					services={garment.garment_services.map((s: any) => ({
						id: s.id,
						name: s.name,
					}))}
				/>
			</Box>

			{/* Notes */}
			{garment.notes && (
				<Card sx={{ mb: 3 }}>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Notes
						</Typography>
						<Typography style={{ whiteSpace: 'pre-wrap' }}>
							{garment.notes}
						</Typography>
					</CardContent>
				</Card>
			)}
		</>
	);
}
