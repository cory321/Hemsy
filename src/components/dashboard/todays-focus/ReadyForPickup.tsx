'use client';

import {
  Card,
  CardContent,
  Stack,
  Typography,
  Badge,
  Box,
  Button,
} from '@mui/material';
import { Inventory2 as InventoryIcon } from '@mui/icons-material';

interface PickupItem {
  name: string;
  client: string;
  days: number;
}

interface ReadyForPickupProps {
  items?: PickupItem[];
  onSendReminders?: () => void;
}

const refinedColors = {
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

const defaultItems: PickupItem[] = [
  { name: 'Dress alterations', client: 'Lisa Chen', days: 2 },
  { name: 'Jacket repair', client: 'Tom Wilson', days: 0 },
];

export function ReadyForPickup({
  items = defaultItems,
  onSendReminders,
}: ReadyForPickupProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ready For Pickup
          </Typography>
          <Badge badgeContent={items.length} color="error">
            <InventoryIcon
              sx={{ fontSize: 20, color: refinedColors.text.tertiary }}
            />
          </Badge>
        </Stack>
        <Stack spacing={2}>
          {items.map((item, index) => (
            <Box key={index}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {item.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: refinedColors.text.secondary }}
              >
                {item.client} •{' '}
                {item.days === 0 ? 'Ready today' : `${item.days} days`}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Button
          fullWidth
          variant="text"
          size="small"
          sx={{ mt: 2 }}
          onClick={onSendReminders}
        >
          Send pickup reminders
        </Button>
      </CardContent>
    </Card>
  );
}
