'use client';

import { Card, CardContent, Typography, Stack, Box } from '@mui/material';

interface ActivityItem {
  text: string;
  detail: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

const refinedColors = {
  text: {
    tertiary: '#999999',
  },
};

const defaultActivities: ActivityItem[] = [
  { text: 'Payment received', detail: '$150 from Lisa C.' },
  { text: 'Appointment confirmed', detail: 'Sarah J. at 10:30 AM' },
  { text: 'Garment completed', detail: 'Evening dress for Amy R.' },
];

export function RecentActivity({
  activities = defaultActivities,
}: RecentActivityProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Recent Activity
        </Typography>
        <Stack spacing={2}>
          {activities.map((activity, index) => (
            <Box key={index}>
              <Typography variant="body2">{activity.text}</Typography>
              <Typography
                variant="caption"
                sx={{ color: refinedColors.text.tertiary }}
              >
                {activity.detail}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
