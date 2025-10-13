# Currency Input Utilities Guide

## Overview

Hemsy now has centralized, reusable utilities for handling currency input fields with proper validation. This ensures consistency across the app and prevents common issues like invalid decimal places, exceeding maximum values, or negative amounts.

## When to Use

Use these utilities for ANY price/currency input field in the application:

- ✅ Service pricing
- ✅ Discount fields
- ✅ Payment amounts
- ✅ Invoice totals
- ✅ Any monetary input

## Core Utilities (`src/lib/utils/currency.ts`)

### 1. `validateCurrencyInput(value: string)`

Validates and sanitizes raw input to ensure proper currency format.

```typescript
import { validateCurrencyInput } from '@/lib/utils/currency';

const { isValid, sanitized, error } = validateCurrencyInput('$10.999');
// Result: { isValid: true, sanitized: '10.99', error: undefined }
```

**Features:**

- Removes non-numeric characters (except decimal)
- Prevents multiple decimal points
- Limits to 2 decimal places
- Returns sanitized value

### 2. `handleCurrencyInputChange(inputValue: string, maxValue?: number)`

Comprehensive handler for onChange events with optional max value validation.

```typescript
import { handleCurrencyInputChange } from '@/lib/utils/currency';

const result = handleCurrencyInputChange('150.00', 10000); // max $100.00
// Result: {
//   displayValue: '100.00',
//   cents: 10000,
//   isValid: false,
//   error: 'Maximum value is $100.00'
// }
```

**Returns:**

- `displayValue`: Formatted string for input field
- `cents`: Value in cents (integer)
- `isValid`: Boolean validation status
- `error`: Error message if invalid

### 3. `getCurrencyInputProps()`

Returns standard props for Material-UI TextField components.

```typescript
import { getCurrencyInputProps } from '@/lib/utils/currency';

<TextField
  {...getCurrencyInputProps()}
  // Provides: type="text", inputMode="decimal", pattern, title
/>
```

**Provides:**

- `type: 'text'` - Better than 'number' for currency
- `inputMode: 'decimal'` - Shows decimal keyboard on mobile
- `pattern: '[0-9]*(\\.[0-9]{0,2})?'` - HTML5 validation
- `title` - Accessible hint text

## React Hook (`src/hooks/useCurrencyInput.ts`)

### `useCurrencyInput(options)`

Complete React hook that manages all currency input state and validation.

**Options:**

```typescript
interface UseCurrencyInputOptions {
	initialCents?: number; // Starting value in cents
	maxCents?: number; // Maximum allowed value
	onChange?: (cents: number) => void; // Callback on change
	onError?: (error: string) => void; // Callback on error
}
```

**Returns:**

```typescript
interface UseCurrencyInputReturn {
	value: string; // Display value for input
	cents: number; // Value in cents
	isValid: boolean; // Validation status
	error: string | undefined; // Error message
	exceedsMax: boolean; // Whether exceeds max
	handleChange: (e) => void; // onChange handler
	handleBlur: () => void; // onBlur handler (formats)
	reset: () => void; // Reset to initial
	setCents: (cents) => void; // Set value programmatically
	inputProps: object; // Props to spread on TextField
}
```

## Usage Examples

### Example 1: Simple Price Input

```tsx
import { useCurrencyInput } from '@/hooks/useCurrencyInput';

function ServicePriceInput() {
	const { value, cents, handleChange, handleBlur, inputProps } =
		useCurrencyInput({
			initialCents: 0,
			onChange: (cents) => savePrice(cents),
		});

	return (
		<TextField
			label="Price"
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			InputProps={{ startAdornment: '$' }}
			{...inputProps}
		/>
	);
}
```

### Example 2: Discount with Maximum

```tsx
import { useCurrencyInput } from '@/hooks/useCurrencyInput';

function DiscountInput({ subtotalCents }) {
	const {
		value,
		cents,
		isValid,
		error,
		exceedsMax,
		handleChange,
		handleBlur,
		inputProps,
	} = useCurrencyInput({
		initialCents: 0,
		maxCents: subtotalCents,
		onChange: (cents) => updateDiscount(cents),
		onError: (error) => console.error(error),
	});

	return (
		<TextField
			label="Discount"
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			error={!isValid || exceedsMax}
			helperText={error || (exceedsMax ? 'Exceeds subtotal' : '')}
			InputProps={{ startAdornment: '$' }}
			{...inputProps}
		/>
	);
}
```

