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
import { STAGE_COLORS } from '@/constants/garmentStages';

interface Service {
  name: string;
  completed: boolean;
}

interface ActiveGarmentItemProps {
  name: string;
  client: string;
  dueDate?: string;
  stage?: string;
  progress?: number;
  services?: Service[];
  priority?: boolean;
  onUpdateStatus?: () => void;
  onViewDetails?: () => void;
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
  name,
  client,
  dueDate,
  stage = 'In Progress',
  progress = 0,
  services = [],
  priority = false,
  onUpdateStatus,
  onViewDetails,
}: ActiveGarmentItemProps) {
  if (priority && services.length > 0) {
    // Priority item with full details
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: `2px solid ${alpha(refinedColors.warning, 0.3)}`,
          bgcolor: alpha(refinedColors.warning, 0.02),
          borderRadius: 2,
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
                {name}
              </Typography>
              {dueDate === 'Today' && (
                <Chip
                  label="Due Today"
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
              {client} • {dueDate === 'Today' ? 'Wedding guest' : dueDate}
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
                  {progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
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
            <Stack direction="row" spacing={1}>
              {services.map((service, index) => (
                <Chip
                  key={index}
                  icon={
                    service.completed ? (
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <CircleIcon sx={{ fontSize: 16 }} />
                    )
                  }
                  label={service.name}
                  size="small"
                  sx={
                    service.completed
                      ? {
                          bgcolor: alpha(refinedColors.success, 0.1),
                          color: refinedColors.success,
                        }
                      : {}
                  }
                  variant={service.completed ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Box>

          <Stack spacing={1}>
            <Button variant="contained" size="small" onClick={onUpdateStatus}>
              Update Status
            </Button>
            <Button variant="text" size="small" onClick={onViewDetails}>
              View Details
            </Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  // Regular item
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: '#ccc',
          bgcolor: alpha(
            refinedColors.stages[stage as keyof typeof refinedColors.stages] ||
              '#5c7f8e',
            0.02
          ),
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: refinedColors.text.secondary }}
          >
            {client} • Due {dueDate}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ minWidth: 100 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: '#e0e0e0',
              }}
            />
          </Box>
          <Chip
            label={stage}
            size="small"
            sx={{
              bgcolor: alpha(
                refinedColors.stages[
                  stage as keyof typeof refinedColors.stages
                ] || '#5c7f8e',
                0.2
              ),
              color:
                refinedColors.stages[
                  stage as keyof typeof refinedColors.stages
                ] || '#5c7f8e',
              fontWeight: 600,
            }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
