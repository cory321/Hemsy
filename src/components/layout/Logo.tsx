'use client';

import Image from 'next/image';
import { Box } from '@mui/material';

interface LogoProps {
	height?: number;
	width?: number;
	variant?: 'light' | 'dark';
}

export function Logo({ height = 32, width }: LogoProps) {
	// Calculate width based on typical logo aspect ratio if not provided
	const logoWidth = width || height * 3;

	return (
		<Box
			component="span"
			sx={{
				display: 'inline-flex',
				alignItems: 'center',
				userSelect: 'none',
			}}
		>
			<Image
				src="/hemsy.svg"
				alt="Hemsy"
				width={logoWidth}
				height={height}
				unoptimized
				priority
			/>
		</Box>
	);
}
