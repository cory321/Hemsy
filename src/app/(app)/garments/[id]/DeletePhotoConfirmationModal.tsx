'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface DeletePhotoConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  garmentName: string;
}

export default function DeletePhotoConfirmationModal({
  open,
  onClose,
  onConfirm,
  isDeleting,
  garmentName,
}: DeletePhotoConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={!isDeleting ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1,
        }}
      >
        <Box
          sx={{
            backgroundColor: 'error.main',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WarningAmberIcon sx={{ color: 'white', fontSize: 24 }} />
        </Box>
        <Typography variant="h6" component="div">
          Delete Photo
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone
        </Alert>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to permanently delete the photo for{' '}
          <strong>{garmentName || 'this garment'}</strong>?
        </Typography>

        <Typography variant="body2" color="text.secondary">
          The photo will be removed from Hemsy and the garment will revert to
          using its selected icon.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isDeleting}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isDeleting}
          startIcon={<DeleteIcon />}
          sx={{ minWidth: 120 }}
        >
          {isDeleting ? 'Deleting...' : 'Delete Photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
