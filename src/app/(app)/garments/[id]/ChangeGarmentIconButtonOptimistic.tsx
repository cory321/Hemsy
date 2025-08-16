'use client';

import { useState } from 'react';
import { Button, Box } from '@mui/material';
import PresetGarmentIconModal, {
  PresetGarmentIconModalResult,
} from '@/components/orders/PresetGarmentIconModal';
import { useGarment } from '@/contexts/GarmentContext';

export default function ChangeGarmentIconButtonOptimistic() {
  const { garment, updateGarmentIcon } = useGarment();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (result: PresetGarmentIconModalResult) => {
    setLoading(true);
    setOpen(false);

    // Optimistic update happens inside updateGarmentIcon
    await updateGarmentIcon(
      result.presetIconKey || null,
      result.presetFillColor || null
    );

    setLoading(false);
  };

  return (
    <Box>
      <Button
        variant="outlined"
        fullWidth
        onClick={() => setOpen(true)}
        disabled={loading}
        aria-label="Change Garment Icon"
      >
        Change Icon
      </Button>

      <PresetGarmentIconModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        initialKey={garment.preset_icon_key || undefined}
        initialFill={garment.preset_fill_color || undefined}
      />
    </Box>
  );
}
