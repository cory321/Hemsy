'use client';

import React from 'react';
import { Stack, Paper, Typography, Box, alpha } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { STAGE_COLORS } from '@/constants/garmentStages';

interface PipelineOverviewProps {
  stageCounts: Record<string, number>;
  onStageClick?: (stage: string) => void;
}

const refinedColors = {
  text: {
    tertiary: '#999999',
  },
  stages: STAGE_COLORS,
};

const PIPELINE_STAGES = [
  { name: 'New', displayName: 'New' },
  { name: 'In Progress', displayName: 'In Progress' },
  { name: 'Ready For Pickup', displayName: 'Pickup Ready' },
  { name: 'Done', displayName: 'Done' },
];

export function PipelineOverview({
  stageCounts,
  onStageClick,
}: PipelineOverviewProps) {
  // Build stages array from stageCounts
  const stages = PIPELINE_STAGES.map((stage) => ({
    stage: stage.name,
    displayName: stage.displayName,
    count: stageCounts[stage.name] || 0,
    color:
      refinedColors.stages[stage.name as keyof typeof refinedColors.stages] ||
      '#5c7f8e',
  }));

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
                {item.displayName}
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
