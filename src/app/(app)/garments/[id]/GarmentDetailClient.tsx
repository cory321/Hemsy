'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GarmentEditDialog from '@/components/garments/GarmentEditDialog';

interface GarmentDetailClientProps {
  garment: {
    id: string;
    name: string;
    due_date: string | null;
    event_date: string | null;
    preset_icon_key: string | null;
    preset_fill_color: string | null;
    notes: string | null;
  };
  onEdit?: () => void;
}

export default function GarmentDetailClient({
  garment,
  onEdit,
}: GarmentDetailClientProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleClose = () => {
    setShowEditDialog(false);
  };

  const handleSuccess = () => {
    handleClose();
    onEdit?.();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        onClick={() => setShowEditDialog(true)}
      >
        Edit
      </Button>

      <GarmentEditDialog
        open={showEditDialog}
        onClose={handleClose}
        onSuccess={handleSuccess}
        garment={garment}
      />
    </>
  );
}
