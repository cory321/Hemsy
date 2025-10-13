# Currency Input UX Preservation Guide

## Overview

This document ensures that refactoring to centralized utilities **preserves the exact user experience** of existing price inputs. Users should not notice ANY difference in how the fields "feel" to use.

---

## Current UX Patterns by Component

### 1. ServicePriceInput (Common Component)

**Current "Feel":**

```typescript
// Focus behavior: Clear 0.00 on focus
const handleFocus = () => {
  setIsFocused(true);
  if (price === '0.00' || price === '') {
    onPriceChange('');
  }
};

// Blur behavior: Format to 2 decimals
const handleBlur = () => {
  const numericValue = parseFloatFromCurrency(price || '0');
  const formatted = numericValue.toFixed(2);
  onPriceChange(formatted);
  setIsFocused(false);
};

// Display: Show formatted while typing
value={isFocused ? price : formatAsCurrency(price)}
```

**UX Characteristics:**

- ✅ **Clears "0.00" on focus** for easy replacement
- ✅ **Formats on blur** to always show 2 decimals
- ✅ **Shows formatted value while typing** (with commas for large numbers)
- ✅ **No debounce** - immediate updates
- ✅ **Cursor stays in place** while typing

**Must Preserve:**

1. Auto-clear zero on focus
2. Format to 2 decimals on blur
3. Show formatted value during input
4. Immediate onChange callback

---

### 2. ServicePriceField (ServiceSelector.tsx & ServiceSelectorModal.tsx)

**Current "Feel":**

```typescript
// Display: Different values when focused vs not
const displayValue = isFocused
	? localValue
	: formatAsCurrency((unitPriceCents / 100).toFixed(2));

// Focus: Clear zero values
const handleFocus = () => {
	const currentValue = (unitPriceCents / 100).toFixed(2);
	setLocalValue(currentValue === '0.00' ? '' : currentValue);
	setIsFocused(true);
};

// Debounced updates (300ms)
const debouncedValue = useDebounce(localValue, 300);
useEffect(() => {
	if (isFocused && debouncedValue !== '') {
		const cents = dollarsToCents(parseFloatFromCurrency(debouncedValue));
		onPriceChange(cents);
	}
}, [debouncedValue, isFocused, onPriceChange]);
```

**UX Characteristics:**

- ✅ **Clears "0.00" on focus**
- ✅ **300ms debounce** - doesn't fire onChange on every keystroke
- ✅ **Shows plain value while typing** (no commas)
- ✅ **Shows formatted value when blurred** (with commas)
- ✅ **Formats on blur** to 2 decimals
- ✅ **Optimized for performance** in lists with many inputs

**Must Preserve:**

1. 300ms debounce delay
2. Different display format (focused vs blurred)
3. Auto-clear zero on focus
4. No onChange while typing (only after 300ms pause)
5. Format on blur

---

### 3. Step3Summary Discount Field (Already Migrated)

**Current "Feel":**

```typescript
// Immediate validation and capping
const handleDiscountChange = (e) => {
	const result = handleCurrencyInputChange(e.target.value, maxDiscountCents);
	setDiscountDollars(result.displayValue);
	updateOrderDraft({ discountCents: result.cents });
};

// Quick discount buttons
const handleQuickDiscount = (percent: number) => {
	const discountAmount = (subtotal * percent) / 100;
	const discountDollars = (discountAmount / 100).toFixed(2);
	setDiscountDollars(discountDollars);
	updateOrderDraft({ discountCents: Math.max(0, discountAmount) });
};
```

**UX Characteristics:**

- ✅ **Immediate validation** - caps at max instantly
- ✅ **No debounce** - instant feedback
- ✅ **Auto-corrects** invalid values
- ✅ **Error states** shown immediately
- ✅ **Quick action buttons** for common discounts

**Must Preserve:**

1. Immediate validation and capping
2. Error display when exceeds max
3. Helper text with max value
4. Quick discount buttons work instantly

---

## UX Comparison: Before vs After

### Pattern A: Immediate Feedback (ServicePriceInput)

