import React, { useState, useEffect, useCallback } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { useCurrencyInput } from '@/hooks/useCurrencyInput';
import { dollarsToCents, parseFloatFromCurrency } from '@/lib/utils/currency';

interface DebouncedPriceFieldProps {
	unitPriceCents: number;
	onPriceChange: (cents: number) => void;
	label?: string;
	size?: 'small' | 'medium';
	disabled?: boolean;
}

/**
 * Debounced price input field optimized for performance
 *
 * Used in ServiceSelector and ServiceSelectorModal for inline price editing.
 * Features 300ms debounce to prevent excessive re-renders in lists.
 *
 * UX Characteristics:
 * - Clears "0.00" on focus
 * - 300ms debounce - doesn't fire onChange on every keystroke
 * - Shows plain value while typing
 * - Shows formatted value when blurred
 * - Formats on blur to 2 decimals
 */
export const DebouncedPriceField = React.memo(
	function DebouncedPriceField({
		unitPriceCents,
		onPriceChange,
		label = 'Price',
		size = 'small',
		disabled = false,
	}: DebouncedPriceFieldProps) {
		const [debouncedCents, setDebouncedCents] = useState(unitPriceCents);
		const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

		// Update debounced cents when prop changes (external update)
		useEffect(() => {
			setDebouncedCents(unitPriceCents);
		}, [unitPriceCents]);

		// Debounce the onChange callback by 300ms
		useEffect(() => {
			// Clear any existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Only trigger onChange if the value actually changed and it's different from prop
			if (debouncedCents !== unitPriceCents) {
				const id = setTimeout(() => {
					onPriceChange(debouncedCents);
				}, 300);
				setTimeoutId(id);
			}

			// Cleanup on unmount
			return () => {
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			};
		}, [debouncedCents]); // Only depend on debouncedCents

		const handleLocalChange = useCallback((cents: number) => {
			setDebouncedCents(cents);
		}, []);

		const { value, handleChange, handleBlur, handleFocus, inputProps } =
			useCurrencyInput({
				initialCents: unitPriceCents,
				onChange: handleLocalChange,
			});

		// Sync value when prop changes
		useEffect(() => {
			if (unitPriceCents !== debouncedCents) {
				setDebouncedCents(unitPriceCents);
			}
		}, [unitPriceCents]);

		return (
			<TextField
				size={size}
				label={label}
				value={value}
				onChange={handleChange}
				onFocus={handleFocus}
				onBlur={handleBlur}
				disabled={disabled}
				InputProps={{
					startAdornment: <InputAdornment position="start">$</InputAdornment>,
				}}
				{...inputProps}
			/>
		);
	},
	// Custom comparison - only re-render if unitPriceCents changes significantly
	(prevProps, nextProps) =>
		prevProps.unitPriceCents === nextProps.unitPriceCents &&
		prevProps.disabled === nextProps.disabled
);
