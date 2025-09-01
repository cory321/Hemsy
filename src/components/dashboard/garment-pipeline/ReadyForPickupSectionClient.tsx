'use client';

import { Box, Stack, Typography, Paper, Button, alpha } from '@mui/material';
import { LocalShipping as LocalShippingIcon } from '@mui/icons-material';
import { ReadyForPickupItem } from './ReadyForPickupItem';
import { useRouter } from 'next/navigation';
import { STAGE_COLORS } from '@/constants/garmentStages';
import type { ActiveGarment } from '@/lib/actions/dashboard';

interface ReadyForPickupSectionClientProps {
  garments: ActiveGarment[];
  totalCount: number;
}

const PICKUP_COLOR = STAGE_COLORS['Ready For Pickup']; // #BD8699

export function ReadyForPickupSectionClient({
  garments,
  totalCount,
}: ReadyForPickupSectionClientProps) {
  const router = useRouter();

  const handleViewAll = () => {
    // Navigate to garments page with Ready For Pickup filter
    router.push('/garments?stage=Ready%20For%20Pickup');
  };

  // Don't render the section if there are no garments ready for pickup
  if (totalCount === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${alpha(PICKUP_COLOR, 0.2)}`,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: alpha(PICKUP_COLOR, 0.15),
            }}
          >
            <LocalShippingIcon
              sx={{
                fontSize: 20,
                color: PICKUP_COLOR,
              }}
            />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ready For Pickup
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {totalCount} garment{totalCount !== 1 ? 's' : ''} ready for
              customer pickup
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="text"
          size="small"
          onClick={handleViewAll}
          sx={{
            color: PICKUP_COLOR,
            '&:hover': {
              bgcolor: alpha(PICKUP_COLOR, 0.08),
            },
          }}
        >
          View All
        </Button>
      </Stack>

      <Stack spacing={1.5}>
        {garments.map((garment) => (
          <ReadyForPickupItem key={garment.id} garment={garment} />
        ))}
      </Stack>

      {totalCount > 3 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontStyle: 'italic' }}
          >
            Showing latest 3 of {totalCount} garments • Click &ldquo;View
            All&rdquo; to see more
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
