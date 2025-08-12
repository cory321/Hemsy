'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { ClientSearchField } from '@/components/appointments/ClientSearchField';
import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import type { Tables } from '@/types/supabase';

export default function Step1ClientSelection() {
  const { orderDraft, updateOrderDraft } = useOrderFlow();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleClientSelect = (client: Tables<'clients'> | null) => {
    updateOrderDraft({
      clientId: client?.id || '',
      client: client || undefined,
    });
  };

  const handleClientCreated = (client: Tables<'clients'>) => {
    handleClientSelect(client);
    setCreateDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Client
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose an existing client or create a new one for this order.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <ClientSearchField
          value={orderDraft.client || null}
          onChange={handleClientSelect}
        />
      </Box>

      {orderDraft.client && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selected Client
            </Typography>
            <Typography variant="body1">
              {orderDraft.client.first_name} {orderDraft.client.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {orderDraft.client.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {orderDraft.client.phone_number}
            </Typography>
            {orderDraft.client.notes && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                Notes: {orderDraft.client.notes}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        variant="outlined"
        startIcon={<PersonAddIcon />}
        onClick={() => setCreateDialogOpen(true)}
        fullWidth
      >
        Create New Client
      </Button>

      <ClientCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleClientCreated}
      />
    </Box>
  );
}
