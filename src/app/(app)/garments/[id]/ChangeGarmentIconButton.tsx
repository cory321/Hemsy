'use client';

import { useState, useTransition } from 'react';
import { Button, Alert, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import PresetGarmentIconModal, {
  PresetGarmentIconModalResult,
} from '@/components/orders/PresetGarmentIconModal';
import { updateGarment } from '@/lib/actions/garments';

export default function ChangeGarmentIconButton({
  garmentId,
  initialKey,
  initialFill,
}: {
  garmentId: string;
  initialKey: string | null;
  initialFill: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (result: PresetGarmentIconModalResult) => {
    setError(null);
    startTransition(async () => {
      const res = await updateGarment({
        garmentId,
        updates: {
          presetIconKey: result.presetIconKey || null,
          presetFillColor: result.presetFillColor || null,
        },
      });
      if (!res.success) {
        setError(res.error || 'Failed to update garment icon');
        return;
      }
      router.refresh();
    });
  };

  return (
    <Box>
      <Button
        variant="outlined"
        fullWidth
        onClick={() => setOpen(true)}
        disabled={isPending}
        aria-label="Change Garment Icon"
      >
        Change Icon
      </Button>
      {error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      ) : null}
      <PresetGarmentIconModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={(r) => {
          handleSave(r);
          setOpen(false);
        }}
        initialKey={initialKey || undefined}
        initialFill={initialFill || undefined}
      />
    </Box>
  );
}
