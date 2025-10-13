# Currency Input Migration Plan

## Summary

Found **5 components** with manual currency validation that can be refactored to use centralized utilities. This will eliminate ~150 lines of duplicate code and ensure consistent behavior.

## Components to Migrate

### 🎯 High Priority

#### 1. **ServicePriceInput.tsx** (Lines 57-74)

**Location:** `src/components/common/ServicePriceInput.tsx`
**Current Implementation:** Manual formatAsCurrency/parseFloatFromCurrency
**Impact:** HIGH - Used by CreateServiceDialog and EditServiceDialog
**Lines of code to remove:** ~18 lines

**Current Code:**

```typescript
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
```

**Refactor Approach:**

- This component manages price as a **string** prop
- Can't use `useCurrencyInput` directly (prop-driven, not state-driven)
- Should use `validateCurrencyInput` and `getCurrencyInputProps` utilities
- Keep existing API for backward compatibility

**Recommended Solution:**

```typescript
import { validateCurrencyInput, getCurrencyInputProps } from '@/lib/utils/currency';

const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { sanitized } = validateCurrencyInput(e.target.value);
  onPriceChange(sanitized);
};

const handleBlur = () => {
  const numericValue = parseFloatFromCurrency(price || '0');
  const formatted = numericValue.toFixed(2);
  onPriceChange(formatted);
  setIsFocused(false);
};

// Add to TextField:
<TextField
  {...getCurrencyInputProps()}
  // ... other props
/>
```

---

#### 2. **ServiceSelector.tsx - ServicePriceField** (Lines 654-722)

**Location:** `src/components/orders/ServiceSelector.tsx`
**Current Implementation:** Debounced manual validation
**Impact:** HIGH - Used in order flow for editing service prices
**Lines of code to remove:** ~50 lines
**Special:** Uses debounced input for performance

**Current Code:**

```typescript
const ServicePriceField = React.memo(function ServicePriceField({
	unitPriceCents,
	onPriceChange,
}) {
	const [localValue, setLocalValue] = useState('');
	const [isFocused, setIsFocused] = useState(false);
	const debouncedValue = useDebounce(localValue, 300);

	useEffect(() => {
		if (isFocused && debouncedValue !== '') {
			const cents = dollarsToCents(parseFloatFromCurrency(debouncedValue));
			onPriceChange(cents);
		}
	}, [debouncedValue, isFocused, onPriceChange]);

	const handleChange = (e) => {
		setLocalValue(formatAsCurrency(e.target.value));
	};
	// ... more logic
});
```

**Refactor Approach:**

- Convert cents to dollars, use `useCurrencyInput` hook
- Add debounce to `onChange` callback
- Simplifies to ~15 lines

**Recommended Solution:**

```typescript
import { useCurrencyInput } from '@/hooks/useCurrencyInput';
import { useDebounce } from '@/hooks/useDebounce';

const ServicePriceField = React.memo(function ServicePriceField({
  unitPriceCents,
  onPriceChange,
}) {
  const [debouncedCents, setDebouncedCents] = useState(unitPriceCents);

  useEffect(() => {
    onPriceChange(debouncedCents);
  }, [useDebounce(debouncedCents, 300)]);

  const { value, handleChange, handleBlur, inputProps } = useCurrencyInput({
    initialCents: unitPriceCents,
    onChange: setDebouncedCents,
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
});
```

---

#### 3. **ServiceSelectorModal.tsx - ServicePriceField** (Lines 725-794)

**Location:** `src/components/orders/ServiceSelectorModal.tsx`
**Current Implementation:** IDENTICAL to ServiceSelector.tsx
**Impact:** HIGH - Duplicate code
**Lines of code to remove:** ~50 lines
**Note:** This is an exact duplicate of #2

**Refactor Approach:**

- Same as ServiceSelector.tsx
- Consider extracting to shared component if both are identical

**Recommendation:**

1. Create shared `DebouncedPriceField` component in `src/components/common/`
2. Use in both ServiceSelector and ServiceSelectorModal
3. Eliminates 100 lines of duplicate code

---

### 🔸 Medium Priority

#### 4. **CreateServiceDialog.tsx** (Lines 81-91)

**Location:** `src/components/services/CreateServiceDialog.tsx`
**Current Implementation:** Uses ServicePriceInput (which needs refactoring first)
**Impact:** MEDIUM - Will automatically improve once ServicePriceInput is refactored
**Action Required:** None directly, but could simplify state management

**Current Code:**

```typescript
const handlePriceChange = (newPrice: string) => {
	setPrice(newPrice);
	setNewService((prev) => ({
		...prev,
		unit_price: parseFloatFromCurrency(newPrice),
	}));
	if (priceError && parseFloatFromCurrency(newPrice) > 0) {
		setPriceError(null);
	}
};
```

