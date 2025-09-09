'use client';

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
// Using Remix icons for leading icons; keep MUI Chevron for secondary action or swap to Remix for consistency
// import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';

export default function MorePage() {
  const { signOut } = useClerk();
  function RemixIcon({ name, size = 22 }: { name: string; size?: number }) {
    return (
      <i
        className={`ri ${name}`}
        style={{ fontSize: size }}
        aria-hidden="true"
      />
    );
  }
  const menuItems = [
    {
      title: 'Services',
      description: 'Manage your alteration services',
      icon: <RemixIcon name="ri-pencil-ruler-line" />,
      href: '/services',
    },
    {
      title: 'Invoices',
      description: 'View and manage invoices',
      icon: <RemixIcon name="ri-money-dollar-circle-line" />,
      href: '/invoices',
    },
    {
      title: 'Settings',
      description: 'Business info and preferences',
      icon: <RemixIcon name="ri-settings-5-line" />,
      href: '/settings',
    },
  ];

  const supportItems = [
    {
      title: 'Help & Support',
      icon: <RemixIcon name="ri-question-line" />,
      href: '/help',
    },
    {
      title: 'Sign Out',
      icon: <RemixIcon name="ri-logout-box-r-line" />,
      onClick: () => signOut({ redirectUrl: '/' }),
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
              secondaryAction={
                <i
                  className="ri-arrow-right-s-line"
                  aria-hidden="true"
                  style={{ color: 'var(--mui-palette-action-active)' }}
                />
              }
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
              key={item.title}
              component={item.href ? Link : 'div'}
              href={item.href}
              onClick={item.onClick}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                cursor: 'pointer',
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
