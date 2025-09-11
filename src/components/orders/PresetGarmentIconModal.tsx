'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import PresetGarmentIconPicker from './PresetGarmentIconPicker';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { PastelColorPicker } from '@/components/ui/PastelColorPicker';
import { getPresetIconUrl } from '@/utils/presetIcons';

export type PresetGarmentIconModalResult = {
  presetIconKey?: string | undefined;
  presetFillColor?: string | undefined;
};

export default function PresetGarmentIconModal({
  open,
  onClose,
  onSave,
  initialKey,
  initialFill,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (result: PresetGarmentIconModalResult) => void;
  initialKey?: string | undefined;
  initialFill?: string | undefined;
}) {
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    initialKey
  );
  const [fill, setFill] = useState<string | undefined>(initialFill);

  // Reset when reopened with different initial values
  useMemo(() => {
    if (!open) return;
    setSelectedKey(initialKey);
    setFill(initialFill);
  }, [open, initialKey, initialFill]);

  const url = selectedKey ? getPresetIconUrl(selectedKey) : null;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // If user clicks backdrop or presses Escape, auto-save current selection if any
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          if (selectedKey) {
            onSave({ presetIconKey: selectedKey, presetFillColor: fill });
          }
        }
        onClose();
      }}
      fullWidth
      maxWidth="lg"
      disableScrollLock
    >
      <DialogTitle>
        Choose Garment Icon
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <PresetGarmentIconPicker
              {...(selectedKey ? { value: selectedKey } : {})}
              onChange={(key) => setSelectedKey(key)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  position: 'relative',
                }}
              >
                {url ? (
                  <InlinePresetSvg
                    src={url}
                    {...(fill ? { fillColor: fill } : {})}
                  />
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Select an icon to preview
                  </Typography>
                )}
              </Box>
              <div>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Color
                </Typography>
                <PastelColorPicker
                  value={fill || ''}
                  onChange={(hex) => setFill(hex || undefined)}
                  includeNone
                />
              </div>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedKey}
          onClick={() => {
            onSave({
              presetIconKey: selectedKey,
              presetFillColor: fill,
            });
            onClose();
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
