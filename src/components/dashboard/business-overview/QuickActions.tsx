'use client';

import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Box,
  alpha,
} from '@mui/material';
import { RemixIcon } from '../common/RemixIcon';

interface QuickAction {
  id: string;
  icon: string;
  text: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onAction?: (actionId: string) => void;
}

const refinedColors = {
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
  },
};

const defaultActions: QuickAction[] = [
  {
    id: 'new-order',
    icon: 'ri-file-add-line',
    text: 'New Order',
  },
  {
    id: 'new-client',
    icon: 'ri-user-add-line',
    text: 'New Client',
  },
  {
    id: 'new-appointment',
    icon: 'ri-calendar-line',
    text: 'New Appointment',
  },
  {
    id: 'new-service',
    icon: 'ri-service-line',
    text: 'New Service',
  },
];

export function QuickActions({
  actions = defaultActions,
  onAction,
}: QuickActionsProps) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          Quick Actions
        </Typography>
        <Stack spacing={1}>
          {actions.map((action) => (
            <Button
              key={action.id}
              fullWidth
              variant="text"
              onClick={() => onAction?.(action.id)}
              sx={{
                py: 1.5,
                px: 2,
                justifyContent: 'flex-start',
                textTransform: 'none',
                borderRadius: 2,
                color: refinedColors.text.primary,
                '&:hover': {
                  bgcolor: alpha('#9c27b0', 0.08),
                  color: refinedColors.text.primary,
                },
                fontWeight: 400,
              }}
            >
              <RemixIcon
                name={action.icon}
                size={18}
                color={refinedColors.text.secondary}
              />
              <Box component="span" sx={{ ml: 2 }}>
                {action.text}
              </Box>
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