**Potential Improvement:**
Could use `useCurrencyInput` directly instead of ServicePriceInput + manual state:

```typescript
const { value, cents, handleChange, handleBlur, inputProps } = useCurrencyInput(
	{
		onChange: (cents) => {
			setNewService((prev) => ({ ...prev, unit_price: cents / 100 }));
			if (priceError && cents > 0) setPriceError(null);
		},
	}
);
```

---

#### 5. **EditServiceDialog.tsx** (Lines 86-92)

**Location:** `src/components/services/EditServiceDialog.tsx`
**Current Implementation:** Uses ServicePriceInput (which needs refactoring first)
**Impact:** MEDIUM - Will automatically improve once ServicePriceInput is refactored
**Action Required:** Similar to CreateServiceDialog

---

## Migration Strategy

### Phase 1: Core Components (Week 1)

1. ✅ **ServicePriceInput.tsx**
   - Refactor to use `validateCurrencyInput` and `getCurrencyInputProps`
   - Add tests
   - Verify in CreateServiceDialog and EditServiceDialog

### Phase 2: Deduplicate (Week 1)

2. ✅ **Create DebouncedPriceField Component**
   - Extract common logic from ServiceSelector and ServiceSelectorModal
   - Use `useCurrencyInput` with debounced callback
   - Add to `src/components/common/DebouncedPriceField.tsx`

3. ✅ **ServiceSelector.tsx**
   - Replace ServicePriceField with DebouncedPriceField
   - Test in order flow

4. ✅ **ServiceSelectorModal.tsx**
   - Replace ServicePriceField with DebouncedPriceField
   - Test in modal contexts

### Phase 3: Optimization (Optional, Week 2)

5. 🔸 **CreateServiceDialog.tsx**
   - Consider using `useCurrencyInput` directly
   - Simplify state management

6. 🔸 **EditServiceDialog.tsx**
   - Consider using `useCurrencyInput` directly
   - Simplify state management

---

## Impact Analysis

### Code Reduction

- **Before:** ~150 lines of manual validation across 5 components
- **After:** ~30 lines using utilities
- **Savings:** 120 lines (80% reduction)

### Consistency Improvements

- ✅ All price fields validate decimals the same way
- ✅ All price fields use same mobile keyboard
- ✅ All price fields handle empty/zero values consistently
- ✅ All price fields have proper accessibility attributes

### Bug Fixes

- ✅ Prevents >2 decimal places in ALL price fields
- ✅ Consistent handling of edge cases (empty, zero, max)
- ✅ Proper TypeScript types everywhere

### Performance

- ✅ Debounced inputs remain optimized
- ✅ No unnecessary re-renders (proper memoization)
- ✅ Same or better performance

---

## Testing Checklist

For each migrated component:

- [ ] Unit tests pass
- [ ] Price validation works (max 2 decimals)
- [ ] Mobile keyboard shows decimal pad
- [ ] Empty input handled correctly
- [ ] Zero values formatted as "0.00"
- [ ] Focus/blur behavior preserved
- [ ] Integration with parent components works
- [ ] No console errors
- [ ] Accessibility attributes present

---

## Rollback Plan

If issues arise:

1. Each component can be rolled back independently
2. Keep old code in comments temporarily
3. Run full test suite before merging
4. Deploy to staging first

---

## Example: ServicePriceInput Migration

### Before (18 lines)

```typescript
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
```

### After (8 lines)

```typescript
const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { sanitized } = validateCurrencyInput(e.target.value);
  onPriceChange(sanitized);
};

const handleBlur = () => {
  const formatted = (parseFloatFromCurrency(price || '0')).toFixed(2);
  onPriceChange(formatted);
};

// In TextField:
{...getCurrencyInputProps()}
```

**Improvement:** 55% less code, same functionality, more consistent

---

## Next Steps

1. **Review this plan** with team
2. **Prioritize** which components to tackle first
3. **Create tickets** for each migration
4. **Assign owners** to each component
5. **Set timeline** (suggested: 1-2 weeks)
6. **Track progress** in this document

---

## Questions?

- See `docs/CURRENCY_INPUT_GUIDE.md` for utility documentation
- Check `src/hooks/useCurrencyInput.ts` for hook implementation
- Reference `src/components/orders/steps/Step3Summary.tsx` for working example
- Ask in team chat if uncertain about approach

---

**Status:** 📋 Ready for Team Review
**Estimated Effort:** 1-2 weeks
**Impact:** High - Affects all service pricing in app
**Risk:** Low - Can be done incrementally
