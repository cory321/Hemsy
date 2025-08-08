// no-op
'use client';

import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';

export default function NewAppointmentPage() {
  const router = useRouter();
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(dayjs());
  const [appointmentType, setAppointmentType] = useState('');
  const [duration, setDuration] = useState('30');

  // Mock data for demonstration
  const clients = [
    { id: 1, name: 'Jane Smith' },
    { id: 2, name: 'John Doe' },
    { id: 3, name: 'Sarah Johnson' },
    { id: 4, name: 'Mike Wilson' },
  ];

  const appointmentTypes = [
    { value: 'fitting', label: 'Fitting', color: '#2196F3' },
    { value: 'consultation', label: 'Consultation', color: '#FF9800' },
    { value: 'pickup', label: 'Pick up', color: '#4CAF50' },
    { value: 'dropoff', label: 'Drop off', color: '#9C27B0' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    router.push('/appointments');
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Schedule Appointment
        </Typography>

        <Card>
          <CardContent>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Client Selection */}
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Client"
                    required
                    fullWidth
                    sx={{ mb: 3 }}
                  />
                )}
              />

              {/* Date & Time */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Date & Time"
                  value={appointmentDate}
                  onChange={(newValue) => setAppointmentDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      sx: { mb: 3 },
                    },
                  }}
                />
              </LocalizationProvider>

              {/* Appointment Type */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={appointmentType}
                  label="Appointment Type"
                  onChange={(e) => setAppointmentType(e.target.value)}
                  required
                >
                  {appointmentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: type.color,
                            mr: 1,
                          }}
                        />
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Duration */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={duration}
                  label="Duration"
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <MenuItem value="15">15 minutes</MenuItem>
                  <MenuItem value="30">30 minutes</MenuItem>
                  <MenuItem value="45">45 minutes</MenuItem>
                  <MenuItem value="60">1 hour</MenuItem>
                  <MenuItem value="90">1.5 hours</MenuItem>
                  <MenuItem value="120">2 hours</MenuItem>
                </Select>
              </FormControl>

              {/* Notes */}
              <TextField
                fullWidth
                label="Notes (optional)"
                name="notes"
                multiline
                rows={3}
                sx={{ mb: 3 }}
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="contained" fullWidth>
                  Schedule
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
