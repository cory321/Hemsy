'use client';

import { useState } from 'react';
import {
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  IconButton,
  InputAdornment,
  Typography,
  Tooltip,
  useMediaQuery,
  Box,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-hot-toast';

import { calculateTotalPrice, ServiceFormData } from '@/lib/utils/serviceUtils';
import { addService } from '@/lib/actions/services';
import SERVICE_UNIT_TYPES from '@/lib/utils/serviceUnitTypes';
import {
  formatAsCurrency,
  parseFloatFromCurrency,
  formatUnitPrice,
  dollarsToCents,
} from '@/lib/utils/currency';
import { Service } from '@/lib/utils/serviceUtils';

interface CreateServiceDialogProps {
  open: boolean;
  onClose: () => void;
  onServiceSelect: (service: Service) => void;
}

const CreateServiceDialog: React.FC<CreateServiceDialogProps> = ({
  open,
  onClose,
  onServiceSelect,
}) => {
  const isMobile = useMediaQuery((theme: any) => theme.breakpoints.down('sm'));

  const [newService, setNewService] = useState<ServiceFormData>({
    name: '',
    description: '',
    qty: 1,
    unit: SERVICE_UNIT_TYPES.ITEM,
    unit_price: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [displayUnitPrice, setDisplayUnitPrice] = useState('0.00');
  const [isUnitPriceFocused, setIsUnitPriceFocused] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'qty') {
      const numValue = parseInt(value, 10) || 0;
      setNewService((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setNewService((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatAsCurrency(rawValue);

    setDisplayUnitPrice(formattedValue);
    setNewService((prev) => ({
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
    formatUnitPrice(displayUnitPrice, setDisplayUnitPrice, setNewService);
  };

  const handleSubmit = async () => {
    if (newService.name === '' || newService.unit_price <= 0) return;

    setIsLoading(true);

    try {
      const serviceData: Parameters<typeof addService>[0] = {
        name: newService.name,
        default_qty:
          typeof newService.qty === 'string'
            ? parseInt(newService.qty, 10) || 1
            : newService.qty,
        default_unit: newService.unit,
        default_unit_price_cents: dollarsToCents(newService.unit_price),
      };

      if (newService.description) {
        serviceData.description = newService.description;
      }

      const newServiceItem = await addService(serviceData);

      onServiceSelect(newServiceItem);

      // Reset form
      setNewService({
        name: '',
        description: '',
        qty: 1,
        unit: SERVICE_UNIT_TYPES.ITEM,
        unit_price: 0,
      });
      setDisplayUnitPrice('0.00');

      toast.success(
        `${newServiceItem.name} has been added to your service catalog.`
      );
      onClose();
    } catch (error) {
      toast.error(
        `Error adding service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error adding service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Create New Service
        <Tooltip
          title="Service will be added to the service catalog"
          placement="right"
        >
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Service Name"
            type="text"
            fullWidth
            variant="outlined"
            name="name"
            value={newService.name}
            onChange={handleChange}
            disabled={isLoading}
            required
          />

          <TextField
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            name="description"
            value={newService.description}
            onChange={handleChange}
            disabled={isLoading}
            multiline
            rows={2}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              variant="outlined"
              name="qty"
              value={newService.qty}
              onChange={handleChange}
              disabled={isLoading}
              inputProps={{ min: 1 }}
            />

            <TextField
              select
              label="Unit"
              fullWidth
              variant="outlined"
              name="unit"
              value={newService.unit}
              onChange={(e) =>
                setNewService((prev) => ({
                  ...prev,
                  unit: e.target.value as any,
                }))
              }
              disabled={isLoading}
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
            type="text"
            fullWidth
            variant="outlined"
            name="unit_price"
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
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: {calculateTotalPrice(newService)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isLoading || !newService.name || newService.unit_price <= 0}
        >
          {isLoading ? 'Adding...' : 'Add Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateServiceDialog;