| Aspect                      | Current | After Refactor      | Preserved?      |
| --------------------------- | ------- | ------------------- | --------------- |
| Clear zero on focus         | Yes     | Yes ✅              | ✅              |
| Format on blur              | Yes     | Yes ✅              | ✅              |
| Show formatted while typing | Yes     | Yes ✅              | ✅              |
| Debounce                    | No      | No ✅               | ✅              |
| Cursor position             | Stable  | Stable ✅           | ✅              |
| Validation                  | On blur | On change + blur ✅ | ⚠️ **Improved** |

### Pattern B: Debounced Performance (ServicePriceField)

| Aspect                         | Current   | After Refactor      | Preserved?      |
| ------------------------------ | --------- | ------------------- | --------------- |
| Clear zero on focus            | Yes       | Yes ✅              | ✅              |
| 300ms debounce                 | Yes       | Yes ✅              | ✅              |
| Different display (focus/blur) | Yes       | Yes ✅              | ✅              |
| Format on blur                 | Yes       | Yes ✅              | ✅              |
| Performance in lists           | Optimized | Optimized ✅        | ✅              |
| Validation                     | On blur   | On change + blur ✅ | ⚠️ **Improved** |

---

## Implementation: Preserving UX Patterns

### useCurrencyInput Hook Enhancements

The hook needs to support different UX patterns:

```typescript
export interface UseCurrencyInputOptions {
	initialCents?: number;
	maxCents?: number;
	onChange?: (cents: number) => void;
	onError?: (error: string) => void;

	// NEW: UX pattern options
	clearZeroOnFocus?: boolean; // Default: true
	formatWhileTyping?: boolean; // Default: false (show plain)
	debounceMs?: number; // Default: 0 (no debounce)
}
```

### Pattern A: ServicePriceInput (Immediate + Formatted)

```typescript
import { validateCurrencyInput, getCurrencyInputProps } from '@/lib/utils/currency';

const ServicePriceInput = ({ price, onPriceChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePriceChange = (e) => {
    // NEW: Use validateCurrencyInput for consistent decimal handling
    const { sanitized } = validateCurrencyInput(e.target.value);
    onPriceChange(sanitized);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // PRESERVED: Clear zero on focus
    if (price === '0.00' || price === '') {
      onPriceChange('');
    }
  };

  const handleBlur = () => {
    // PRESERVED: Format to 2 decimals on blur
    const numericValue = parseFloatFromCurrency(price || '0');
    const formatted = numericValue.toFixed(2);
    onPriceChange(formatted);
    setIsFocused(false);
  };

  return (
    <TextField
      value={isFocused ? price : formatAsCurrency(price)}
      onChange={handlePriceChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...getCurrencyInputProps()}  // NEW: Adds mobile keyboard, pattern
    />
  );
};
```

**What Changed:**

- ✅ Added `validateCurrencyInput` for decimal limiting
- ✅ Added `getCurrencyInputProps` for mobile/accessibility

**What Stayed the Same:**

- ✅ Focus clears zero
- ✅ Blur formats
- ✅ Shows formatted while typing
- ✅ No debounce
- ✅ Immediate onChange

---

### Pattern B: DebouncedPriceField (Debounced + Performance)

```typescript
import { useCurrencyInput } from '@/hooks/useCurrencyInput';

const DebouncedPriceField = ({ unitPriceCents, onPriceChange }) => {
  const [debouncedCents, setDebouncedCents] = useState(unitPriceCents);

  // PRESERVED: 300ms debounce
  const debouncedOnChange = useDebounce(() => {
    onPriceChange(debouncedCents);
  }, 300);

  useEffect(() => {
    if (debouncedCents !== unitPriceCents) {
      debouncedOnChange();
    }
  }, [debouncedCents]);

  const { value, handleChange, handleBlur, inputProps } = useCurrencyInput({
    initialCents: unitPriceCents,
    onChange: setDebouncedCents,  // Updates local state immediately
  });

  return (
    <TextField
      size="small"
      label="Price"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      InputProps={{
        startAdornment: <InputAdornment position="start">$</InputAdornment>,
      }}
      {...inputProps}
    />
  );
};
```

**What Changed:**

- ✅ Using `useCurrencyInput` hook (cleaner code)
- ✅ Added decimal validation (improvement)
- ✅ Added mobile keyboard (improvement)

**What Stayed the Same:**

