'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
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
}

export default function TimeLogsDialog({
  open,
  onClose,
  garmentId,
  onChanged,
}: TimeLogsDialogProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [minutesInput, setMinutesInput] = useState<string>('');

  async function refresh() {
    const list = await getTimeEntriesForGarment(garmentId);
    setEntries(list);
  }

  useEffect(() => {
    if (open) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, garmentId]);

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setMinutesInput(String(entry.minutes));
  };

  const saveEdit = async () => {
    const mins = parseInt(minutesInput, 10);
    if (!editingId || !mins || mins <= 0) return;
    await updateTimeEntry(editingId, mins);
    setEditingId(null);
    setMinutesInput('');
    await refresh();
    onChanged?.();
  };

  const handleDelete = async (id: string) => {
    await deleteTimeEntry(id);
    await refresh();
    onChanged?.();
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
                    secondary={`${e.minutes} min • ${new Date(e.logged_at).toLocaleString()}`}
                  />
                  <Stack direction="row" gap={1}>
                    {editingId === e.id ? (
                      <Stack direction="row" gap={1} alignItems="center">
                        <TextField
                          size="small"
                          type="number"
                          label="Minutes"
                          value={minutesInput}
                          onChange={(ev) => setMinutesInput(ev.target.value)}
                          inputProps={{ min: 1, style: { width: 90 } }}
                        />
                        <Button
                          onClick={saveEdit}
                          variant="contained"
                          size="small"
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
                          onClick={() => startEdit(e)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          aria-label="delete"
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
