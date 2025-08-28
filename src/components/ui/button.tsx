import * as React from 'react';
import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Map shadcn variants to MUI variants
type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

// Custom styled button to match the previous styling
const StyledButton = styled(MuiButton, {
  shouldForwardProp: (prop) =>
    prop !== 'buttonVariant' && prop !== 'buttonSize',
})<{ buttonVariant?: ButtonVariant; buttonSize?: ButtonSize }>(({
  theme,
  buttonVariant,
  buttonSize,
}) => {
  const baseStyles = {
    textTransform: 'none' as const,
    fontWeight: 500,
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    borderRadius: theme.shape.borderRadius,
    whiteSpace: 'nowrap' as const,
  };

  // Size styles
  const sizeStyles = {
    default: {
      minHeight: 40,
      padding: '8px 16px',
    },
    sm: {
      minHeight: 36,
      padding: '6px 12px',
      fontSize: '0.875rem',
    },
    lg: {
      minHeight: 44,
      padding: '10px 32px',
    },
    icon: {
      minHeight: 40,
      minWidth: 40,
      padding: '8px',
    },
  };

  // Variant styles
  const variantStyles = {
    default: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },
    },
    destructive: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },
    },
    outline: {
      backgroundColor: 'transparent',
      border: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:disabled': {
        borderColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },
    },
    secondary: {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.grey[300],
      },
      '&:disabled': {
        backgroundColor: theme.palette.action.disabledBackground,
        color: theme.palette.action.disabled,
      },
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      '&:disabled': {
        color: theme.palette.action.disabled,
      },
    },
    link: {
      backgroundColor: 'transparent',
      color: theme.palette.primary.main,
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
      '&:hover': {
        backgroundColor: 'transparent',
        textDecoration: 'underline',
      },
      '&:disabled': {
        color: theme.palette.action.disabled,
      },
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[buttonSize || 'default'],
    ...variantStyles[buttonVariant || 'default'],
  };
});

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    // If asChild is true, just render children with props
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
      });
    }

    return (
      <StyledButton
        ref={ref}
        className={className || ''}
        buttonVariant={variant}
        buttonSize={size}
        {...props}
      >
        {children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

// Export a compatibility function for buttonVariants (if needed by existing code)
export const buttonVariants = ({
  variant,
  size,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) => {
  // This is a compatibility shim, actual styling is handled by StyledButton
  return '';
};

export { Button };