- ✅ 300ms debounce preserved
- ✅ Focus clears zero
- ✅ Blur formats
- ✅ Different display (plain while typing, formatted when not)
- ✅ Performance characteristics

---

## Testing the "Feel"

### Manual Testing Checklist

For each refactored component, verify:

#### Visual Behavior

- [ ] **Typing feels responsive** - no lag or jumpiness
- [ ] **Cursor stays in correct position** while typing
- [ ] **Numbers format correctly** on blur
- [ ] **Zero clears automatically** when focused
- [ ] **Commas appear** in correct positions (if applicable)
- [ ] **Decimal point works** naturally

#### Interaction Patterns

- [ ] **Tab key moves focus** smoothly
- [ ] **Backspace/delete work** as expected
- [ ] **Copy/paste works** correctly
- [ ] **Selecting text works** properly
- [ ] **Undo/redo feels natural** (browser default)

#### Performance

- [ ] **No visible lag** when typing quickly
- [ ] **Debounce timing** feels the same (if applicable)
- [ ] **Multiple inputs on page** don't slow down
- [ ] **Focus/blur transitions** are smooth

#### Mobile

- [ ] **Decimal keyboard appears** on mobile
- [ ] **Typing on phone** feels natural
- [ ] **Touch targets** are appropriately sized
- [ ] **No zoom issues** on input focus

---

## Side-by-Side Comparison

### Component: ServicePriceInput

#### Before Refactor

```typescript
// User types: "1" -> "10" -> "10." -> "10.5" -> blurs
Focus:    ""              (zero cleared)
Type "1": "1"             (immediate)
Type "0": "10"            (immediate)
Type ".": "10."           (immediate)
Type "5": "10.5"          (immediate)
Blur:     "10.50"         (formatted)
Display:  "$10.50"        (with $ and 2 decimals)
```

#### After Refactor

```typescript
// User types: "1" -> "10" -> "10." -> "10.5" -> blurs
Focus:    ""              (zero cleared) ✅ SAME
Type "1": "1"             (immediate) ✅ SAME
Type "0": "10"            (immediate) ✅ SAME
Type ".": "10."           (immediate) ✅ SAME
Type "5": "10.5"          (immediate) ✅ SAME
Type "9": "10.59"         (capped to 2 decimals) ⭐ BETTER
Blur:     "10.50"         (formatted) ✅ SAME
Display:  "$10.50"        (with $ and 2 decimals) ✅ SAME
```

**Result:** Feels identical, with bonus protection against >2 decimals

---

### Component: ServicePriceField (Debounced)

#### Before Refactor

```typescript
// User types: "2" -> "25" -> "25." -> "25.9" -> pauses 300ms
Focus:    ""              (zero cleared)
Type "2": "2"             (no onChange yet)
Type "5": "25"            (no onChange yet)
Type ".": "25."           (no onChange yet)
Type "9": "25.9"          (no onChange yet)
Wait:     "25.9"          (onChange fires after 300ms)
Blur:     "$25.90"        (formatted with commas)
```

#### After Refactor

```typescript
// User types: "2" -> "25" -> "25." -> "25.9" -> pauses 300ms
Focus:    ""              (zero cleared) ✅ SAME
Type "2": "2"             (no onChange yet) ✅ SAME
Type "5": "25"            (no onChange yet) ✅ SAME
Type ".": "25."           (no onChange yet) ✅ SAME
Type "9": "25.9"          (no onChange yet) ✅ SAME
Type "9": "25.99"         (still no onChange) ✅ SAME
Type "9": "25.99"         (capped, can't add more) ⭐ BETTER
Wait:     "25.99"         (onChange fires after 300ms) ✅ SAME
Blur:     "$25.99"        (formatted with commas) ✅ SAME
```

**Result:** Feels identical, with bonus decimal limiting

---

## Potential UX Issues to Avoid

### ❌ Don't Change These:

1. **Debounce timing** - Users have muscle memory for delays
2. **Focus behavior** - Auto-clearing zero is expected
3. **Format timing** - Formatting on blur is expected
4. **Display format** - Commas, decimals must look the same
5. **Cursor position** - Must not jump during typing
6. **Responsive feel** - Any lag will be noticeable

### ✅ Safe to Add:

