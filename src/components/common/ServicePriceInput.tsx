'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import {
	TextField,
	InputAdornment,
	Box,
	Select,
	MenuItem,
	Typography,
} from '@mui/material';
import {
	formatAsCurrency,
	parseFloatFromCurrency,
	validateCurrencyInput,
	getCurrencyInputProps,
} from '@/lib/utils/currency';

interface ServicePriceInputProps {
	price: string;
	unit: 'flat_rate' | 'hour' | 'day';
	quantity?: number;
	onPriceChange: (price: string) => void;
	onUnitChange: (unit: 'flat_rate' | 'hour' | 'day') => void;
	onQuantityChange?: (quantity: number) => void;
	disabled?: boolean;
	showTotal?: boolean;
	error?: string;
}

const ServicePriceInput = forwardRef<HTMLInputElement, ServicePriceInputProps>(
	(
		{
			price,
			unit,
			quantity = 1,
			onPriceChange,
			onUnitChange,
			onQuantityChange,
			disabled = false,
			showTotal = true,
			error,
		},
		ref
	) => {
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
			// Use centralized validation for consistent decimal handling
			const { sanitized } = validateCurrencyInput(e.target.value);
			onPriceChange(sanitized);
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

		// Get quantity label - use short label that fits in small field
		const getQuantityLabel = () => {
			return 'Qty';
		};

		// Get unit display name for the total text
		const getUnitDisplayName = () => {
			switch (unit) {
				case 'hour':
					return localQuantity === 1 ? 'hour' : 'hours';
				case 'day':
					return localQuantity === 1 ? 'day' : 'days';
				default:
					return 'unit';
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
							startAdornment: (
								<InputAdornment position="start">$</InputAdornment>
							),
						}}
						{...getCurrencyInputProps()}
						disabled={disabled}
						inputRef={ref}
					/>
					{unit !== 'flat_rate' && (
						<TextField
							label={getQuantityLabel()}
							placeholder="1"
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
						MenuProps={{
							disableScrollLock: true,
						}}
					>
						<MenuItem value="flat_rate">flat rate</MenuItem>
						<MenuItem value="hour">per hour</MenuItem>
						<MenuItem value="day">per day</MenuItem>
					</Select>
				</Box>
				{error && (
					<Typography
						variant="caption"
						color="error"
						sx={{ mt: 1, mb: 1, display: 'block' }}
					>
						{error}
					</Typography>
				)}
				{showTotal && (
					<Typography variant="h6" sx={{ mt: error ? 1 : 2 }}>
						Total: ${total.toFixed(2)}
						{unit !== 'flat_rate' &&
							` (${localQuantity} ${getUnitDisplayName()})`}
					</Typography>
				)}
			</Box>
		);
	}
);

ServicePriceInput.displayName = 'ServicePriceInput';

export default ServicePriceInput;
