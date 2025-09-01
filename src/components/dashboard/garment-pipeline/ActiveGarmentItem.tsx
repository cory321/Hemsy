'use client';

import {
  Paper,
  Stack,
  Box,
  Typography,
  Chip,
  Button,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { STAGE_COLORS } from '@/constants/garmentStages';
import {
  getDetailedDueDateDisplay,
  isGarmentDueDateUrgent,
} from '@/lib/utils/date-time-utils';
import type { ActiveGarment } from '@/lib/actions/dashboard';

interface ActiveGarmentItemProps {
  garment: ActiveGarment;
  priority?: boolean;
  onUpdateStatus?: () => void;
}

const refinedColors = {
  warning: '#F3C164',
  success: '#5A736C',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
  stages: STAGE_COLORS,
};

export function ActiveGarmentItem({
  garment,
  priority = false,
  onUpdateStatus,
}: ActiveGarmentItemProps) {
  const router = useRouter();

  // Get formatted due date display with detailed info
  const dueDateDisplay = getDetailedDueDateDisplay(garment.due_date);
  const isDueDateUrgent = isGarmentDueDateUrgent(garment.due_date);
  if (priority && garment.services.length > 0) {
    // Priority item with full details
    return (
      <Paper
        elevation={0}
        onClick={(e) => {
          // Only navigate if the click wasn't on the button
          if (
            (e.target as HTMLElement).tagName !== 'BUTTON' &&
            !(e.target as HTMLElement).closest('button')
          ) {
            router.push(`/garments/${garment.id}`);
          }
        }}
        sx={{
          p: 3,
          border: `2px solid ${alpha(refinedColors.warning, 0.3)}`,
          bgcolor: alpha(refinedColors.warning, 0.05),
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: alpha(refinedColors.warning, 0.5),
            bgcolor: alpha(refinedColors.warning, 0.08),
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="start"
        >
          <Box sx={{ flex: 1 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ mb: 1 }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {garment.name}
              </Typography>
              {isDueDateUrgent && (
                <Chip
                  label={dueDateDisplay}
                  size="small"
                  sx={{
                    bgcolor: refinedColors.warning,
                    color: 'white',
                    fontWeight: 600,
                    height: 24,
                  }}
                />
              )}
            </Stack>
            <Typography
              variant="body2"
              sx={{ color: refinedColors.text.secondary, mb: 2 }}
            >
              {garment.client_name} • {dueDateDisplay}
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: refinedColors.text.secondary }}
                >
                  Progress
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {garment.progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={garment.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(refinedColors.warning, 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: refinedColors.warning,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Service Checklist */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {garment.services.map((service) => (
                <Chip
                  key={service.id}
                  icon={
                    service.is_done ? (
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <CircleIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  label={service.name}
                  size="small"
                  sx={
                    service.is_done
                      ? {
                          bgcolor: alpha(refinedColors.success, 0.1),
                          color: refinedColors.success,
                        }
                      : {}
                  }
                  variant={service.is_done ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Paper>
    );
  }

  // Regular item - styled to match ReadyForPickupItem
  const stageColor =
    refinedColors.stages[garment.stage as keyof typeof refinedColors.stages] ||
    '#5c7f8e';

  // Get appropriate icon based on stage
  const stageIcon =
    garment.stage === 'Ready For Pickup' ? (
      <CheckCircleIcon
        sx={{
          fontSize: 18,
          color: stageColor,
        }}
      />
    ) : (
      <CircleIcon
        sx={{
          fontSize: 18,
          color: stageColor,
        }}
      />
    );

  return (
    <Paper
      elevation={0}
      onClick={() => router.push(`/garments/${garment.id}`)}
      sx={{
        p: 2,
        border: `1px solid ${alpha(stageColor, 0.3)}`,
        bgcolor: alpha(stageColor, 0.05),
        borderRadius: 1.5,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: alpha(stageColor, 0.5),
          bgcolor: alpha(stageColor, 0.08),
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {stageIcon}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {garment.name}
            </Typography>
          </Stack>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.5,
              ml: 3.25, // Align with text after icon
            }}
          >
            {garment.client_name} • {dueDateDisplay}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.5,
            py: 0.5,
            bgcolor: alpha(stageColor, 0.15),
            borderRadius: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: stageColor,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          >
            {garment.stage.toUpperCase()}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
