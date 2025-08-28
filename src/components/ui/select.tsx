import * as React from 'react';
import {
  Select as MuiSelect,
  SelectProps as MuiSelectProps,
  MenuItem,
  FormControl,
  InputLabel,
  ListSubheader,
  Divider,
  FormHelperText,
  Box,
} from '@mui/material';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

// Main Select component (wrapper around MUI Select)
export const Select = React.forwardRef<
  HTMLDivElement,
  {
    children?: React.ReactNode;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    name?: string;
  }
>(({ children, value, defaultValue, onValueChange, disabled, name }, ref) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');

  const handleChange = (event: any) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Extract props from children to configure MUI Select
  const childArray = React.Children.toArray(children);
  const triggerChild = childArray.find(
    (child: any) => child?.type?.displayName === 'SelectTrigger'
  );
  const contentChild = childArray.find(
    (child: any) => child?.type?.displayName === 'SelectContent'
  );

  return (
    <div ref={ref}>
      <FormControl fullWidth size="small" disabled={disabled || false}>
        <MuiSelect
          value={value !== undefined ? value : internalValue}
          onChange={handleChange}
          displayEmpty
          IconComponent={ChevronDown}
          sx={{
            '& .MuiSelect-icon': {
              transition: 'transform 0.2s',
            },
            '&.Mui-focused .MuiSelect-icon': {
              transform: 'rotate(180deg)',
            },
          }}
        >
          {React.isValidElement(contentChild) &&
            (contentChild as React.ReactElement<any>).props?.children}
        </MuiSelect>
      </FormControl>
    </div>
  );
});
Select.displayName = 'Select';

// SelectTrigger (compatibility layer - actual trigger is handled by MUI Select)
export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(({ className, children, ...props }, ref) => {
  // This is now handled by MUI Select internally
  return null;
});
SelectTrigger.displayName = 'SelectTrigger';

// SelectValue (compatibility layer - actual value display is handled by MUI Select)
export const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'> & { placeholder?: string }
>(({ placeholder, ...props }, ref) => {
  // Placeholder is handled via displayEmpty and renderValue in MUI Select
  return null;
});
SelectValue.displayName = 'SelectValue';

// SelectContent (wrapper for menu items)
export const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & { position?: string }
>(({ className, children, position = 'popper', ...props }, ref) => {
  // Content is rendered inside MUI Select
  return <>{children}</>;
});
SelectContent.displayName = 'SelectContent';

// SelectItem (maps to MenuItem)
export const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'> & {
    value: string;
    disabled?: boolean;
  }
>(({ className, children, value, disabled = false, ...props }, ref) => {
  return (
    <MenuItem value={value} disabled={disabled}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ flexGrow: 1 }}>{children}</Box>
      </Box>
    </MenuItem>
  );
});
SelectItem.displayName = 'SelectItem';

// SelectGroup (maps to ListSubheader)
export const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
SelectGroup.displayName = 'SelectGroup';

// SelectLabel (maps to ListSubheader for groups)
export const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, children, ...props }, ref) => {
  return <ListSubheader>{children}</ListSubheader>;
});
SelectLabel.displayName = 'SelectLabel';

// SelectSeparator (maps to Divider)
export const SelectSeparator = React.forwardRef<
  HTMLHRElement,
  React.ComponentPropsWithoutRef<'hr'>
>((props, ref) => {
  return <Divider />;
});
SelectSeparator.displayName = 'SelectSeparator';

// These are for compatibility but won't be visible in MUI Select
export const SelectScrollUpButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(() => null);
SelectScrollUpButton.displayName = 'SelectScrollUpButton';

export const SelectScrollDownButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(() => null);
SelectScrollDownButton.displayName = 'SelectScrollDownButton';
