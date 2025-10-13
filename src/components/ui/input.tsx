import * as React from 'react';
import {
	TextField,
	TextFieldProps,
	InputBaseComponentProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled TextField to match previous input styling
const StyledTextField = styled(TextField)(({ theme }) => ({
	'& .MuiInputBase-root': {
		fontSize: theme.typography.body2.fontSize, // 14px - standard input size
		minHeight: 40,
		'& input': {
			padding: '8px 12px',
		},
		'&.Mui-disabled': {
			cursor: 'not-allowed',
			opacity: 0.5,
		},
	},
	'& .MuiOutlinedInput-root': {
		'& fieldset': {
			borderColor: theme.palette.divider,
		},
		'&:hover fieldset': {
			borderColor: theme.palette.text.primary,
		},
		'&.Mui-focused fieldset': {
			borderColor: theme.palette.primary.main,
			borderWidth: 2,
		},
		'&.Mui-error fieldset': {
			borderColor: theme.palette.error.main,
		},
	},
	'& .MuiInputBase-input': {
		'&::placeholder': {
			color: theme.palette.text.secondary,
			opacity: 0.7,
		},
		'&::-webkit-file-upload-button': {
			border: 0,
			background: 'transparent',
			fontSize: theme.typography.body2.fontSize, // 14px
			fontWeight: theme.typography.button.fontWeight,
		},
	},
}));

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
	type?: React.HTMLInputTypeAttribute;
	className?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<StyledTextField
				inputRef={ref}
				type={type}
				variant="outlined"
				size="small"
				fullWidth
				className={className || ''}
				InputProps={{
					...props.InputProps,
				}}
				{...props}
			/>
		);
	}
);

Input.displayName = 'Input';

export { Input };
