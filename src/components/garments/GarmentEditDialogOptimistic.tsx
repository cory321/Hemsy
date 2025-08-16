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
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useGarment } from '@/contexts/GarmentContext';

interface GarmentEditDialogOptimisticProps {
  open: boolean;
  onClose: () => void;
}

export default function GarmentEditDialogOptimistic({
  open,
  onClose,
}: GarmentEditDialogOptimisticProps) {
  const { garment, updateGarmentOptimistic } = useGarment();
  const [loading, setLoading] = useState(false);
  const [dateValidationError, setDateValidationError] = useState('');

  const [formData, setFormData] = useState({
    name: garment.name,
    dueDate: garment.due_date || '',
    eventDate: garment.event_date || '',
    notes: garment.notes || '',
    specialEvent: !!garment.event_date, // If there's an event date, special event is checked
  });

  // Reset form data when garment changes
  useState(() => {
    setFormData({
      name: garment.name,
      dueDate: garment.due_date || '',
      eventDate: garment.event_date || '',
      notes: garment.notes || '',
      specialEvent: !!garment.event_date,
    });
  });

  const handleSubmit = async () => {
    // Clear any validation errors
    if (dateValidationError) {
      return;
    }

    setLoading(true);

    // Close dialog immediately for better UX
    onClose();

    // Optimistic update happens inside updateGarmentOptimistic
    await updateGarmentOptimistic({
      name: formData.name,
      due_date: formData.dueDate || null,
      event_date: formData.specialEvent ? formData.eventDate || null : null,
      notes: formData.notes || null,
    });

    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {dateValidationError && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {dateValidationError}
            </Alert>
          )}

          <TextField
            label="Garment Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
          />

          <DatePicker
            label="Due Date"
            value={formData.dueDate ? dayjs(formData.dueDate) : null}
            format="dddd, MMMM D, YYYY"
            onChange={(newValue) => {
              if (!newValue) {
                setFormData({ ...formData, dueDate: '' });
                setDateValidationError('');
                return;
              }
              const dueDate = dayjs.isDayjs(newValue)
                ? newValue.startOf('day').format('YYYY-MM-DD')
                : '';

              // Validate event date if special event is checked
              if (formData.specialEvent && formData.eventDate) {
                const eventDateObj = dayjs(formData.eventDate);
                if (eventDateObj.isBefore(newValue)) {
                  setDateValidationError(
                    'Event date cannot be before the due date.'
                  );
                } else {
                  setDateValidationError('');
                }
              }

              setFormData({ ...formData, dueDate });
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.specialEvent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    specialEvent: checked,
                    eventDate: checked ? formData.eventDate : '',
                  });
                  if (!checked) {
                    setDateValidationError('');
                  }
                }}
                color="primary"
              />
            }
            label="Special Event"
          />

          {formData.specialEvent && (
            <DatePicker
              label="Event Date"
              value={formData.eventDate ? dayjs(formData.eventDate) : null}
              format="dddd, MMMM D, YYYY"
              onChange={(newValue) => {
                if (!newValue) {
                  setFormData({ ...formData, eventDate: '' });
                  setDateValidationError('');
                  return;
                }
                const eventDate = dayjs.isDayjs(newValue)
                  ? newValue.startOf('day').format('YYYY-MM-DD')
                  : '';

                // Validate that event date is not before due date
                if (formData.dueDate) {
                  const dueDateObj = dayjs(formData.dueDate);
                  if (newValue.isBefore(dueDateObj)) {
                    setDateValidationError(
                      'Event date cannot be before the due date.'
                    );
                  } else {
                    setDateValidationError('');
                  }
                }

                setFormData({ ...formData, eventDate });
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  helperText: 'Date of the event this garment is for',
                },
              }}
            />
          )}

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
          disabled={loading || !formData.name || !!dateValidationError}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
