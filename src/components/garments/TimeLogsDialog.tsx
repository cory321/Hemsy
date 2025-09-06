'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import {
  getTimeEntriesForGarment,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/lib/actions/garment-time-entries';

interface TimeLogsDialogProps {
  open: boolean;
  onClose: () => void;
  garmentId: string;
  onChanged?: () => void;
  orderStatus?: string | undefined;
}

export default function TimeLogsDialog({
  open,
  onClose,
  garmentId,
  onChanged,
  orderStatus,
}: TimeLogsDialogProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHoursInput, setEditHoursInput] = useState<string>('');
  const [editMinutesInput, setEditMinutesInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const isOrderCancelled = orderStatus === 'cancelled';

  async function refresh() {
    try {
      const list = await getTimeEntriesForGarment(garmentId);
      setEntries(list);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      setEntries([]);
    }
  }

  useEffect(() => {
    if (open) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, garmentId]);

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    const hrs = Math.floor((entry.minutes || 0) / 60);
    const mins = (entry.minutes || 0) % 60;
    setEditHoursInput(String(hrs || ''));
    setEditMinutesInput(String(mins || ''));
  };

  const saveEdit = async () => {
    const minsCombined =
      (parseInt(editHoursInput || '0', 10) || 0) * 60 +
      (parseInt(editMinutesInput || '0', 10) || 0);
    const mins = isNaN(minsCombined) ? 0 : minsCombined;
    if (!editingId || !mins || mins <= 0) return;

    try {
      setIsSaving(true);
      await updateTimeEntry(editingId, mins);
      setEditingId(null);
      setEditHoursInput('');
      setEditMinutesInput('');
      await refresh();
      onChanged?.();
    } catch (error) {
      console.error('Failed to update time entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTimeEntry(id);
      await refresh();
      onChanged?.();
    } catch (error) {
      console.error('Failed to delete time entry:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Time Logs
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {entries.length === 0 ? (
          <Typography color="text.secondary">No time entries yet.</Typography>
        ) : (
          <List dense>
            {entries.map((e) => {
              return (
                <ListItem
                  key={e.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  <ListItemText
                    primary={`${e.service_name}`}
                    secondary={`${formatMinutesHM(e.minutes)} • ${new Date(e.logged_at).toLocaleString()}`}
                  />
                  <Stack direction="row" gap={1}>
                    {editingId === e.id ? (
                      <Stack direction="row" gap={1} alignItems="center">
                        <TextField
                          size="small"
                          type="number"
                          label="Hours"
                          value={editHoursInput}
                          onChange={(ev) => setEditHoursInput(ev.target.value)}
                          inputProps={{ min: 0, style: { width: 90 } }}
                        />
                        <TextField
                          size="small"
                          type="number"
                          label="Minutes"
                          value={editMinutesInput}
                          onChange={(ev) =>
                            setEditMinutesInput(ev.target.value)
                          }
                          inputProps={{ min: 0, max: 59, style: { width: 90 } }}
                        />
                        <Button
                          onClick={saveEdit}
                          variant="contained"
                          size="small"
                          disabled={isSaving}
                          startIcon={
                            isSaving ? (
                              <CircularProgress size={14} />
                            ) : undefined
                          }
                        >
                          Save
                        </Button>
                        <Button onClick={() => setEditingId(null)} size="small">
                          Cancel
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction="row" gap={1}>
                        <IconButton
                          aria-label="edit"
                          disabled={isOrderCancelled}
                          title={
                            isOrderCancelled
                              ? 'Cannot edit time entries for cancelled orders'
                              : undefined
                          }
                          onClick={() => startEdit(e)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
                          disabled={isOrderCancelled}
                          title={
                            isOrderCancelled
                              ? 'Cannot delete time entries for cancelled orders'
                              : undefined
                          }
                          onClick={() => handleDelete(e.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    )}
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
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
