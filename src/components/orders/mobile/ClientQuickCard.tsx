'use client';

import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import type { Tables } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

type Client = Tables<'clients'>;

interface ClientQuickCardProps {
	client: Client;
	onSelect: (client: Client) => void;
	lastOrderDate?: string;
}

export const ClientQuickCard = ({
	client,
	onSelect,
	lastOrderDate,
}: ClientQuickCardProps) => {
	const handleTap = () => {
		// Haptic feedback on supported devices
		if ('vibrate' in navigator) {
			navigator.vibrate(10);
		}
		onSelect(client);
	};

	const getInitials = () => {
		const firstInitial = client.first_name?.[0] || '';
		const lastInitial = client.last_name?.[0] || '';
		return `${firstInitial}${lastInitial}`.toUpperCase();
	};

	const getRelativeTime = (date?: string) => {
		if (!date) return null;
		try {
			return formatDistanceToNow(new Date(date), { addSuffix: true });
		} catch {
			return null;
		}
	};

	return (
		<motion.div
			whileTap={{ scale: 0.98 }}
			transition={{ type: 'spring', stiffness: 400, damping: 17 }}
		>
			<Card
				onClick={handleTap}
				sx={{
					p: 2,
					mb: 2,
					cursor: 'pointer',
					border: '2px solid transparent',
					transition: 'all 0.2s ease',
					'&:active': {
						borderColor: 'primary.main',
						bgcolor: 'action.selected',
					},
				}}
			>
				<Box display="flex" alignItems="center" gap={2}>
					<Avatar
						sx={(theme) => ({
							width: 48,
							height: 48,
							bgcolor: 'primary.main',
							fontSize: theme.typography.h5.fontSize, // 18px - suitable for avatar
						})}
					>
						{getInitials()}
					</Avatar>
					<Box flex={1}>
						<Typography variant="subtitle1" fontWeight="medium">
							{client.first_name} {client.last_name}
						</Typography>
						{lastOrderDate && (
							<Typography variant="caption" color="text.secondary">
								Last order: {getRelativeTime(lastOrderDate)}
							</Typography>
						)}
					</Box>
				</Box>
			</Card>
		</motion.div>
	);
};
