'use client';

import { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from '@mui/material';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Threadfolio
            </Link>
          </Typography>
          <Button color="inherit" component={Link} href="/features">
            Features
          </Button>
          <Button color="inherit" component={Link} href="/pricing">
            Pricing
          </Button>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
            <>
              <SignedIn>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  href="/dashboard"
                >
                  Go to Dashboard
                </Button>
              </SignedIn>
              <SignedOut>
                <Button color="inherit" component={Link} href="/sign-in">
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={Link}
                  href="/sign-up"
                >
                  Get Started
                </Button>
              </SignedOut>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} href="/sign-in">
                Sign In
              </Button>
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                href="/sign-up"
              >
                Get Started
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ minHeight: '100vh' }}>
        {children}
      </Box>
      <Box
        component="footer"
        sx={{ bgcolor: 'background.paper', py: 6, mt: 'auto' }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Threadfolio. All rights reserved.
            {' | '}
            <Link href="/privacy">Privacy Policy</Link>
            {' | '}
            <Link href="/terms">Terms of Service</Link>
            {' | '}
            <Link href="/contact">Contact</Link>
          </Typography>
        </Container>
      </Box>
    </>
  );
}
