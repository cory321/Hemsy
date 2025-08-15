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
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import { debounce } from '@/lib/utils/debounce';
import CreateServiceDialog from '@/components/services/CreateServiceDialog';

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
        const url = new URL('/api/services/search', window.location.origin);
        url.searchParams.set('q', query);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Search failed');
        const results = await res.json();
        setOptions(results);
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
          disabled={disabled}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, newValue) => handleServiceSelect(newValue)}
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
                    {loading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              size={params.size || 'medium'}
            />
          )}
          renderOption={(props: any, option) => (
            <ListItem {...props} component="li">
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
                  <Box>
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
          )}
          noOptionsText={
            inputValue.length < 2
              ? 'Type at least 2 characters to search'
              : 'No services found'
          }
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
