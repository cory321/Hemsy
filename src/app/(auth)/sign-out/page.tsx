'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, CircularProgress } from '@mui/material';

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut(() => {
          // Redirect to home page after signing out
          router.push('/');
        });
      } catch (error) {
        console.error('Error signing out:', error);
        // Still redirect even if there's an error
        router.push('/');
      }
    };

    performSignOut();
  }, [signOut, router]);

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="h6" color="text.secondary">
          Signing you out...
        </Typography>
      </Box>
    </Container>
  );
}
