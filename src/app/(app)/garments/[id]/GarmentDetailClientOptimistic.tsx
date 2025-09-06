'use client';

import { useState } from 'react';
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GarmentEditDialogOptimistic from '@/components/garments/GarmentEditDialogOptimistic';
import { useGarment } from '@/contexts/GarmentContext';

export default function GarmentDetailClientOptimistic() {
  const { garment } = useGarment();
  const isGarmentDone = garment?.stage === 'Done';
  const isOrderCancelled = garment?.order?.status === 'cancelled';
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
        disabled={isGarmentDone || isOrderCancelled}
        title={
          isOrderCancelled
            ? 'Cannot edit garment for cancelled orders'
            : isGarmentDone
              ? 'Cannot edit completed garments'
              : undefined
        }
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
