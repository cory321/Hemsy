'use client';

import { ReactNode } from 'react';
import {
	Box,
	BottomNavigation,
	BottomNavigationAction,
	Paper,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

function BottomNav() {
	const pathname = usePathname();

	const navItems = [
		{ label: 'Home', href: '/dashboard', icon: <HomeIcon /> },
		{ label: 'Clients', href: '/clients', icon: <PeopleIcon /> },
		{ label: 'Orders', href: '/orders', icon: <ReceiptIcon /> },
		{ label: 'Garments', href: '/garments', icon: <CheckroomIcon /> },
		{ label: 'Calendar', href: '/appointments', icon: <CalendarMonthIcon /> },
		{ label: 'More', href: '/more', icon: <MoreHorizIcon /> },
	];

	const currentIndex = navItems.findIndex((item) =>
		pathname.startsWith(item.href)
	);

	return (
		<Paper
			sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
			elevation={3}
		>
			<BottomNavigation value={currentIndex} showLabels>
				{navItems.map((item, index) => (
					<BottomNavigationAction
						key={item.href}
						label={item.label}
						icon={item.icon}
						component={Link}
						href={item.href}
					/>
				))}
			</BottomNavigation>
		</Paper>
	);
}

export default function AppLayout({ children }: { children: ReactNode }) {
	return (
		<Box sx={{ pb: 7 }}>
			{children}
			<BottomNav />
		</Box>
	);
}
