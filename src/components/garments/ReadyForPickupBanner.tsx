'use client';

import { useState } from 'react';
import {
	Alert,
	Button,
	CircularProgress,
	Fade,
	Box,
	Typography,
} from '@mui/material';
import { CheckCircle, LocalShipping } from '@mui/icons-material';
import { useGarment } from '@/contexts/GarmentContext';

interface ReadyForPickupBannerProps {
	garmentId: string;
	garmentName: string;
}

export default function ReadyForPickupBanner({
	garmentId,
	garmentName,
}: ReadyForPickupBannerProps) {
	const [loading, setLoading] = useState(false);
	const [showBanner, setShowBanner] = useState(true);
	const { markAsPickedUp } = useGarment();

	const handleMarkAsPickedUp = async () => {
		setLoading(true);

		try {
			await markAsPickedUp();
			// The banner will automatically hide when the garment stage changes
			// due to the parent component re-rendering with the new stage
		} catch (error) {
			console.error('Error marking garment as picked up:', error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Fade in={showBanner} timeout={300}>
			<Alert
				severity="success"
				icon={<CheckCircle sx={{ fontSize: 28 }} />}
				action={
					<Button
						variant="contained"
						color="success"
						size="large"
						onClick={handleMarkAsPickedUp}
						disabled={loading}
						startIcon={
							loading ? (
								<CircularProgress size={20} color="inherit" />
							) : (
								<LocalShipping />
							)
						}
						sx={{
							fontWeight: 600,
							fontSize: '1rem',
							px: 3,
							py: 1.5,
							minWidth: { xs: '100%', sm: 200 },
							backgroundColor: 'success.dark',
							color: 'white',
							boxShadow: 2,
							'&:hover': {
								backgroundColor: 'success.main',
								boxShadow: 4,
								transform: 'translateY(-1px)',
								transition: 'all 0.2s',
							},
							'&:active': {
								transform: 'translateY(0)',
							},
							'&.Mui-disabled': {
								backgroundColor: 'success.light',
								color: 'white',
							},
						}}
					>
						{loading ? 'Marking...' : 'Mark as Picked Up'}
					</Button>
				}
				sx={{
					mb: 2,
					width: '100%',
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					alignItems: { xs: 'stretch', sm: 'center' },
					py: { xs: 2, sm: 2.5 },
					px: { xs: 2, sm: 3 },
					borderRadius: 2,
					boxShadow: 3,
					border: (theme) => `2px solid ${theme.palette.success.main}`,
					'& .MuiAlert-message': {
						display: 'flex',
						alignItems: 'center',
						flex: 1,
						minWidth: 0,
						wordBreak: 'keep-all',
						fontSize: '1.125rem',
						fontWeight: 500,
					},
					'& .MuiAlert-action': {
						marginLeft: { xs: 0, sm: 'auto' },
						marginTop: { xs: 2, sm: 0 },
						paddingLeft: { xs: 0, sm: 3 },
						paddingTop: 0,
						alignItems: 'center',
					},
					backgroundColor: (theme) =>
						theme.palette.mode === 'light' ? '#e8f5e9' : 'success.dark',
					color: (theme) =>
						theme.palette.mode === 'light' ? 'success.dark' : 'common.white',
					'& .MuiAlert-icon': {
						color: 'success.main',
						marginRight: 2,
					},
				}}
			>
				<Box>
					<Typography
						variant="h6"
						component="strong"
						sx={{ display: 'block', fontWeight: 700 }}
					>
						All services complete!
					</Typography>
					<Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
						This garment is ready for pickup. Mark it as picked up when the
						client collects it.
					</Typography>
				</Box>
			</Alert>
		</Fade>
	);
}
