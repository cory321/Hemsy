'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  IconButton,
  Box,
  FormControlLabel,
  Checkbox,
  useMediaQuery,
  useTheme,
  DialogContentText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import {
  Service,
  ServiceFormData,
  convertServiceForForm,
  calculateTotalPrice,
} from '@/lib/utils/serviceUtils';
import SERVICE_UNIT_TYPES from '@/lib/utils/serviceUnitTypes';
import {
  formatAsCurrency,
  parseFloatFromCurrency,
  formatUnitPrice,
} from '@/lib/utils/currency';
import ServicePriceInput from '@/components/common/ServicePriceInput';

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onClose: () => void;
  onSave: (updatedService: ServiceFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({
  service,
  open,
  onClose,
  onSave,
  onDelete,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [editedService, setEditedService] = useState<ServiceFormData>(
    convertServiceForForm(service)
  );
  const [isFrequentlyUsed, setIsFrequentlyUsed] = useState(
    service.frequently_used || false
  );
  const [price, setPrice] = useState('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const formData = convertServiceForForm(service);
    setEditedService(formData);
    setPrice(formData.unit_price.toFixed(2));
    setIsFrequentlyUsed(service.frequently_used || false);
  }, [service]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'qty') {
      const numValue = parseInt(value, 10) || 0;
      setEditedService((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setEditedService((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePriceChange = (newPrice: string) => {
    setPrice(newPrice);
    setEditedService((prev) => ({
      ...prev,
      unit_price: parseFloatFromCurrency(newPrice),
    }));
  };

  const handleUnitChange = (newUnit: 'flat_rate' | 'hour' | 'day') => {
    setEditedService((prev) => ({
      ...prev,
      unit: newUnit,
      // Reset quantity to 1 when switching to flat_rate
      qty: newUnit === 'flat_rate' ? 1 : prev.qty,
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    setEditedService((prev) => ({ ...prev, qty: quantity }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        ...editedService,
        frequently_used: isFrequentlyUsed,
      } as any);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (onDelete && service.id) {
      setIsLoading(true);
      try {
        await onDelete(service.id);
        setShowDeleteConfirm(false);
        onClose();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        Edit Service
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Name"
            name="name"
            value={editedService.name}
            onChange={handleChange}
            disabled={isLoading}
            required
            fullWidth
          />

          <TextField
            label="Description"
            name="description"
            value={editedService.description}
            onChange={handleChange}
            disabled={isLoading}
            multiline
            rows={2}
            fullWidth
          />

          <ServicePriceInput
            price={price}
            unit={editedService.unit as 'flat_rate' | 'hour' | 'day'}
            quantity={editedService.qty}
            onPriceChange={handlePriceChange}
            onUnitChange={handleUnitChange}
            onQuantityChange={handleQuantityChange}
            disabled={isLoading}
            showTotal={true}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={isFrequentlyUsed}
                onChange={(e) => setIsFrequentlyUsed(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Mark as frequently used"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          {onDelete && (
            <Button
              onClick={handleDeleteClick}
              disabled={isLoading}
              color="error"
              sx={{ textTransform: 'none' }}
            >
              Delete Service
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </DialogActions>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{service.name}&rdquo;? This
            action cannot be undone and will permanently remove this service
            from your catalog.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default EditServiceDialog;
