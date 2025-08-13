'use client';

import React, { useTransition, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { updateGarmentStage } from '@/lib/actions/garment-stages';

interface StageOption {
  id: string;
  name: string;
  color?: string | null;
}

interface GarmentStageSelectorProps {
  garmentId: string;
  shopId: string;
  stages: StageOption[];
  currentStageId: string | null;
}

export default function GarmentStageSelector({
  garmentId,
  shopId,
  stages,
  currentStageId,
}: GarmentStageSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStageId, setSelectedStageId] = useState<string | ''>(
    currentStageId || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newStageId = event.target.value as string;
    setSelectedStageId(newStageId);

    setIsSaving(true);
    startTransition(async () => {
      try {
        await updateGarmentStage(shopId, garmentId, newStageId);
        router.refresh();
      } catch (e) {
        // swallow for now; could add snackbar
        console.error('Failed to update garment stage', e);
      } finally {
        setIsSaving(false);
      }
    });
  };

  return (
    <FormControl fullWidth size="small">
      <InputLabel id="garment-stage-label">Stage</InputLabel>
      <Select
        labelId="garment-stage-label"
        value={selectedStageId}
        label="Stage"
        onChange={handleChange}
        renderValue={(value) => {
          const stage = stages.find((s) => s.id === value);
          if (!stage) return 'Select stage';
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: stage.color || '#ccc',
                }}
              />
              {stage.name}
              {(isPending || isSaving) && (
                <CircularProgress size={14} sx={{ ml: 1 }} />
              )}
            </Box>
          );
        }}
      >
        {stages.map((stage) => (
          <MenuItem key={stage.id} value={stage.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: stage.color || '#ccc',
                }}
              />
              {stage.name}
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