### Example 3: Using Utilities Directly

```tsx
import {
	handleCurrencyInputChange,
	getCurrencyInputProps,
} from '@/lib/utils/currency';

function CustomPriceField() {
	const [value, setValue] = useState('0.00');

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const result = handleCurrencyInputChange(e.target.value, 100000); // $1000 max
		setValue(result.displayValue);

		if (result.isValid) {
			onPriceChange(result.cents);
		}
	};

	return (
		<TextField
			value={value}
			onChange={handleChange}
			InputProps={{ startAdornment: '$' }}
			{...getCurrencyInputProps()}
		/>
	);
}
```

## Migrating Existing Code

### Before (Inconsistent Validation)

```tsx
const handlePriceChange = (e) => {
	let value = e.target.value;
	value = value.replace(/[^\d.]/g, '');

	// Manual decimal handling
	const parts = value.split('.');
	if (parts[1] && parts[1].length > 2) {
		value = `${parts[0]}.${parts[1].substring(0, 2)}`;
	}

	setPrice(value);
};
```

### After (Using Utilities)

```tsx
import { useCurrencyInput } from '@/hooks/useCurrencyInput';

const { value, handleChange, handleBlur, inputProps } = useCurrencyInput({
	onChange: (cents) => updatePrice(cents),
});
```

## Best Practices

1. **Always use cents internally**
   - Store values as integer cents in state/database
   - Convert to dollars only for display
   - Prevents floating-point precision issues

2. **Use the hook for new components**
   - Simplest and most consistent approach
   - Handles all edge cases
   - Includes proper TypeScript types

3. **Use utilities for complex cases**
   - When you need custom behavior
   - When integrating with existing code
   - When you need more control

4. **Always set max values**
   - For discounts: max = subtotal
   - For payments: max = balance due
   - Prevents user errors and backend issues

5. **Provide clear feedback**
   - Show error states (red border)
   - Display helper text with limits
   - Use `helperText` prop for guidance

## Testing

All utilities are fully tested:

- ✅ Decimal place validation
- ✅ Maximum value capping
- ✅ Multiple decimal point handling
- ✅ Non-numeric character stripping
- ✅ Empty value handling
- ✅ Mobile keyboard behavior

See: `src/__tests__/unit/utils/currency.test.ts`

## Common Patterns

### Discount Field

```tsx
const { value, handleChange, handleBlur, inputProps } = useCurrencyInput({
	maxCents: subtotalCents,
	onChange: (cents) => updateOrderDraft({ discountCents: cents }),
});
```

### Service Price Field

```tsx
const { value, cents, handleChange, handleBlur, inputProps } = useCurrencyInput(
	{
		initialCents: service.unit_price_cents,
		onChange: (cents) => updateService({ ...service, unit_price_cents: cents }),
	}
);
```

### Invoice Payment Field

```tsx
const { value, handleChange, handleBlur, inputProps, error } = useCurrencyInput(
	{
		maxCents: invoice.balance_cents,
		onChange: (cents) => setPaymentAmount(cents),
		onError: (err) => showToast(err, 'error'),
	}
);
```

## Migration Checklist

When updating existing price fields:

1. ✅ Import `useCurrencyInput` or utility functions
2. ✅ Replace manual validation logic
3. ✅ Use `cents` for internal state (not dollars)
4. ✅ Add `maxCents` if applicable
5. ✅ Spread `{...inputProps}` on TextField
6. ✅ Test with edge cases (empty, max, decimals)
7. ✅ Update tests to use new utilities

## Support

For questions or issues with currency inputs:

- See examples in `src/components/orders/steps/Step3Summary.tsx`
- Check tests in `src/__tests__/unit/utils/currency.test.ts`
- Review hook implementation in `src/hooks/useCurrencyInput.ts`
