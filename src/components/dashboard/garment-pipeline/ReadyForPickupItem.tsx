'use client';

import {
	Paper,
	Stack,
	Box,
	Typography,
	IconButton,
	alpha,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { STAGE_COLORS } from '@/constants/garmentStages';
import { getDetailedDueDateDisplay } from '@/lib/utils/date-time-utils';
import type { ActiveGarment } from '@/lib/actions/dashboard';

interface ReadyForPickupItemProps {
	garment: ActiveGarment;
}

const PICKUP_COLOR = STAGE_COLORS['Ready For Pickup']; // #BD8699

export function ReadyForPickupItem({ garment }: ReadyForPickupItemProps) {
	const router = useRouter();

	// Get formatted due date display with detailed info
	const dueDateDisplay = getDetailedDueDateDisplay(garment.due_date);

	const handleClick = () => {
		router.push(`/garments/${garment.id}`);
	};

	return (
		<Paper
			elevation={0}
			onClick={handleClick}
			sx={{
				p: 2,
				border: `1px solid ${alpha(PICKUP_COLOR, 0.3)}`,
				bgcolor: alpha(PICKUP_COLOR, 0.05),
				borderRadius: 1.5,
				cursor: 'pointer',
				transition: 'all 0.2s',
				'&:hover': {
					borderColor: alpha(PICKUP_COLOR, 0.5),
					bgcolor: alpha(PICKUP_COLOR, 0.08),
					transform: 'translateY(-1px)',
				},
			}}
		>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<CheckCircleIcon
							sx={{
								fontSize: 18,
								color: PICKUP_COLOR,
							}}
						/>
						<Typography
							variant="body2"
							sx={{
								fontWeight: 600,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{garment.name}
						</Typography>
					</Stack>
					<Typography
						variant="caption"
						sx={{
							color: 'text.secondary',
							display: 'block',
							mt: 0.5,
							ml: 3.25, // Align with text after icon
						}}
					>
						{garment.client_name} • {dueDateDisplay}
					</Typography>
				</Box>
				<Box
					sx={{
						px: 1.5,
						py: 0.5,
						bgcolor: alpha(PICKUP_COLOR, 0.15),
						borderRadius: 1,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: PICKUP_COLOR,
							fontWeight: 600,
						}}
					>
						READY
					</Typography>
				</Box>
			</Stack>
		</Paper>
	);
}
