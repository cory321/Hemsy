'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { updateGarment } from '@/lib/actions/garments';
import { useRouter } from 'next/navigation';
// Icon change is now handled on the garment page left column

interface GarmentEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  garment: {
    id: string;
    name: string;
    due_date: string | null;
    event_date: string | null;
    preset_icon_key: string | null;
    preset_fill_color: string | null;
    notes: string | null;
  };
}

export default function GarmentEditDialog({
  open,
  onClose,
  onSuccess,
  garment,
}: GarmentEditDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Icon picker removed from this dialog

  const [formData, setFormData] = useState({
    name: garment.name,
    dueDate: garment.due_date || '',
    eventDate: garment.event_date || '',
    presetIconKey: garment.preset_icon_key || '',
    presetFillColor: garment.preset_fill_color || '#D6C4F2',
    notes: garment.notes || '',
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateGarment({
        garmentId: garment.id,
        updates: {
          name: formData.name,
          dueDate: formData.dueDate || null,
          eventDate: formData.eventDate || null,
          presetIconKey: formData.presetIconKey || null,
          presetFillColor: formData.presetFillColor || null,
          notes: formData.notes || null,
        },
      });

      if (result.success) {
        onClose();
        router.refresh();
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to update garment');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // No icon select handler needed anymore

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'background.paper',
            color: 'text.primary',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6">Edit Garment</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Garment Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              fullWidth
              required
            />

            {/* Icon change moved out of this dialog */}

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Event Date"
              type="date"
              value={formData.eventDate}
              onChange={(e) =>
                setFormData({ ...formData, eventDate: e.target.value })
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Optional: Date of the event this garment is for"
            />

            <TextField
              label="Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name}
          >
            {loading ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Icon picker removed */}
    </>
  );
}
