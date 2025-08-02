import {
	Container,
	Typography,
	Box,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Divider,
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';

export default function MorePage() {
	const menuItems = [
		{
			title: 'Services',
			description: 'Manage your alteration services',
			icon: <BuildIcon />,
			href: '/services',
		},
		{
			title: 'Invoices',
			description: 'View and manage invoices',
			icon: <ReceiptLongIcon />,
			href: '/invoices',
		},
		{
			title: 'Settings',
			description: 'Business info and preferences',
			icon: <SettingsIcon />,
			href: '/settings',
		},
	];

	const supportItems = [
		{
			title: 'Help & Support',
			icon: <HelpIcon />,
			href: '/help',
		},
		{
			title: 'Sign Out',
			icon: <LogoutIcon />,
			href: '/sign-out',
		},
	];

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					More Options
				</Typography>

				{/* Main Menu Items */}
				<List>
					{menuItems.map((item) => (
						<ListItem
							key={item.href}
							component={Link}
							href={item.href}
							sx={{
								bgcolor: 'background.paper',
								mb: 1,
								borderRadius: 1,
								'&:hover': {
									bgcolor: 'action.hover',
								},
							}}
							secondaryAction={<ChevronRightIcon color="action" />}
						>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.title} secondary={item.description} />
						</ListItem>
					))}
				</List>

				<Divider sx={{ my: 3 }} />

				{/* Support Items */}
				<List>
					{supportItems.map((item) => (
						<ListItem
							key={item.href}
							component={Link}
							href={item.href}
							sx={{
								bgcolor: 'background.paper',
								mb: 1,
								borderRadius: 1,
								'&:hover': {
									bgcolor: 'action.hover',
								},
							}}
						>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.title} />
						</ListItem>
					))}
				</List>
			</Box>
		</Container>
	);
}
