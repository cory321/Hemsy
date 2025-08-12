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

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onClose: () => void;
  onSave: (updatedService: ServiceFormData) => Promise<void>;
}

const EditServiceDialog: React.FC<EditServiceDialogProps> = ({
  service,
  open,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [editedService, setEditedService] = useState<ServiceFormData>(
    convertServiceForForm(service)
  );
  const [isFrequentlyUsed, setIsFrequentlyUsed] = useState(
    service.frequently_used || false
  );
  const [displayUnitPrice, setDisplayUnitPrice] = useState('0.00');
  const [isUnitPriceFocused, setIsUnitPriceFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const formData = convertServiceForForm(service);
    setEditedService(formData);
    setDisplayUnitPrice(formData.unit_price.toFixed(2));
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

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatAsCurrency(rawValue);

    setDisplayUnitPrice(formattedValue);
    setEditedService((prev) => ({
      ...prev,
      unit_price: parseFloatFromCurrency(rawValue),
    }));
  };

  const handleUnitPriceFocus = () => {
    setIsUnitPriceFocused(true);
    if (displayUnitPrice === '0.00' || displayUnitPrice === '') {
      setDisplayUnitPrice('');
    }
  };

  const handleUnitPriceBlur = () => {
    setIsUnitPriceFocused(false);
    formatUnitPrice(displayUnitPrice, setDisplayUnitPrice, setEditedService);
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

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Default Quantity"
              name="qty"
              type="number"
              value={editedService.qty}
              onChange={handleChange}
              disabled={isLoading}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />

            <TextField
              select
              label="Unit"
              name="unit"
              value={editedService.unit}
              onChange={(e) =>
                setEditedService((prev) => ({
                  ...prev,
                  unit: e.target.value as any,
                }))
              }
              disabled={isLoading}
              sx={{ flex: 1 }}
            >
              {Object.values(SERVICE_UNIT_TYPES).map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unit}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Unit Price"
            name="unit_price"
            type="text"
            value={
              isUnitPriceFocused
                ? displayUnitPrice
                : formatAsCurrency(displayUnitPrice)
            }
            onChange={handleUnitPriceChange}
            onFocus={handleUnitPriceFocus}
            onBlur={handleUnitPriceBlur}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
            disabled={isLoading}
            required
            fullWidth
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

          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: {calculateTotalPrice(editedService)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditServiceDialog;
