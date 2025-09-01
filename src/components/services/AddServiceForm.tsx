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
  Alert,
} from '@mui/material';
import { toast } from 'react-hot-toast';

import {
  handleChange,
  calculateTotalPrice,
  Service,
  ServiceFormData,
  convertServiceForDatabase,
} from '@/lib/utils/serviceUtils';
import SERVICE_UNIT_TYPES, {
  ServiceUnitType,
} from '@/lib/utils/serviceUnitTypes';
import {
  formatAsCurrency,
  parseFloatFromCurrency,
  formatUnitPrice,
} from '@/lib/utils/currency';
import { addService } from '@/lib/actions/services';
import ServicePriceInput from '@/components/common/ServicePriceInput';

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
    unit: SERVICE_UNIT_TYPES.FLAT_RATE,
    unit_price: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState('0.00');
  const [isFrequentlyUsed, setIsFrequentlyUsed] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const handlePriceChange = (newPrice: string) => {
    setPrice(newPrice);
    setNewService((prev) => ({
      ...prev,
      unit_price: parseFloatFromCurrency(newPrice),
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear name error when user starts typing
    if (nameError) {
      setNameError(null);
    }
    handleChange(e, setNewService);
  };

  const handleUnitChange = (newUnit: 'flat_rate' | 'hour' | 'day') => {
    setNewService((prev) => ({
      ...prev,
      unit: newUnit,
      // Reset quantity to 1 when switching to flat_rate
      qty: newUnit === 'flat_rate' ? 1 : prev.qty,
    }));
  };

  const handleQuantityChange = (quantity: number) => {
    setNewService((prev) => ({ ...prev, qty: quantity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear any existing errors
    setNameError(null);

    if (newService.name === '' || newService.unit_price <= 0) {
      toast.error('Please provide a service name and price');
      return;
    }

    setIsLoading(true);

    try {
      const serviceData = convertServiceForDatabase(newService);
      const result = await addService({
        name: serviceData.name!,
        ...(serviceData.description !== undefined && {
          description: serviceData.description,
        }),
        default_qty: serviceData.default_qty!,
        default_unit: serviceData.default_unit! as string,
        default_unit_price_cents: serviceData.default_unit_price_cents!,
        frequently_used: isFrequentlyUsed,
      });

      if (!result.success) {
        // Check if it's a duplicate name error
        if (result.error.includes('already exists')) {
          setNameError(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      const newServiceItem = result.data;

      // Map database result to Service type from serviceUtils
      const serviceForState: Service = {
        id: newServiceItem.id,
        name: newServiceItem.name,
        description: newServiceItem.description,
        default_qty: newServiceItem.default_qty,
        default_unit: newServiceItem.default_unit as ServiceUnitType,
        default_unit_price_cents: newServiceItem.default_unit_price_cents,
        frequently_used: newServiceItem.frequently_used,
        frequently_used_position: newServiceItem.frequently_used_position,
      };

      // Update the services state in ServicePage
      setServices((prevServices) => [...prevServices, serviceForState]);

      setNewService({
        name: '',
        description: '',
        qty: 1,
        unit: SERVICE_UNIT_TYPES.FLAT_RATE,
        unit_price: 0,
      });
      setPrice('0.00');
      setIsFrequentlyUsed(false);
      onClose();
      toast.success(
        `${newServiceItem.name} has been added to your service catalog.`
      );
    } catch (error) {
      // This catch block should rarely be reached now, only for unexpected errors
      console.error('Unexpected error adding service:', error);
      toast.error('An unexpected error occurred while adding the service');
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
      {nameError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {nameError}
        </Alert>
      )}
      <TextField
        label="Name"
        name="name"
        onChange={handleNameChange}
        value={newService.name}
        disabled={isLoading}
        required
        fullWidth
        error={!!nameError}
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

      <ServicePriceInput
        price={price}
        unit={newService.unit as 'flat_rate' | 'hour' | 'day'}
        quantity={newService.qty}
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
