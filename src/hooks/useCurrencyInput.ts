import { useState, useCallback } from 'react';
import {
	validateCurrencyInput,
	dollarsToCents,
	getCurrencyInputProps,
	formatCurrency,
} from '@/lib/utils/currency';

export interface UseCurrencyInputOptions {
	/** Initial value in cents */
	initialCents?: number;
	/** Maximum allowed value in cents */
	maxCents?: number;
	/** Callback when value changes (receives cents) */
	onChange?: (cents: number) => void;
	/** Callback when validation fails */
	onError?: (error: string) => void;
}

export interface UseCurrencyInputReturn {
	/** Current display value (string for input field) */
	value: string;
	/** Current value in cents */
	cents: number;
	/** Whether the current value is valid */
	isValid: boolean;
	/** Error message if invalid */
	error: string | undefined;
	/** Whether value exceeds max (if maxCents provided) */
	exceedsMax: boolean;
	/** Handler for input onChange event */
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Handler for input onFocus event - clears zero */
	handleFocus: () => void;
	/** Handler for input onBlur event - formats value */
	handleBlur: () => void;
	/** Reset to initial value */
	reset: () => void;
	/** Set value programmatically (in cents) */
	setCents: (cents: number) => void;
	/** Props to spread on TextField for proper currency input */
	inputProps: ReturnType<typeof getCurrencyInputProps>;
}

/**
 * Custom hook for handling currency input fields with validation
 *
 * @example
 * ```tsx
 * const { value, cents, isValid, error, handleChange, handleBlur, inputProps } =
 *   useCurrencyInput({
 *     initialCents: 1000, // $10.00
 *     maxCents: 50000, // $500.00 max
 *     onChange: (cents) => updateOrder({ discountCents: cents }),
 *   });
 *
 * <TextField
 *   value={value}
 *   onChange={handleChange}
 *   onBlur={handleBlur}
 *   error={!isValid}
 *   helperText={error}
 *   {...inputProps}
 * />
 * ```
 */
export function useCurrencyInput({
	initialCents = 0,
	maxCents,
	onChange,
	onError,
}: UseCurrencyInputOptions = {}): UseCurrencyInputReturn {
	const [displayValue, setDisplayValue] = useState(
		(initialCents / 100).toFixed(2)
	);
	const [cents, setCentsState] = useState(initialCents);
	const [error, setError] = useState<string | undefined>();

	const exceedsMax = maxCents !== undefined && cents > maxCents;

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const inputValue = e.target.value;

			// Allow empty string
			if (inputValue === '') {
				setDisplayValue('');
				setCentsState(0);
				setError(undefined);
				onChange?.(0);
				return;
			}

			const { sanitized } = validateCurrencyInput(inputValue);
			setDisplayValue(sanitized);

			// Calculate cents
			const numericValue = parseFloat(sanitized) || 0;
			const newCents = dollarsToCents(numericValue);

			// Check against max
			if (maxCents !== undefined && newCents > maxCents) {
				const cappedCents = maxCents;
				setCentsState(cappedCents);
				setDisplayValue((cappedCents / 100).toFixed(2));
				const errorMsg = `Maximum value is ${formatCurrency(maxCents / 100)}`;
				setError(errorMsg);
				onError?.(errorMsg);
				onChange?.(cappedCents);
			} else {
				setCentsState(newCents);
				setError(undefined);
				onChange?.(newCents);
			}
		},
		[maxCents, onChange, onError]
	);

	const handleFocus = useCallback(() => {
		// Clear zero on focus for better UX
		if (
			displayValue === '0.00' ||
			displayValue === '0' ||
			displayValue === ''
		) {
			setDisplayValue('');
		}
	}, [displayValue]);

	const handleBlur = useCallback(() => {
		if (displayValue === '') {
			setDisplayValue('0.00');
			return;
		}

		// Format to 2 decimal places on blur
		const numericValue = parseFloat(displayValue) || 0;
		const formatted = numericValue.toFixed(2);
		setDisplayValue(formatted);

		// Update cents with formatted value
		const finalCents = dollarsToCents(numericValue);
		if (finalCents !== cents) {
			setCentsState(finalCents);
			onChange?.(finalCents);
		}
	}, [displayValue, cents, onChange]);

	const reset = useCallback(() => {
		const initialValue = (initialCents / 100).toFixed(2);
		setDisplayValue(initialValue);
		setCentsState(initialCents);
		setError(undefined);
	}, [initialCents]);

	const setCents = useCallback(
		(newCents: number) => {
			const formatted = (newCents / 100).toFixed(2);
			setDisplayValue(formatted);
			setCentsState(newCents);

			// Check if exceeds max
			if (maxCents !== undefined && newCents > maxCents) {
				const errorMsg = `Maximum value is ${formatCurrency(maxCents / 100)}`;
				setError(errorMsg);
				onError?.(errorMsg);
			} else {
				setError(undefined);
			}

			onChange?.(newCents);
		},
		[maxCents, onChange, onError]
	);

	return {
		value: displayValue,
		cents,
		isValid: !error,
		error,
		exceedsMax,
		handleChange,
		handleFocus,
		handleBlur,
		reset,
		setCents,
		inputProps: getCurrencyInputProps(),
	};
}
