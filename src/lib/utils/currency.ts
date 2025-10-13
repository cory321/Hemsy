export const formatAsCurrency = (value: string | number): string => {
	// Remove all non-numeric characters except periods
	let numericValue = value.toString().replace(/[^0-9.]/g, '');

	// If there are multiple periods, keep only the first one
	const firstPeriodIndex = numericValue.indexOf('.');
	if (firstPeriodIndex !== -1) {
		numericValue =
			numericValue.substring(0, firstPeriodIndex + 1) +
			numericValue.substring(firstPeriodIndex + 1).replace(/\./g, '');
	}

	// Add leading zero if string starts with period
	if (numericValue.startsWith('.')) {
		numericValue = '0' + numericValue;
	}

	const parts = numericValue.split('.');

	if (parts[0]) {
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	} else if (parts.length > 1) {
		// If there's no whole number part but there is a decimal, add zero
		parts[0] = '0';
	}

	if (parts[1]) {
		parts[1] = parts[1].slice(0, 2); // Limit to 2 decimal places
	}

	return parts.join('.');
};

export const parseFloatFromCurrency = (value: string | number): number => {
	// Remove all non-numeric characters except periods
	let numericValue = value.toString().replace(/[^0-9.]/g, '');

	// If there are multiple periods, keep only the first one
	const firstPeriodIndex = numericValue.indexOf('.');
	if (firstPeriodIndex !== -1) {
		numericValue =
			numericValue.substring(0, firstPeriodIndex + 1) +
			numericValue.substring(firstPeriodIndex + 1).replace(/\./g, '');
	}

	return parseFloat(numericValue) || 0;
};

export const formatCurrency = (value: number): string => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value);
};

export const formatUnitPrice = (
	displayUnitPrice: string,
	setDisplayUnitPrice: (value: string) => void,
	setNewService: (fn: (prev: any) => any) => void
) => {
	const numericValue = parseFloatFromCurrency(displayUnitPrice);
	const formatted = numericValue.toFixed(2);

	setDisplayUnitPrice(formatAsCurrency(formatted));
	setNewService((prev: any) => ({ ...prev, unit_price: numericValue }));
};

// Convert dollars to cents
export const dollarsToCents = (dollars: number): number => {
	return Math.round(dollars * 100);
};

// Convert cents to dollars
export const centsToDollars = (cents: number): number => {
	return cents / 100;
};

// Format cents as currency string
export const formatCentsAsCurrency = (cents: number): string => {
	return formatCurrency(centsToDollars(cents));
};

/**
 * Validates and sanitizes currency input to ensure proper format
 * - Removes non-numeric characters (except decimal point)
 * - Prevents multiple decimal points
 * - Limits to 2 decimal places
 * - Returns sanitized value or null if invalid
 */
export const validateCurrencyInput = (
	value: string
): { isValid: boolean; sanitized: string; error?: string } => {
	// Allow empty string
	if (value === '') {
		return { isValid: true, sanitized: '' };
	}

	// Remove any non-numeric characters except decimal point
	let cleaned = value.replace(/[^\d.]/g, '');

	// Check for multiple decimal points
	const decimalCount = (cleaned.match(/\./g) || []).length;
	if (decimalCount > 1) {
		// Keep only the first decimal point
		const firstDecimalIndex = cleaned.indexOf('.');
		cleaned =
			cleaned.substring(0, firstDecimalIndex + 1) +
			cleaned.substring(firstDecimalIndex + 1).replace(/\./g, '');
	}

	// Limit to 2 decimal places
	const parts = cleaned.split('.');
	if (parts[1] && parts[1].length > 2) {
		cleaned = `${parts[0]}.${parts[1].substring(0, 2)}`;
	}

	return {
		isValid: true,
		sanitized: cleaned,
	};
};

/**
 * Handles currency input change with automatic validation and formatting
 * Use this for controlled currency input fields
 */
export const handleCurrencyInputChange = (
	inputValue: string,
	maxValue?: number
): {
	displayValue: string;
	cents: number;
	isValid: boolean;
	error?: string;
} => {
	const { sanitized } = validateCurrencyInput(inputValue);

	const numericValue = parseFloatFromCurrency(sanitized || '0');
	const cents = dollarsToCents(numericValue);

	// Check against max value if provided
	if (maxValue !== undefined && cents > maxValue) {
		return {
			displayValue: (maxValue / 100).toFixed(2),
			cents: maxValue,
			isValid: false,
			error: `Maximum value is ${formatCurrency(maxValue / 100)}`,
		};
	}

	return {
		displayValue: sanitized,
		cents,
		isValid: true,
	};
};

/**
 * Currency input props for TextField components
 * Provides consistent attributes for currency input fields
 */
export const getCurrencyInputProps = () => ({
	type: 'text' as const,
	inputMode: 'decimal' as const,
	inputProps: {
		inputMode: 'decimal' as const,
		pattern: '[0-9]*(\\.[0-9]{0,2})?',
		title: 'Enter a valid amount with up to 2 decimal places',
	},
});
