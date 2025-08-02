import { Container, Box, Typography } from '@mui/material';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
	// Fallback UI if Clerk is not configured
	if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
		return (
			<Container maxWidth="xs">
				<Box
					sx={{
						marginTop: 8,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<Typography component="h1" variant="h5">
						Sign In (Clerk not configured)
					</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
						Please configure Clerk environment variables to enable
						authentication.
					</Typography>
				</Box>
			</Container>
		);
	}

	return (
		<Container maxWidth="xs">
			<Box
				sx={{
					marginTop: 8,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				<SignIn />
			</Box>
		</Container>
	);
}
