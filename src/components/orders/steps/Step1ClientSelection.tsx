'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
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

  // When a client is selected, show only the selected client card + controls
  if (orderDraft.client) {
    const clearSelection = () => handleClientSelect(null);
    return (
      <Box>
        <Card
          variant="outlined"
          sx={{ mb: 2, position: 'relative' }}
          data-testid="selected-client-card"
        >
          <IconButton
            aria-label="Close"
            onClick={clearSelection}
            sx={{ position: 'absolute', top: 8, right: 8 }}
            data-testid="close-selected-client"
          >
            <CloseIcon />
          </IconButton>
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
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="text"
            color="primary"
            onClick={clearSelection}
            data-testid="choose-different-client"
          >
            Choose a different client
          </Button>
        </Box>
      </Box>
    );
  }

  // Otherwise, show the centered search-first layout with an "-or-" separator and Add New Client button
  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        Select Client
      </Typography>
      <Box sx={{ maxWidth: 520, mx: 'auto', width: '100%' }}>
        <ClientSearchField
          value={orderDraft.client || null}
          onChange={handleClientSelect}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ my: 2 }}
          data-testid="or-separator"
        >
          - or -
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="Add new client"
            data-testid="add-new-client-button"
            sx={{
              px: 3,
              py: 1.25,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            <PersonAddIcon sx={{ mr: 1 }} />
            Add New Client
          </Button>
        </Box>
      </Box>

      <ClientCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={handleClientCreated}
      />
    </Box>
  );
}
