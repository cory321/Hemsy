'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { toast } from 'react-hot-toast';

import { addService } from '@/lib/actions/services';
import {
  handleChange,
  calculateTotalPrice,
  Service,
  ServiceFormData,
  convertServiceForDatabase,
} from '@/lib/utils/serviceUtils';
import SERVICE_UNIT_TYPES from '@/lib/utils/serviceUnitTypes';
import {
  formatAsCurrency,
  parseFloatFromCurrency,
  formatUnitPrice,
} from '@/lib/utils/currency';

interface AddServiceFormProps {
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  onClose: () => void;
}

const AddServiceForm: React.FC<AddServiceFormProps> = ({
  setServices,
  onClose,
}) => {
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
  const [isFrequentlyUsed, setIsFrequentlyUsed] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newService.name === '' || newService.unit_price <= 0) {
      toast.error('Please provide a service name and price');
      return;
    }

    setIsLoading(true);

    try {
      const serviceData = convertServiceForDatabase(newService);
      const newServiceItem = await addService({
        ...serviceData,
        frequently_used: isFrequentlyUsed,
      } as any);

      // Update the services state in ServicePage
      setServices((prevServices) => [...prevServices, newServiceItem]);

      setNewService({
        name: '',
        description: '',
        qty: 1,
        unit: SERVICE_UNIT_TYPES.ITEM,
        unit_price: 0,
      });
      setDisplayUnitPrice('0.00');
      setIsFrequentlyUsed(false);
      onClose();
      toast.success(
        `${newServiceItem.name} has been added to your service catalog.`
      );
    } catch (error) {
      toast.error(
        `Error adding service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error adding service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        position: 'relative',
      }}
      noValidate
      autoComplete="off"
      onSubmit={handleSubmit}
    >
      <TextField
        label="Name"
        name="name"
        onChange={(e) => handleChange(e, setNewService)}
        value={newService.name}
        disabled={isLoading}
        required
        fullWidth
      />

      <TextField
        label="Description"
        name="description"
        onChange={(e) => handleChange(e, setNewService)}
        value={newService.description}
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
          onChange={(e) => handleChange(e, setNewService)}
          value={newService.qty.toString()}
          disabled={isLoading}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />

        <TextField
          select
          label="Unit"
          name="unit"
          onChange={(e) =>
            setNewService((prev) => ({ ...prev, unit: e.target.value as any }))
          }
          value={newService.unit}
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
        onChange={handleUnitPriceChange}
        onFocus={handleUnitPriceFocus}
        onBlur={handleUnitPriceBlur}
        value={
          isUnitPriceFocused
            ? displayUnitPrice
            : formatAsCurrency(displayUnitPrice)
        }
        disabled={isLoading}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
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

      <Typography variant="h6">
        Total: {calculateTotalPrice(newService)}
      </Typography>

      <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Adding...' : 'Add Service'}
        </Button>
      </Box>
    </Box>
  );
};

export default AddServiceForm;
