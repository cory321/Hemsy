'use client';

import { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  InputAdornment,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useDebounce } from '@/hooks/useDebounce';
import type { Client as ClientType } from '@/types';
import { searchClients } from '@/lib/actions/clients';

type Client = ClientType;

interface ClientSearchFieldProps {
  value: Client | null;
  onChange: (client: Client | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export function ClientSearchField({
  value,
  onChange,
  disabled = false,
  label = 'Client',
  placeholder = 'Search by name, email, or phone...',
  helperText,
}: ClientSearchFieldProps) {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebounce(inputValue, 300);
  const searchRef = useRef<AbortController | null>(null);

  // Sync inputValue with the selected client's name when value changes
  useEffect(() => {
    if (value) {
      setInputValue(`${value.first_name} ${value.last_name}`);
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    // Don't search if input is empty
    if (!debouncedSearch.trim()) {
      setOptions([]);
      return;
    }

    // Cancel previous search and create a new controller for this request
    if (searchRef.current) {
      searchRef.current.abort();
    }
    const controller = new AbortController();
    searchRef.current = controller;

    const performSearch = async () => {
      setLoading(true);
      try {
        const results = await searchClients(debouncedSearch);
        // Only update if this is still the latest request
        if (searchRef.current === controller && !controller.signal.aborted) {
          setOptions(results);
        }
      } catch (error) {
        if (searchRef.current === controller && !controller.signal.aborted) {
          console.error('Failed to search clients:', error);
          setOptions([]);
        }
      } finally {
        if (searchRef.current === controller && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    // Only trigger when debounced value settles
    performSearch();

    return () => {
      searchRef.current?.abort();
    };
  }, [debouncedSearch]);

  const formatPhoneNumber = (phone: string) => {
    // Basic phone formatting - can be enhanced
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  return (
    <Autocomplete
      fullWidth
      value={value}
      onChange={(_, newValue) =>
        onChange(typeof newValue === 'string' ? null : newValue)
      }
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={options}
      loading={loading}
      open={open && (inputValue.length > 0 || loading)}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disabled={disabled}
      freeSolo
      filterOptions={(x) => x} // Disable built-in filtering since we search server-side
      getOptionLabel={(option) =>
        typeof option === 'string'
          ? option
          : `${option.first_name} ${option.last_name}`
      }
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={
        loading
          ? 'Searching...'
          : inputValue
            ? 'No clients found'
            : 'Start typing to search'
      }
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2">
                {option.first_name} {option.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.email} • {formatPhoneNumber(option.phone_number)}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => {
        const { InputProps, inputProps, id } = params;
        return (
          <TextField
            fullWidth
            label={label}
            placeholder={placeholder}
            helperText={helperText}
            InputProps={{
              ...InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress
                      color="inherit"
                      size={20}
                      role="progressbar"
                    />
                  ) : null}
                  {InputProps.endAdornment}
                </>
              ),
            }}
            inputProps={inputProps}
            id={id}
          />
        );
      }}
    />
  );
}
