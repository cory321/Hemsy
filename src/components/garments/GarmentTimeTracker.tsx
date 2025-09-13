'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import TimeLogsDialog from '@/components/garments/TimeLogsDialog';
import {
  getTimeEntriesForGarment,
  getTotalTimeForGarment,
  addTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/lib/actions/garment-time-entries';
import { useGarment } from '@/contexts/GarmentContext';

interface GarmentTimeTrackerProps {
  garmentId: string;
  services: { id: string; name: string }[];
}

export default function GarmentTimeTracker({
  garmentId,
  services,
}: GarmentTimeTrackerProps) {
  const { garment } = useGarment();
  const isGarmentDone = garment?.stage === 'Done';
  const isOrderCancelled = garment?.order?.status === 'cancelled';

  const [entries, setEntries] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [hoursInput, setHoursInput] = useState<string>('');
  const [minutesInput, setMinutesInput] = useState<string>('');
  const [editHoursInput, setEditHoursInput] = useState<string>('');
  const [editMinutesInput, setEditMinutesInput] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Validation error states
  const [serviceError, setServiceError] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');
  const serviceSelectRef = useRef<HTMLSelectElement>(null);

  // Delete loading state
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  // Clear errors when dialog opens
  const handleOpenAddDialog = () => {
    setIsAddOpen(true);
    setServiceError('');
    setTimeError('');
  };

  // Clear errors when fields change
  const handleServiceChange = (value: string) => {
    setSelectedServiceId(value);
    if (serviceError) {
      setServiceError('');
    }
  };

  const handleHoursChange = (value: string) => {
    setHoursInput(value);
    if (timeError) {
      setTimeError('');
    }
  };

  const handleMinutesChange = (value: string) => {
    setMinutesInput(value);
    if (timeError) {
      setTimeError('');
    }
  };

  async function refresh() {
    try {
      const [list, total] = await Promise.all([
        getTimeEntriesForGarment(garmentId),
        getTotalTimeForGarment(garmentId),
      ]);
      setEntries(list);
      setTotalMinutes(total);
    } catch (error) {
      console.error('Failed to refresh time entries:', error);
      setEntries([]);
      setTotalMinutes(0);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentId]);

  // Total time will be displayed in hours and minutes via formatMinutesHM

  const handleAdd = async () => {
    // Clear previous errors
    setServiceError('');
    setTimeError('');

    // Validate service selection
    if (!selectedServiceId) {
      setServiceError('Please select a service');
      // Focus on the service field
      setTimeout(() => {
        serviceSelectRef.current?.focus();
      }, 100);
      return;
    }

    // Validate time input
    const hours = parseInt(hoursInput || '0', 10) || 0;
    const minutes = parseInt(minutesInput || '0', 10) || 0;
    const minsCombined = hours * 60 + minutes;
    const totalMins = isNaN(minsCombined) ? 0 : minsCombined;

    if (totalMins <= 0) {
      setTimeError('Please enter some amount of time (hours or minutes)');
      return;
    }

    try {
      setIsSavingAdd(true);
      await addTimeEntry(selectedServiceId, totalMins);
      setIsAddOpen(false);
      setSelectedServiceId('');
      setHoursInput('');
      setMinutesInput('');
      setServiceError('');
      setTimeError('');
      await refresh();
    } catch (error) {
      console.error('Failed to add time entry:', error);
    } finally {
      setIsSavingAdd(false);
    }
  };

  const handleEdit = async () => {
    const minsCombined =
      (parseInt(editHoursInput || '0', 10) || 0) * 60 +
      (parseInt(editMinutesInput || '0', 10) || 0);
    const mins = isNaN(minsCombined) ? 0 : minsCombined;
    if (!editingEntry?.id || !mins || mins <= 0) return;

    try {
      setIsSavingEdit(true);
      await updateTimeEntry(editingEntry.id, mins);
      setIsEditOpen(false);
      setEditingEntry(null);
      setEditHoursInput('');
      setEditMinutesInput('');
      await refresh();
    } catch (error) {
      console.error('Failed to update time entry:', error);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      setDeletingEntryId(entryId);
      await deleteTimeEntry(entryId);
      await refresh();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    } finally {
      setDeletingEntryId(null);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" gap={1}>
            <AccessTimeIcon color="action" />
            <Typography variant="h6">Time Tracking</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="body2">
              Total: {formatMinutesHM(totalMinutes)}
            </Typography>
            <Button
              startIcon={<ReceiptLongIcon />}
              onClick={() => setLogsOpen(true)}
            >
              View Logs
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={handleOpenAddDialog}
              disabled={isGarmentDone || isOrderCancelled}
              title={
                isOrderCancelled
                  ? 'Cannot track time for cancelled orders'
                  : isGarmentDone
                    ? 'Cannot track time for completed garments'
                    : undefined
              }
            >
              Add Time
            </Button>
          </Stack>
        </Stack>

        {isGarmentDone ? (
          <Typography color="text.secondary">
            Time tracking is disabled for completed garments.
          </Typography>
        ) : entries.length === 0 ? (
          <Typography color="text.secondary">No time entries yet.</Typography>
        ) : (
          <List dense>
            {entries.map((e) => (
              <ListItem
                key={e.id}
                secondaryAction={
                  <Stack direction="row" gap={1}>
                    <IconButton
                      aria-label="edit"
                      disabled={isGarmentDone || isOrderCancelled}
                      title={
                        isOrderCancelled
                          ? 'Cannot edit time entries for cancelled orders'
                          : isGarmentDone
                            ? 'Cannot edit time entries for completed garments'
                            : undefined
                      }
                      onClick={() => {
                        setEditingEntry(e);
                        const hrs = Math.floor((e.minutes || 0) / 60);
                        const mins = (e.minutes || 0) % 60;
                        setEditHoursInput(String(hrs || ''));
                        setEditMinutesInput(String(mins || ''));
                        setIsEditOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      disabled={
                        isGarmentDone ||
                        isOrderCancelled ||
                        deletingEntryId === e.id
                      }
                      title={
                        isOrderCancelled
                          ? 'Cannot delete time entries for cancelled orders'
                          : isGarmentDone
                            ? 'Cannot delete time entries for completed garments'
                            : deletingEntryId === e.id
                              ? 'Deleting...'
                              : undefined
                      }
                      onClick={() => handleDelete(e.id)}
                    >
                      {deletingEntryId === e.id ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={`${e.service_name}`}
                  secondary={`${formatMinutesHM(e.minutes)} • ${new Date(e.logged_at).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>

      {/* Add Dialog */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        fullWidth
        maxWidth="xs"
        disableScrollLock
      >
        <DialogTitle>
          Add Time
          <IconButton
            aria-label="close"
            onClick={() => setIsAddOpen(false)}
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
        <DialogContent>
          <TextField
            fullWidth
            select
            SelectProps={{
              native: true,
              inputRef: serviceSelectRef,
            }}
            label="Service"
            value={selectedServiceId}
            onChange={(e) => handleServiceChange(e.target.value)}
            error={!!serviceError}
            helperText={serviceError}
            sx={{ mt: 1 }}
          >
            <option value="" />
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </TextField>
          <Stack direction="row" gap={2} sx={{ mt: 2 }}>
            <TextField
              type="number"
              label="Hours"
              value={hoursInput}
              onChange={(e) => handleHoursChange(e.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
              error={!!timeError}
            />
            <TextField
              type="number"
              label="Minutes"
              value={minutesInput}
              onChange={(e) => handleMinutesChange(e.target.value)}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
              error={!!timeError}
              helperText={timeError}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            disabled={isSavingAdd}
            startIcon={isSavingAdd ? <CircularProgress size={16} /> : undefined}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Edit Time Entry
          <IconButton
            aria-label="close"
            onClick={() => setIsEditOpen(false)}
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
        <DialogContent>
          <Stack direction="row" gap={2} sx={{ mt: 1 }}>
            <TextField
              type="number"
              label="Hours"
              value={editHoursInput}
              onChange={(e) => setEditHoursInput(e.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
            />
            <TextField
              type="number"
              label="Minutes"
              value={editMinutesInput}
              onChange={(e) => setEditMinutesInput(e.target.value)}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEdit}
            variant="contained"
            disabled={isSavingEdit}
            startIcon={
              isSavingEdit ? <CircularProgress size={16} /> : undefined
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logs Dialog */}
      <TimeLogsDialog
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        garmentId={garmentId}
        onChanged={refresh}
        orderStatus={garment?.order?.status}
      />
    </Card>
  );
}

function formatMinutesHM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts = [] as string[];
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}
