'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  ListItem,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Service } from '@/lib/utils/serviceUtils';
import { ServiceUnitType } from '@/lib/utils/serviceUnitTypes';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import { debounce } from '@/lib/utils/debounce';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';
import { searchServices } from '@/lib/actions/services';

interface ServicesSearchProps {
  onServiceSelect: (service: Service) => void;
  disabled?: boolean;
}

const ServicesSearch: React.FC<ServicesSearchProps> = ({
  onServiceSelect,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const result = await searchServices(query);

        if (!result.success) {
          console.error('Failed to search services:', result.error);
          setOptions([]);
          return;
        }

        const results = result.data;
        // Map database results to Service interface
        const services: Service[] = results.map((result: any) => {
          const service: Service = {
            id: result.id,
            name: result.name,
            default_qty: result.default_qty,
            default_unit: result.default_unit as ServiceUnitType,
            default_unit_price_cents: result.default_unit_price_cents,
            frequently_used: result.frequently_used,
            frequently_used_position: result.frequently_used_position,
          };
          // Only add description if it's not null
          if (result.description) {
            service.description = result.description;
          }
          return service;
        });
        setOptions(services);
      } catch (error) {
        console.error('Error searching services:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(inputValue);
  }, [inputValue, debouncedSearch]);

  const handleServiceSelect = (service: Service | null) => {
    if (service) {
      onServiceSelect(service);
      setInputValue('');
      setOptions([]);
    }
  };

  const handleCreateService = (newService: Service) => {
    onServiceSelect(newService);
    setShowCreateDialog(false);
    setInputValue('');
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Autocomplete
          sx={{ flex: 1 }}
          options={options}
          loading={loading}
          open={open && (inputValue.length > 0 || loading)}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          disabled={disabled}
          inputValue={inputValue}
          onInputChange={(_, newInputValue, reason) => {
            // Prevent option selection from populating the input; keep it like ClientSearch UX
            if (reason === 'reset' || reason === 'clear') {
              setInputValue('');
              return;
            }
            setInputValue(newInputValue);
          }}
          onChange={(_, newValue) => handleServiceSelect(newValue)}
          filterOptions={(x) => x}
          getOptionLabel={(option) => option.name}
          renderInput={(params: any) => (
            <TextField
              {...params}
              label="Search services"
              placeholder="Type to search services..."
              variant="outlined"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && (
                      <CircularProgress
                        color="inherit"
                        size={20}
                        sx={{ mr: 1 }}
                      />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              size={params.size || 'medium'}
            />
          )}
          renderOption={(props: any, option) => {
            const { key, ...otherProps } = props;
            return (
              <ListItem {...otherProps} component="li" key={key}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{option.name}</Typography>
                      {option.frequently_used && (
                        <Chip
                          label="Frequently Used"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box component="span">
                      {option.description && (
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {formatCentsAsCurrency(option.default_unit_price_cents)}{' '}
                        per {option.default_unit}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            );
          }}
          noOptionsText={
            loading
              ? 'Searching...'
              : inputValue.length < 2
                ? 'Type at least 2 characters to search'
                : 'No services found'
          }
          loadingText="Searching services..."
        />

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateDialog(true)}
          disabled={disabled}
        >
          New Service
        </Button>
      </Box>

      <CreateServiceDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onServiceSelect={handleCreateService}
      />
    </>
  );
};

export default ServicesSearch;
