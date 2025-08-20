'use client';

import React from 'react';
import { Stack, Paper, Typography, Box, alpha } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { STAGE_COLORS } from '@/constants/garmentStages';

interface PipelineStage {
  stage: string;
  count: number;
  color: string;
}

interface PipelineOverviewProps {
  stages?: PipelineStage[];
  onStageClick?: (stage: string) => void;
}

const refinedColors = {
  text: {
    tertiary: '#999999',
  },
  stages: STAGE_COLORS,
};

const defaultStages: PipelineStage[] = [
  { stage: 'New', count: 5, color: refinedColors.stages.New },
  {
    stage: 'In Progress',
    count: 12,
    color: refinedColors.stages['In Progress'],
  },
  {
    stage: 'Pickup Ready',
    count: 8,
    color: refinedColors.stages['Ready For Pickup'],
  },
  {
    stage: 'Done',
    count: 3,
    color: refinedColors.stages.Done,
  },
];

export function PipelineOverview({
  stages = defaultStages,
  onStageClick,
}: PipelineOverviewProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        {stages.map((item, index, array) => (
          <React.Fragment key={item.stage}>
            <Paper
              onClick={() => onStageClick?.(item.stage)}
              sx={{
                p: 1.5,
                px: 2,
                textAlign: 'center',
                bgcolor: alpha(item.color, 0.08),
                border: `2px solid ${alpha(item.color, 0.3)}`,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: 1,
                maxWidth: '120px',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(item.color, 0.2)}`,
                  borderColor: item.color,
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: item.color, fontWeight: 700, mb: 0.25 }}
              >
                {item.count}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 500, display: 'block' }}
              >
                {item.stage}
              </Typography>
            </Paper>
            {index < array.length - 1 && (
              <ArrowForwardIcon
                sx={{
                  color: refinedColors.text.tertiary,
                  fontSize: 20,
                  mx: 0.5,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Stack>
    </Box>
  );
}
