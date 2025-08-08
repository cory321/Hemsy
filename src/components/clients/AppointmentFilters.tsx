'use client';

import { Box, Chip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { AppointmentStatus } from '@/types';
import type { FilterState } from './ClientAppointmentsSection';

export interface AppointmentFiltersProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
}

export function AppointmentFilters({
  filters,
  onChange,
}: AppointmentFiltersProps) {
  const handleStatusesChange = (_: any, value: AppointmentStatus[]) => {
    if (!value) return;
    onChange({ ...filters, statuses: value });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        mb: 1,
      }}
    >
      <ToggleButtonGroup
        size="small"
        value={filters.statuses}
        onChange={handleStatusesChange}
        aria-label="status filters"
      >
        <ToggleButton value="pending" aria-label="pending">
          Pending
        </ToggleButton>
        <ToggleButton value="confirmed" aria-label="confirmed">
          Confirmed
        </ToggleButton>
        <ToggleButton value="declined" aria-label="declined">
          Declined
        </ToggleButton>
        <ToggleButton value="canceled" aria-label="canceled">
          Canceled
        </ToggleButton>
        <ToggleButton value="no_show" aria-label="no-show">
          No Show
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
        <Chip
          label={filters.showUpcoming ? 'Upcoming: On' : 'Upcoming: Off'}
          size="small"
          onClick={() =>
            onChange({ ...filters, showUpcoming: !filters.showUpcoming })
          }
          variant={filters.showUpcoming ? 'filled' : 'outlined'}
        />
        <Chip
          label={filters.showPast ? 'Past: On' : 'Past: Off'}
          size="small"
          onClick={() => onChange({ ...filters, showPast: !filters.showPast })}
          variant={filters.showPast ? 'filled' : 'outlined'}
        />
        <Chip
          label={filters.showCanceled ? 'Canceled: On' : 'Canceled: Off'}
          size="small"
          onClick={() =>
            onChange({ ...filters, showCanceled: !filters.showCanceled })
          }
          variant={filters.showCanceled ? 'filled' : 'outlined'}
        />
      </Box>
    </Box>
  );
}

export default AppointmentFilters;
