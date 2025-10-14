/**
 * Reusable button styles for consistency across the application
 */

import { SxProps, Theme } from '@mui/material';

/**
 * Standard action button style used across main pages
 * Used for: Add Client, Create Order, Schedule Appointment, Add Service
 */
export const actionButtonStyle: SxProps<Theme> = {
	fontSize: '1.2rem',
	whiteSpace: 'nowrap',
	alignItems: 'center',
	gap: 1,
};

/**
 * Additional styles can be added here as needed
 */
