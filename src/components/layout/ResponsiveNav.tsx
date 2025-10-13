'use client';

import { ReactNode } from 'react';
import {
	Box,
	Drawer,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	BottomNavigation,
	BottomNavigationAction,
	Paper,
	AppBar,
	Toolbar,
	Typography,
	IconButton,
	Button,
} from '@mui/material';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useResponsive } from '@/hooks/useResponsive';
import { UserButton, useUser } from '@clerk/nextjs';
import { Breadcrumbs } from './Breadcrumbs';
import Image from 'next/image';
import { Logo } from './Logo';

// Icons
import { useState } from 'react';

function RemixIcon({
	name,
	size = 22,
	isDecorative = true,
	ariaLabel,
}: {
	name: string;
	size?: number;
	isDecorative?: boolean;
	ariaLabel?: string;
}) {
	const iconProps = isDecorative
		? { 'aria-hidden': true as const }
		: { 'aria-label': ariaLabel || `${name} icon`, role: 'img' as const };

	return (
		<i className={`ri ${name}`} style={{ fontSize: size }} {...iconProps} />
	);
}

// Navigation items configuration
const navItems = [
	{
		label: 'Home',
		href: '/dashboard',
		icon: <RemixIcon name="ri-home-smile-line" />,
		showInBottom: true,
	},
	{
		label: 'Clients',
		href: '/clients',
		icon: <RemixIcon name="ri-group-line" />,
		showInBottom: true,
	},
	{
		label: 'Orders',
		href: '/orders',
		icon: <RemixIcon name="ri-shopping-bag-3-line" />,
		showInBottom: true,
	},
	{
		label: 'Garments',
		href: '/garments',
		icon: <RemixIcon name="ri-t-shirt-line" />,
		showInBottom: true,
	},
	{
		label: 'Calendar',
		href: '/appointments',
		icon: <RemixIcon name="ri-calendar-2-line" />,
		showInBottom: true,
	},
	{
		label: 'More',
		href: '/more',
		icon: <RemixIcon name="ri-more-2-fill" />,
		showInBottom: true,
	},
];

// Additional items that only show in desktop navigation
const desktopOnlyItems = [
	{
		label: 'Services',
		href: '/services',
		icon: <RemixIcon name="ri-pencil-ruler-line" />,
	},
	{
		label: 'Invoices',
		href: '/invoices',
		icon: <RemixIcon name="ri-money-dollar-circle-line" />,
	},
	{
		label: 'Settings',
		href: '/settings',
		icon: <RemixIcon name="ri-settings-5-line" />,
	},
];

const DRAWER_WIDTH = 240; // Used for tablet drawer

interface ResponsiveNavProps {
	children: ReactNode;
}

function MobileHeader() {
	const pathname = usePathname();
	const { user } = useUser();

	// Find the current page title based on the pathname
	const currentPage = (() => {
		const allItems = [...navItems, ...desktopOnlyItems];
		const currentItem = allItems.find((item) => pathname.startsWith(item.href));
		return currentItem;
	})();

	const showLogo = !currentPage || pathname === '/dashboard';

	return (
		<AppBar
			position="fixed"
			sx={{
				boxShadow: 1,
			}}
		>
			<Toolbar sx={{ minHeight: '56px !important' }}>
				{showLogo ? (
					<Box
						component={Link}
						href="/dashboard"
						sx={{
							flexGrow: 1,
							display: 'flex',
							alignItems: 'center',
							textDecoration: 'none',
						}}
					>
						<Logo height={24} />
					</Box>
				) : (
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						{currentPage?.label}
					</Typography>
				)}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
					{user && (
						<Typography
							variant="body2"
							sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}
						>
							{user.firstName || user.emailAddresses[0]?.emailAddress}
						</Typography>
					)}
					<UserButton
						appearance={{
							elements: {
								rootBox: {
									marginLeft: '8px',
								},
								userButtonAvatarBox: {
									width: '32px',
									height: '32px',
								},
							},
						}}
						userProfileMode="navigation"
						userProfileUrl="/settings"
						afterSignOutUrl="/"
						showName={false}
					/>
				</Box>
			</Toolbar>
		</AppBar>
	);
}

function MobileBottomNav() {
	const pathname = usePathname();
	const bottomNavItems = navItems.filter((item) => item.showInBottom);
	const currentIndex = bottomNavItems.findIndex((item) =>
		pathname.startsWith(item.href)
	);

	return (
		<Paper
			sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}
			elevation={3}
		>
			<BottomNavigation value={currentIndex} showLabels>
				{bottomNavItems.map((item) => (
					<BottomNavigationAction
						key={item.href}
						label={item.label}
						icon={item.icon}
						component={Link}
						href={item.href}
						// prefetch is enabled by default for viewport visibility
					/>
				))}
			</BottomNavigation>
		</Paper>
	);
}

