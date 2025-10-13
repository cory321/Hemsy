'use client';

import {
	Card,
	CardContent,
	Typography,
	Stack,
	Box,
	Chip,
	Skeleton,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { ActivityItem } from '@/lib/actions/recent-activity';

interface RecentActivityProps {
	activities?: ActivityItem[];
	loading?: boolean;
}

const refinedColors = {
	text: {
		tertiary: '#999999',
	},
	type: {
		payment: '#5A7061',
		garment: '#BE879A',
		appointment: '#5C7F8E',
		order: '#EFBA8C',
		client: '#B85664',
	},
};

export function RecentActivity({
	activities = [],
	loading = false,
}: RecentActivityProps) {
	if (loading) {
		return (
			<Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
				<CardContent>
					<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
						Recent Activity
					</Typography>
					<Stack spacing={2}>
						{[1, 2, 3].map((index) => (
							<Box key={index}>
								<Skeleton variant="text" width="60%" height={20} />
								<Skeleton variant="text" width="80%" height={16} />
							</Box>
						))}
					</Stack>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
			<CardContent>
				<Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
					Recent Activity
				</Typography>
				{activities.length === 0 ? (
					<Typography
						variant="body2"
						sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}
					>
						No recent activity yet. Start by creating your first order!
					</Typography>
				) : (
					<Stack spacing={2}>
						{activities.map((activity) => (
							<Box key={activity.id}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'flex-start',
										mb: 0.5,
									}}
								>
									<Box sx={{ flex: 1, mr: 1 }}>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{activity.text}
										</Typography>
									</Box>
									<Chip
										size="small"
										label={activity.type}
										sx={(theme) => ({
											height: 16,
											fontSize: '0.625rem', // 10px - Extra small for compact chip label
											bgcolor: refinedColors.type[activity.type],
											color: 'white',
											flexShrink: 0,
											'& .MuiChip-label': {
												px: 0.75,
											},
										})}
									/>
								</Box>
								<Typography
									variant="caption"
									sx={{
										color: refinedColors.text.tertiary,
										display: 'block',
										mb: 0.5,
									}}
								>
									{activity.detail}
								</Typography>
								<Typography
									variant="caption"
									sx={{
										color: refinedColors.text.tertiary,
										fontStyle: 'italic',
									}}
								>
									{formatDistanceToNow(activity.timestamp, {
										addSuffix: true,
									})}
								</Typography>
							</Box>
						))}
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}
