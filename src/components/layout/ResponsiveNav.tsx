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

// Icons
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MenuIcon from '@mui/icons-material/Menu';
import BuildIcon from '@mui/icons-material/Build';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

// Navigation items configuration
const navItems = [
  { label: 'Home', href: '/dashboard', icon: <HomeIcon />, showInBottom: true },
  {
    label: 'Clients',
    href: '/clients',
    icon: <PeopleIcon />,
    showInBottom: true,
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: <ReceiptIcon />,
    showInBottom: true,
  },
  {
    label: 'Garments',
    href: '/garments',
    icon: <CheckroomIcon />,
    showInBottom: true,
  },
  {
    label: 'Calendar',
    href: '/appointments',
    icon: <CalendarMonthIcon />,
    showInBottom: true,
  },
  { label: 'More', href: '/more', icon: <MoreHorizIcon />, showInBottom: true },
];

// Additional items that only show in desktop navigation
const desktopOnlyItems = [
  { label: 'Services', href: '/services', icon: <BuildIcon /> },
  { label: 'Invoices', href: '/invoices', icon: <DescriptionIcon /> },
  { label: 'Settings', href: '/settings', icon: <SettingsIcon /> },
];

const DRAWER_WIDTH = 240; // Used for tablet drawer

interface ResponsiveNavProps {
  children: ReactNode;
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
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ mr: 4 }}>
          Threadfolio
        </Typography>
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
                  color: 'white',
                  mx: 0.5,
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  backgroundColor: isActive
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'transparent',
                  borderBottom: isActive
                    ? '2px solid white'
                    : '2px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {item.label}
              </Button>
            );
          })}
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
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Threadfolio
          </Typography>
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
    // Mobile: Bottom navigation only
    return (
      <Box sx={{ pb: 7 }}>
        {children}
        <MobileBottomNav />
      </Box>
    );
  }

  if (isTablet) {
    // Tablet: Top app bar with hamburger menu
    return (
      <Box sx={{ display: 'flex' }}>
        <TabletNav />
        <Box component="main" sx={{ flexGrow: 1, pt: 8, px: 2 }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Desktop: Horizontal top navigation
  return (
    <Box>
      <DesktopTopNav />
      <Box
        component="main"
        sx={{
          pt: 10, // Account for AppBar height
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
