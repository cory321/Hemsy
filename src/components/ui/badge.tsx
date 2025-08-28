import * as React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Map shadcn badge variants to MUI chip colors
type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export interface BadgeProps
  extends Omit<ChipProps, 'variant' | 'color' | 'children'> {
  variant?: BadgeVariant;
  children?: React.ReactNode;
}

// Custom styled Chip to match badge styling
const StyledChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'badgeVariant',
})<{ badgeVariant?: BadgeVariant }>(({ theme, badgeVariant }) => {
  const baseStyles = {
    height: 'auto',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '2px 10px',
    transition: 'all 0.2s',
    '& .MuiChip-label': {
      padding: 0,
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      border: 'none',
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    secondary: {
      backgroundColor: theme.palette.grey[200],
      color: theme.palette.text.primary,
      border: 'none',
      '&:hover': {
        backgroundColor: theme.palette.grey[300],
      },
    },
    destructive: {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
      border: 'none',
      '&:hover': {
        backgroundColor: theme.palette.error.dark,
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
  };

  return {
    ...baseStyles,
    ...variantStyles[badgeVariant || 'default'],
  };
});

function Badge({
  className,
  variant = 'default',
  children,
  label,
  ...props
}: BadgeProps) {
  // Use label prop if provided, otherwise use children for backwards compatibility
  const chipLabel = label || children;

  return (
    <StyledChip
      className={className || ''}
      badgeVariant={variant}
      label={chipLabel}
      size="small"
      {...props}
    />
  );
}

// Export for compatibility
export const badgeVariants = ({ variant }: { variant?: BadgeVariant }) => {
  // This is a compatibility shim, actual styling is handled by StyledChip
  return '';
};

export { Badge };
