import React from 'react';

interface PreviewButtonProps {
	children: React.ReactNode;
	variant?:
		| 'primary'
		| 'secondary'
		| 'success'
		| 'danger'
		| 'muted-green'
		| 'muted-red';
}

export const PreviewButton: React.FC<PreviewButtonProps> = ({
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
			cursor: 'default',
		};

		switch (variant) {
			case 'success':
				return { ...baseStyle, backgroundColor: '#16a34a' };
			case 'danger':
				return { ...baseStyle, backgroundColor: '#dc2626' };
			case 'muted-green':
				return { ...baseStyle, backgroundColor: '#059669' };
			case 'muted-red':
				return { ...baseStyle, backgroundColor: '#b91c1c' };
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

	return <div style={getButtonStyle(variant)}>{children}</div>;
};
