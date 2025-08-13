'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
import {
  addTimeEntry,
  deleteTimeEntry,
  getTimeEntriesForGarment,
  getTotalTimeForGarment,
  updateTimeEntry,
} from '@/lib/actions/garment-time-entries';
import TimeLogsDialog from '@/components/garments/TimeLogsDialog';

interface GarmentTimeTrackerProps {
  garmentId: string;
  services: { id: string; name: string }[];
}

export default function GarmentTimeTracker({
  garmentId,
  services,
}: GarmentTimeTrackerProps) {
  const [entries, setEntries] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [hoursInput, setHoursInput] = useState<string>('');
  const [minutesInput, setMinutesInput] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [logsOpen, setLogsOpen] = useState(false);

  async function refresh() {
    const [list, total] = await Promise.all([
      getTimeEntriesForGarment(garmentId),
      getTotalTimeForGarment(garmentId),
    ]);
    setEntries(list);
    setTotalMinutes(total);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garmentId]);

  const totalHours = useMemo(
    () => (totalMinutes / 60).toFixed(2),
    [totalMinutes]
  );

  const handleAdd = async () => {
    const minsCombined =
      (parseInt(hoursInput || '0', 10) || 0) * 60 +
      (parseInt(minutesInput || '0', 10) || 0);
    const mins = isNaN(minsCombined) ? 0 : minsCombined;
    if (!selectedServiceId || !mins || mins <= 0) return;
    await addTimeEntry(selectedServiceId, mins);
    setIsAddOpen(false);
    setSelectedServiceId('');
    setHoursInput('');
    setMinutesInput('');
    await refresh();
  };

  const handleEdit = async () => {
    const mins = parseInt(minutes, 10);
    if (!editingEntry?.id || !mins || mins <= 0) return;
    await updateTimeEntry(editingEntry.id, mins);
    setIsEditOpen(false);
    setEditingEntry(null);
    setMinutes('');
    await refresh();
  };

  const handleDelete = async (entryId: string) => {
    await deleteTimeEntry(entryId);
    await refresh();
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
              Total: {totalMinutes} min ({totalHours} h)
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
              onClick={() => setIsAddOpen(true)}
            >
              Add Time
            </Button>
          </Stack>
        </Stack>

        {entries.length === 0 ? (
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
                      onClick={() => {
                        setEditingEntry(e);
                        setMinutes(String(e.minutes));
                        setIsEditOpen(true);
                      }}
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
                }
              >
                <ListItemText
                  primary={`${e.service_name}`}
                  secondary={`${e.minutes} min • ${new Date(e.logged_at).toLocaleString()}`}
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
      >
        <DialogTitle>Add Time</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            SelectProps={{ native: true }}
            label="Service"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
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
              onChange={(e) => setHoursInput(e.target.value)}
              inputProps={{ min: 0 }}
              fullWidth
            />
            <TextField
              type="number"
              label="Minutes"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value)}
              inputProps={{ min: 0, max: 59 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained">
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
        <DialogTitle>Edit Time Entry</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Minutes"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            sx={{ mt: 1 }}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained">
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
      />
    </Card>
  );
}
