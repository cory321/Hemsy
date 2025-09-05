'use client';

import { useState } from 'react';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { restoreClient } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

interface ClientRestoreButtonProps {
  clientId: string;
  clientName: string;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
}

export default function ClientRestoreButton({
  clientId,
  clientName,
  variant = 'outlined',
  size = 'medium',
}: ClientRestoreButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when clicking restore
    setLoading(true);

    try {
      await restoreClient(clientId);
      showToast(`${clientName} has been restored successfully`, 'success');
      router.refresh();
    } catch (error) {
      console.error('Failed to restore client:', error);
      showToast(
        error instanceof Error
          ? error.message
          : 'Failed to restore client. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={`Restore ${clientName} to active clients`}>
      <span>
        <Button
          variant={variant}
          size={size}
          color="primary"
          onClick={handleRestore}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <RestoreIcon />}
        >
          Restore
        </Button>
      </span>
    </Tooltip>
  );
}
