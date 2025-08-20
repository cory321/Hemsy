'use client';

import {
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Button,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { PipelineOverview } from './PipelineOverview';
import { ActiveGarmentItem } from './ActiveGarmentItem';

export function GarmentPipeline() {
  // TODO: Replace with real data from actions/queries
  const activeGarments = [
    {
      name: 'Evening gown alterations',
      client: 'Mary K.',
      dueDate: 'Today',
      stage: 'In Progress',
      progress: 60,
      priority: true,
      services: [
        { name: 'Hem', completed: true },
        { name: 'Take in waist', completed: false },
      ],
    },
    {
      name: 'Pants hemming',
      client: 'Bob R.',
      dueDate: 'Tomorrow',
      stage: 'In Progress',
      progress: 30,
    },
    {
      name: 'Wedding dress',
      client: 'Sarah J.',
      dueDate: 'Friday',
      stage: 'New',
      progress: 0,
    },
  ];

  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
          Garment Pipeline
        </Typography>

        {/* Visual Pipeline Overview */}
        <PipelineOverview
          onStageClick={(stage) => console.log('Stage clicked:', stage)}
        />

        <Divider sx={{ my: 3 }} />

        {/* Active Garments */}
        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
          Active Garments
        </Typography>

        <Stack spacing={2}>
          {activeGarments.map((item, index) => (
            <ActiveGarmentItem
              key={index}
              {...item}
              onUpdateStatus={() => console.log('Update status:', item.name)}
              onViewDetails={() => console.log('View details:', item.name)}
            />
          ))}
        </Stack>

        <Button
          fullWidth
          variant="text"
          sx={{ mt: 3 }}
          endIcon={<ArrowForwardIcon />}
        >
          View all garments
        </Button>
      </CardContent>
    </Card>
  );
}
