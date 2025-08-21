'use client';

import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  Box,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { formatAsCurrency, parseFloatFromCurrency } from '@/lib/utils/currency';

interface ServicePriceInputProps {
  price: string;
  unit: 'flat_rate' | 'hour' | 'day';
  quantity?: number;
  onPriceChange: (price: string) => void;
  onUnitChange: (unit: 'flat_rate' | 'hour' | 'day') => void;
  onQuantityChange?: (quantity: number) => void;
  disabled?: boolean;
  showTotal?: boolean;
}

export default function ServicePriceInput({
  price,
  unit,
  quantity = 1,
  onPriceChange,
  onUnitChange,
  onQuantityChange,
  disabled = false,
  showTotal = true,
}: ServicePriceInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(quantity);

  // Update local quantity when prop changes
  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  // Reset quantity to 1 when switching to flat_rate
  useEffect(() => {
    if (unit === 'flat_rate' && localQuantity !== 1) {
      setLocalQuantity(1);
      onQuantityChange?.(1);
    }
  }, [unit, localQuantity, onQuantityChange]);

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

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      setLocalQuantity(value);
      onQuantityChange?.(value);
    } else if (e.target.value === '') {
      setLocalQuantity(0);
      onQuantityChange?.(0);
    }
  };

  const handleQuantityBlur = () => {
    // Ensure quantity is at least 1
    if (localQuantity < 1) {
      setLocalQuantity(1);
      onQuantityChange?.(1);
    }
  };

  const handleUnitChange = (newUnit: 'flat_rate' | 'hour' | 'day') => {
    onUnitChange(newUnit);
    // Quantity will be reset to 1 for flat_rate by the useEffect
  };

  // Calculate total
  const priceNum = parseFloatFromCurrency(price || '0');
  const total = priceNum * localQuantity;

  // Get quantity label based on unit
  const getQuantityLabel = () => {
    switch (unit) {
      case 'hour':
        return 'Hours';
      case 'day':
        return 'Days';
      default:
        return 'Quantity';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: showTotal ? 2 : 0 }}>
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
        {unit !== 'flat_rate' && (
          <TextField
            label={getQuantityLabel()}
            type="number"
            value={localQuantity}
            onChange={handleQuantityChange}
            onBlur={handleQuantityBlur}
            disabled={disabled}
            inputProps={{
              min: 1,
              step: 1,
            }}
            sx={{ width: 100 }}
          />
        )}
        <Select
          value={unit}
          onChange={(e) =>
            handleUnitChange(e.target.value as 'flat_rate' | 'hour' | 'day')
          }
          disabled={disabled}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="flat_rate">flat rate</MenuItem>
          <MenuItem value="hour">per hour</MenuItem>
          <MenuItem value="day">per day</MenuItem>
        </Select>
      </Box>
      {showTotal && (
        <Typography variant="h6" sx={{ mt: 2 }}>
          Total: ${total.toFixed(2)}
          {unit !== 'flat_rate' &&
            ` (${localQuantity} ${getQuantityLabel().toLowerCase()})`}
        </Typography>
      )}
    </Box>
  );
}
