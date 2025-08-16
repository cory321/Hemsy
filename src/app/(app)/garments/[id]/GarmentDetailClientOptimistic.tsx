'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GarmentEditDialogOptimistic from '@/components/garments/GarmentEditDialogOptimistic';

export default function GarmentDetailClientOptimistic() {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleClose = () => {
    setShowEditDialog(false);
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

      <GarmentEditDialogOptimistic
        open={showEditDialog}
        onClose={handleClose}
      />
    </>
  );
}
