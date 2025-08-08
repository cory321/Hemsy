'use client';

import { memo, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { Appointment } from '@/types';
import Link from 'next/link';

export interface AppointmentListItemProps {
  appointment: Appointment;
}

export const AppointmentListItem = memo(function AppointmentListItem({
  appointment,
}: AppointmentListItemProps) {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = useMemo(() => {
    try {
      return new Date(appointment.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return appointment.date;
    }
  }, [appointment.date]);

  const timeRange = `${appointment.start_time} - ${appointment.end_time}`;
  const appointmentHref = `/appointments?view=day&date=${appointment.date}&focus=${appointment.id}`;

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent
        sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              component={Link}
              href={appointmentHref}
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              {formattedDate} at {timeRange}
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
              }}
            >
              <Chip size="small" label={appointment.type} />
              <Chip
                size="small"
                label={appointment.status}
                variant={
                  appointment.status === 'canceled' ? 'outlined' : 'filled'
                }
              />
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              {appointment.notes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                >
                  {appointment.notes}
                </Typography>
              )}
            </Collapse>
          </Box>

          <IconButton
            size="small"
            sx={{ ml: 1 }}
            aria-label={expanded ? 'collapse' : 'expand'}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
});

export default AppointmentListItem;
