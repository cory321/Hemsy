import { ReactNode } from 'react';
import { Box } from '@mui/material';

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				bgcolor: 'background.default',
			}}
		>
			{children}
		</Box>
	);
}
