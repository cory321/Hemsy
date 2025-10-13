'use client';

import {
	Card,
	CardContent,
	Typography,
	Stack,
	Button,
	Box,
	alpha,
} from '@mui/material';
import { RemixIcon } from '../common/RemixIcon';

interface QuickAction {
	id: string;
	icon: string;
	text: string;
}

interface QuickActionsProps {
	actions?: QuickAction[];
	onAction?: (actionId: string) => void;
}

const refinedColors = {
	text: {
		primary: '#1a1a1a',
		secondary: '#666666',
	},
};

const defaultActions: QuickAction[] = [
	{
		id: 'new-order',
		icon: 'ri-file-add-line',
		text: 'Create Order',
	},
	{
		id: 'new-client',
		icon: 'ri-user-add-line',
		text: 'Add Client',
	},
	{
		id: 'new-appointment',
		icon: 'ri-calendar-line',
		text: 'Add Appointment',
	},
	{
		id: 'new-service',
		icon: 'ri-service-line',
		text: 'Add Service',
	},
];

export function QuickActions({
	actions = defaultActions,
	onAction,
}: QuickActionsProps) {
	return (
		<Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
			<CardContent>
				<Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
					Quick Actions
				</Typography>
				<Stack spacing={1}>
					{actions.map((action) => (
						<Button
							key={action.id}
							fullWidth
							variant="text"
							onClick={() => onAction?.(action.id)}
							sx={(theme) => ({
								py: 1.5,
								px: 2,
								justifyContent: 'flex-start',
								textTransform: 'none',
								borderRadius: 1,
								border: '1px solid transparent',
								color: refinedColors.text.primary,
								'&:hover': {
									borderColor: 'primary.main',
									borderWidth: '2px',
									color: 'primary.main',
									fontWeight: 600,
									// Prevent layout shift by adjusting padding to compensate for border width change
									px: 'calc(16px - 1px)', // 16px (2 * 8px) - 1px border difference
									py: 'calc(12px - 1px)', // 12px (1.5 * 8px) - 1px border difference
								},
								fontWeight: 600,
								fontSize: theme.typography.body1.fontSize, // 16px - standard button text
								transition: 'none',
							})}
						>
							<RemixIcon name={action.icon} size={18} color="inherit" />
							<Box component="span" sx={{ ml: 2 }}>
								{action.text}
							</Box>
						</Button>
					))}
				</Stack>
			</CardContent>
		</Card>
	);
}
