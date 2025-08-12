import React, { forwardRef } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { format, isValid, parse } from 'date-fns';

const dateInputFormat = 'MM/dd/yyyy';
const timeInputFormat = 'h:mm aa';

export interface DatePickerInputProps {
  label: string;
  value?: Date | string | null;
  onClick?: () => void;
  dateFormat: string;
  showAdornment?: boolean;
}

const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
  ({ label, value, onClick, dateFormat, showAdornment = true }, ref) => {
    let dateValue: Date | null = null;

    if (typeof value === 'string') {
      try {
        if (dateFormat === 'h:mm aa') {
          dateValue = parse(value, timeInputFormat, new Date());
        } else {
          dateValue = parse(value, dateInputFormat, new Date());
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        dateValue = null;
      }
    } else {
      dateValue = value ?? null;
    }

    const formattedDate =
      dateValue && isValid(dateValue) ? format(dateValue, dateFormat) : '';

    const inputProps: any = {
      readOnly: true,
      ...(showAdornment && {
        startAdornment: (
          <InputAdornment position="start">
            <i className="ri-calendar-line text-[24px]" />
          </InputAdornment>
        ),
      }),
    };

    return (
      <TextField
        inputRef={ref}
        label={label}
        value={formattedDate}
        onClick={onClick}
        fullWidth
        variant="outlined"
        InputProps={inputProps}
      />
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';

export default DatePickerInput;
