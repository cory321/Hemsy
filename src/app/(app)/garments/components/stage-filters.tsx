'use client';

import React from 'react';
import { Box, Button, Stack } from '@mui/material';

interface StageFiltersProps {
  selectedStage?: string;
  stageCounts: Record<string, number>;
  onChange: (stage?: string) => void;
}

const stages: string[] = ['New', 'In Progress', 'Ready For Pickup', 'Done'];

export default function StageFilters({
  selectedStage,
  stageCounts,
  onChange,
}: StageFiltersProps) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      <Button
        variant={!selectedStage ? 'contained' : 'outlined'}
        onClick={() => onChange(undefined)}
        data-testid="stage-filter-all"
      >
        All ({Object.values(stageCounts).reduce((a, b) => a + (b || 0), 0)})
      </Button>
      {stages.map((s) => (
        <Button
          key={s}
          variant={selectedStage === s ? 'contained' : 'outlined'}
          onClick={() => onChange(s)}
          data-testid={`stage-filter-${s.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {s} ({stageCounts[s] || 0})
        </Button>
      ))}
    </Stack>
  );
}