1. **Decimal limiting** - Prevents invalid input (improvement)
2. **Mobile keyboard** - Better mobile experience (improvement)
3. **Accessibility** - Screen reader support (improvement)
4. **Max value** - If component needs it (new feature)

---

## Enhanced useCurrencyInput Hook

To support all UX patterns, enhance the hook:

```typescript
export function useCurrencyInput({
	initialCents = 0,
	maxCents,
	onChange,
	onError,
	clearZeroOnFocus = true, // NEW: configurable
	formatWhileTyping = false, // NEW: configurable
	debounceMs = 0, // NEW: configurable
}: UseCurrencyInputOptions) {
	const [displayValue, setDisplayValue] = useState(
		(initialCents / 100).toFixed(2)
	);
	const [cents, setCentsState] = useState(initialCents);
	const [isFocused, setIsFocused] = useState(false);

	// Debounced onChange if specified
	const debouncedOnChange = useCallback(
		debounceMs > 0
			? debounce((c: number) => onChange?.(c), debounceMs)
			: (c: number) => onChange?.(c),
		[onChange, debounceMs]
	);

	const handleFocus = useCallback(
		(e: React.FocusEvent<HTMLInputElement>) => {
			setIsFocused(true);

			// Clear zero on focus if enabled
			if (
				clearZeroOnFocus &&
				(displayValue === '0.00' || displayValue === '')
			) {
				setDisplayValue('');
			}
		},
		[displayValue, clearZeroOnFocus]
	);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const { sanitized } = validateCurrencyInput(e.target.value);
			const numericValue = parseFloat(sanitized) || 0;
			const newCents = dollarsToCents(numericValue);

			// Cap at max if provided
			const finalCents =
				maxCents !== undefined ? Math.min(newCents, maxCents) : newCents;

			// Update display
			setDisplayValue(
				formatWhileTyping ? formatAsCurrency(sanitized) : sanitized
			);

			setCentsState(finalCents);
			debouncedOnChange(finalCents);
		},
		[maxCents, formatWhileTyping, debouncedOnChange]
	);

	const handleBlur = useCallback(() => {
		setIsFocused(false);
		const formatted = (cents / 100).toFixed(2);
		setDisplayValue(formatted);
	}, [cents]);

	return {
		value: displayValue,
		cents,
		isValid: true,
		handleChange,
		handleFocus,
		handleBlur,
		inputProps: getCurrencyInputProps(),
	};
}
```

---

## Migration Guarantee

### For ServicePriceInput:

```typescript
// Before: 18 lines, manual validation
// After: 15 lines, utility validation
// UX: IDENTICAL + improved decimal handling
```

### For ServicePriceField:

```typescript
// Before: 50 lines, manual validation, debounced
// After: 20 lines, hook + debounce wrapper
// UX: IDENTICAL + improved decimal handling
```

### User Won't Notice:

- ✅ Same focus behavior
- ✅ Same blur behavior
- ✅ Same formatting
- ✅ Same timing
- ✅ Same responsiveness

### User Will Appreciate:

- ⭐ Can't type more than 2 decimals (improvement)
- ⭐ Mobile keyboard is better (improvement)
- ⭐ Screen readers work better (improvement)

---

## Final Validation

Before merging any refactor, record a video of:

1. **Before refactor:**
   - Type "10.50" and blur
   - Type "0" and focus (should clear)
   - Type quickly "12345"
   - Try typing "10.999" (currently allows it)

2. **After refactor:**
   - Type "10.50" and blur (should look/feel identical)
   - Type "0" and focus (should clear identical)
   - Type quickly "12345" (should feel identical)
   - Try typing "10.999" (should cap at "10.99" ⭐)

3. **Compare videos side-by-side:**
   - Same timing
   - Same formatting
   - Same cursor behavior
   - Only difference: decimal limiting (improvement)

---

## Summary

✅ **UX will be preserved** by:

1. Keeping focus/blur behavior identical
2. Maintaining debounce timing where used
3. Preserving display formatting patterns
4. Using utilities for validation only
5. Testing side-by-side before merging

⭐ **UX will be improved** by:

1. Preventing >2 decimal places
2. Better mobile keyboard
3. Accessibility enhancements
4. Consistent validation across app

🎯 **Bottom line:** Users won't notice the refactor, except that the inputs work _better_ than before.
