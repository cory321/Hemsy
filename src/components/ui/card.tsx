import * as React from 'react';
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardActions,
  CardProps as MuiCardProps,
  Typography,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled MUI Card to match previous styling
const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[1],
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const Card = React.forwardRef<HTMLDivElement, MuiCardProps>(
  ({ className, children, ...props }, ref) => (
    <StyledCard ref={ref} className={className || ''} {...props}>
      {children}
    </StyledCard>
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <Box
    ref={ref}
    className={className}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      p: 3,
      pb: 0,
    }}
    {...props}
  >
    {children}
  </Box>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <Typography
    ref={ref as any}
    variant="h6"
    component="h3"
    className={className || ''}
    sx={{
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: -0.5,
    }}
  >
    {children}
  </Typography>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <Typography
    ref={ref as any}
    variant="body2"
    color="text.secondary"
    className={className || ''}
    sx={{
      fontSize: '0.875rem',
    }}
  >
    {children}
  </Typography>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <MuiCardContent
    ref={ref}
    className={className || ''}
    sx={{
      p: 3,
      pt: 2,
      '&:last-child': {
        pb: 3,
      },
    }}
  >
    {children}
  </MuiCardContent>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <CardActions
    ref={ref}
    className={className || ''}
    sx={{
      display: 'flex',
      alignItems: 'center',
      p: 3,
      pt: 0,
    }}
  >
    {children}
  </CardActions>
));
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
