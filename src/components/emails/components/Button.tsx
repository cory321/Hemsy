import React from 'react';
import { Button as ReactEmailButton } from '@react-email/components';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({
  href,
  children,
  variant = 'primary',
}) => {
  const getButtonStyle = (variant: string) => {
    const baseStyle = {
      backgroundColor: '#2563eb',
      borderRadius: '6px',
      color: '#ffffff',
      fontSize: '16px',
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'block',
      padding: '12px 20px',
      fontWeight: 'bold',
    };

    switch (variant) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#16a34a' };
      case 'danger':
        return { ...baseStyle, backgroundColor: '#dc2626' };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#6b7280',
          color: '#ffffff',
        };
      default:
        return baseStyle;
    }
  };

  return (
    <ReactEmailButton href={href} style={getButtonStyle(variant)}>
      {children}
    </ReactEmailButton>
  );
};
