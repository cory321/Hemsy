'use client';

import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  Box,
  Select,
  MenuItem,
} from '@mui/material';
import { formatAsCurrency, parseFloatFromCurrency } from '@/lib/utils/currency';

interface ServicePriceInputProps {
  price: string;
  unit: 'flat_rate' | 'hour' | 'day';
  onPriceChange: (price: string) => void;
  onUnitChange: (unit: 'flat_rate' | 'hour' | 'day') => void;
  disabled?: boolean;
}

export default function ServicePriceInput({
  price,
  unit,
  onPriceChange,
  onUnitChange,
  disabled = false,
}: ServicePriceInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    onPriceChange(formatAsCurrency(rawValue));
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (price === '0.00' || price === '') {
      onPriceChange('');
    }
  };

  const handleBlur = () => {
    const numericValue = parseFloatFromCurrency(price || '0');
    const formatted = numericValue.toFixed(2);
    onPriceChange(formatted);
    setIsFocused(false);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <TextField
        fullWidth
        label="Price"
        value={isFocused ? price : formatAsCurrency(price)}
        onChange={handlePriceChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        disabled={disabled}
      />
      <Select
        value={unit}
        onChange={(e) =>
          onUnitChange(e.target.value as 'flat_rate' | 'hour' | 'day')
        }
        disabled={disabled}
        sx={{ minWidth: 120 }}
      >
        <MenuItem value="flat_rate">flat rate</MenuItem>
        <MenuItem value="hour">per hour</MenuItem>
        <MenuItem value="day">per day</MenuItem>
      </Select>
    </Box>
  );
}