function DesktopTopNav() {
	const pathname = usePathname();
	const allDesktopItems = [
		...navItems.filter((item) => item.label !== 'More'),
		...desktopOnlyItems,
	];

	return (
		<AppBar position="fixed">
			<Toolbar sx={{ px: 0 }}>
				<Box
					sx={{
						width: '100%',
						maxWidth: '1400px',
						mx: 'auto',
						px: { xs: 2, sm: 3, md: 4, lg: 6 },
						display: 'flex',
						alignItems: 'center',
					}}
				>
					<Box
						component={Link}
						href="/dashboard"
						sx={{
							display: 'flex',
							alignItems: 'center',
							textDecoration: 'none',
						}}
					>
						<Logo height={28} />
					</Box>
					<Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
						{allDesktopItems.map((item) => {
							const isActive = pathname.startsWith(item.href);
							return (
								<Button
									key={item.href}
									component={Link}
									href={item.href}
									startIcon={item.icon}
									sx={{
										mx: 0.5,
										px: 2,
										py: 1,
										borderRadius: 1,
										backgroundColor: isActive
											? 'rgba(0, 0, 0, 0.08)'
											: 'transparent',
										borderBottom: isActive
											? '2px solid #3d3929'
											: '2px solid transparent',
										'&:hover': {
											backgroundColor: isActive
												? 'rgba(0, 0, 0, 0.12)'
												: 'rgba(0, 0, 0, 0.06)',
										},
										transition: 'all 0.2s ease',
									}}
								>
									{item.label}
								</Button>
							);
						})}
					</Box>
					<Box sx={{ ml: 2 }}>
						<UserButton
							appearance={{
								elements: {
									rootBox: {
										marginLeft: '8px',
									},
									userButtonAvatarBox: {
										width: '36px',
										height: '36px',
									},
								},
							}}
							userProfileMode="navigation"
							userProfileUrl="/settings"
							afterSignOutUrl="/"
						/>
					</Box>
				</Box>
			</Toolbar>
		</AppBar>
	);
}

function TabletNav() {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();
	const allDesktopItems = [
		...navItems.filter((item) => item.label !== 'More'),
		...desktopOnlyItems,
	];

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	return (
		<>
			<AppBar
				position="fixed"
				sx={{
					zIndex: (theme) => theme.zIndex.drawer + 1,
				}}
			>
				<Toolbar sx={{ px: 0 }}>
					<Box
						sx={{
							width: '100%',
							maxWidth: '1400px',
							mx: 'auto',
							px: { xs: 2, sm: 3, md: 4, lg: 6 },
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<IconButton
							color="inherit"
							aria-label="open drawer"
							edge="start"
							onClick={handleDrawerToggle}
							sx={{ mr: 2 }}
						>
							<i
								className="ri-menu-line"
								aria-hidden="true"
								style={{ fontSize: 22 }}
							/>
						</IconButton>
						<Box
							component={Link}
							href="/dashboard"
							sx={{
								flexGrow: 1,
								display: 'flex',
								alignItems: 'center',
								textDecoration: 'none',
							}}
						>
							<Logo height={28} />
						</Box>
						<Box>
							<UserButton
								appearance={{
									elements: {
										rootBox: {
											marginLeft: '8px',
										},
										userButtonAvatarBox: {
											width: '36px',
											height: '36px',
										},
									},
								}}
								userProfileMode="navigation"
								userProfileUrl="/settings"
								afterSignOutUrl="/"
							/>
						</Box>
					</Box>
				</Toolbar>
			</AppBar>
			<Drawer
				variant="temporary"
				open={mobileOpen}
				onClose={handleDrawerToggle}
				ModalProps={{
					keepMounted: true, // Better open performance on mobile.
				}}
				sx={{
					'& .MuiDrawer-paper': {
						boxSizing: 'border-box',
						width: DRAWER_WIDTH,
						top: '64px',
					},
				}}
			>
				<List>
					{allDesktopItems.map((item) => {
						const isActive = pathname.startsWith(item.href);
						return (
							<ListItem key={item.href} disablePadding>
								<ListItemButton
									component={Link}
									href={item.href}
									selected={isActive}
									onClick={handleDrawerToggle}
								>
									<ListItemIcon>{item.icon}</ListItemIcon>
									<ListItemText primary={item.label} />
								</ListItemButton>
							</ListItem>
						);
					})}
				</List>
			</Drawer>
		</>
	);
}

export function ResponsiveNav({ children }: ResponsiveNavProps) {
	const { isMobile, isTablet } = useResponsive();

	if (isMobile) {
		// Mobile: Top header with user button + bottom navigation
		return (
			<Box>
				<MobileHeader />
				<Box sx={{ pt: '56px' }}>
					{' '}
					{/* Account for mobile header height */}
					<Breadcrumbs />
				</Box>
				<Box sx={{ pb: 7 }}>{children}</Box>
				<MobileBottomNav />
			</Box>
		);
	}

	if (isTablet) {
		// Tablet: Top app bar with hamburger menu
		return (
			<Box sx={{ display: 'flex' }}>
				<TabletNav />
				<Box component="main" sx={{ flexGrow: 1, pt: 8 }}>
					<Breadcrumbs />
					<Box sx={{ px: 2 }}>{children}</Box>
				</Box>
			</Box>
		);
	}

	// Desktop: Horizontal top navigation
	return (
		<Box>
			<DesktopTopNav />
			<Box sx={{ pt: 8 }}>
				{' '}
				{/* Account for fixed AppBar height */}
				<Breadcrumbs />
			</Box>
			<Box
				component="main"
				sx={{
					px: { xs: 2, sm: 3, md: 4, lg: 6 },
					pb: 3,
					maxWidth: '1400px',
					mx: 'auto',
				}}
			>
				{children}
			</Box>
		</Box>
	);
}
