import * as React from 'react';
import { FormLabel, FormLabelProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled FormLabel to match previous label styling
const StyledLabel = styled(FormLabel)(({ theme }) => ({
	fontSize: theme.typography.body2.fontSize, // 14px - standard label size
	fontWeight: theme.typography.button.fontWeight,
	lineHeight: theme.typography.body2.lineHeight,
	color: theme.palette.text.primary,
	marginBottom: theme.spacing(0.5),
	display: 'inline-block',
	'&.Mui-disabled': {
		cursor: 'not-allowed',
		opacity: 0.7,
	},
	'&.Mui-focused': {
		color: theme.palette.primary.main,
	},
	'&.Mui-error': {
		color: theme.palette.error.main,
	},
}));

export interface LabelProps extends Omit<FormLabelProps, 'component'> {
	htmlFor?: string;
	children?: React.ReactNode;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, children, ...props }, ref) => {
		return (
			<StyledLabel ref={ref} className={className || ''} {...props}>
				{children}
			</StyledLabel>
		);
	}
);

Label.displayName = 'Label';

export { Label };
