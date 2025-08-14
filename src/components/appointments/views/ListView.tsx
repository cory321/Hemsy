'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { parseLocalDateFromYYYYMMDD } from '@/lib/utils/date';
import {
  getAppointmentColor,
  formatTime,
  formatDuration,
  getDurationMinutes,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';

interface ListViewProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
}

type FilterType = 'all' | 'upcoming' | 'past';

export function ListView({ appointments, onAppointmentClick }: ListViewProps) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('upcoming');

  // Filter appointments
  const filteredAppointments = appointments
    .filter((apt) => {
      // Filter by time
      const aptDateTime = new Date(`${apt.date} ${apt.start_time}`);
      const now = new Date();

      if (filter === 'upcoming' && isBefore(aptDateTime, now)) {
        return false;
      }
      if (filter === 'past' && isAfter(aptDateTime, now)) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const clientName = apt.client
          ? `${apt.client.first_name} ${apt.client.last_name}`.toLowerCase()
          : '';

        return (
          clientName.includes(search) ||
          apt.type.toLowerCase().includes(search) ||
          apt.notes?.toLowerCase().includes(search)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date and time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

  // Group appointments by date
  const groupedAppointments = filteredAppointments.reduce(
    (acc, appointment) => {
      const dateKey = appointment.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    },
    {} as Record<string, Appointment[]>
  );

  const handleFilterChange = (
    _: React.MouseEvent<HTMLElement>,
    newFilter: FilterType | null
  ) => {
    if (newFilter) {
      setFilter(newFilter);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          size="small"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="upcoming">Upcoming</ToggleButton>
          <ToggleButton value="past">Past</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filteredAppointments.length} appointment
        {filteredAppointments.length !== 1 ? 's' : ''} found
      </Typography>

      {/* Grouped appointments */}
      {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
        <Box key={date} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            {format(parseLocalDateFromYYYYMMDD(date), 'EEEE, MMMM d, yyyy')}
          </Typography>

          {dateAppointments.map((appointment) => {
            const duration = getDurationMinutes(
              appointment.start_time,
              appointment.end_time
            );
            const isPast = isBefore(
              new Date(`${appointment.date} ${appointment.end_time}`),
              new Date()
            );

            return (
              <Card
                key={appointment.id}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  opacity: isPast ? 0.7 : 1,
                  '&:hover': {
                    boxShadow: theme.shadows[3],
                  },
                }}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                <CardContent
                  sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
                >
                  {/* Time */}
                  <Box sx={{ minWidth: 120 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatTime(appointment.start_time)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDuration(duration)}
                    </Typography>
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {appointment.client
                        ? `${appointment.client.first_name} ${appointment.client.last_name}`
                        : 'No Client'}
                    </Typography>

                    {appointment.client && (
                      <Typography variant="body2" color="text.secondary">
                        {appointment.client.first_name}{' '}
                        {appointment.client.last_name}
                      </Typography>
                    )}

                    {appointment.notes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {appointment.notes}
                      </Typography>
                    )}
                  </Box>

                  {/* Type and Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      alignItems: 'flex-end',
                    }}
                  >
                    <Chip
                      label={appointment.type.replace('_', ' ')}
                      size="small"
                      sx={{
                        bgcolor: getAppointmentColor(appointment.type),
                        color: 'white',
                      }}
                    />

                    {appointment.status === 'confirmed' ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        label="Client has confirmed this appointment"
                        size="small"
                        sx={{
                          bgcolor: '#4caf50',
                          color: 'white',
                        }}
                      />
                    ) : (
                      <Chip
                        label={appointment.status}
                        size="small"
                        variant="outlined"
                        color={
                          appointment.status === 'canceled' ||
                          appointment.status === 'declined'
                            ? 'error'
                            : appointment.status === 'pending'
                              ? 'warning'
                              : appointment.status === 'no_show'
                                ? 'warning'
                                : 'default'
                        }
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ))}

      {/* No results */}
      {filteredAppointments.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No appointments found matching your criteria
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
