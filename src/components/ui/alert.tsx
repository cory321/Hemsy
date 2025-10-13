import * as React from 'react';
import {
	Alert as MuiAlert,
	AlertTitle as MuiAlertTitle,
	AlertProps as MuiAlertProps,
	Typography,
	Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Map shadcn alert variants to MUI severity
type AlertVariant = 'default' | 'destructive';

export interface AlertProps
	extends Omit<MuiAlertProps, 'severity' | 'variant'> {
	variant?: AlertVariant;
	children?: React.ReactNode;
}

// Custom styled Alert to match previous styling
const StyledAlert = styled(MuiAlert, {
	shouldForwardProp: (prop) => prop !== 'alertVariant',
})<{ alertVariant?: AlertVariant }>(({ theme, alertVariant }) => {
	const baseStyles = {
		borderRadius: theme.shape.borderRadius,
		padding: theme.spacing(2),
		position: 'relative' as const,
		width: '100%',
		'& .MuiAlert-icon': {
			alignItems: 'flex-start',
			paddingTop: theme.spacing(0.5),
		},
		'& .MuiAlert-message': {
			width: '100%',
		},
	};

	const variantStyles = {
		default: {
			backgroundColor: theme.palette.background.paper,
			color: theme.palette.text.primary,
			border: `1px solid ${theme.palette.divider}`,
		},
		destructive: {
			backgroundColor: theme.palette.error.light + '20',
			color: theme.palette.error.main,
			border: `1px solid ${theme.palette.error.main}50`,
			'& .MuiAlert-icon': {
				color: theme.palette.error.main,
			},
		},
	};

	return {
		...baseStyles,
		...variantStyles[alertVariant || 'default'],
	};
});

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
	({ className, variant = 'default', children, ...props }, ref) => {
		// Map variant to MUI severity
		const severity = variant === 'destructive' ? 'error' : 'info';

		return (
			<StyledAlert
				ref={ref}
				className={className || ''}
				alertVariant={variant}
				severity={severity}
				variant="standard"
				{...props}
			>
				{children}
			</StyledAlert>
		);
	}
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
	<MuiAlertTitle
		ref={ref as any}
		className={className || ''}
		sx={{
			marginBottom: 0.5,
			fontWeight: 500,
			lineHeight: 1.2,
			letterSpacing: -0.25,
		}}
	>
		{children}
	</MuiAlertTitle>
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
	<Box
		ref={ref}
		className={className}
		sx={(theme) => ({
			fontSize: theme.typography.body2.fontSize, // 14px - standard description size
			lineHeight: theme.typography.body2.lineHeight,
			'& p': {
				lineHeight: 'inherit',
			},
		})}
		{...props}
	>
		{children}
	</Box>
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
