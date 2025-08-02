import { Container, Typography, Box } from '@mui/material';

export default function TermsPage() {
	return (
		<Container maxWidth="md">
			<Box sx={{ my: 8 }}>
				<Typography variant="h2" component="h1" gutterBottom>
					Terms of Service
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Last updated: {new Date().toLocaleDateString()}
				</Typography>

				<Box sx={{ mt: 4 }}>
					<Typography variant="h4" component="h2" gutterBottom>
						1. Acceptance of Terms
					</Typography>
					<Typography paragraph>
						By accessing and using Threadfolio, you agree to be bound by these
						Terms of Service and all applicable laws and regulations.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						2. Use of Service
					</Typography>
					<Typography paragraph>
						You may use Threadfolio only for lawful purposes and in accordance
						with these Terms. You agree not to use the service in any way that
						violates any applicable laws or regulations.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						3. Account Registration
					</Typography>
					<Typography paragraph>
						You must provide accurate and complete information when creating an
						account. You are responsible for maintaining the security of your
						account credentials.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						4. Payment Terms
					</Typography>
					<Typography paragraph>
						Subscription fees are billed in advance on a monthly basis. You can
						cancel your subscription at any time, and cancellation will take
						effect at the end of the current billing period.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						5. Limitation of Liability
					</Typography>
					<Typography paragraph>
						Threadfolio shall not be liable for any indirect, incidental,
						special, consequential, or punitive damages resulting from your use
						of or inability to use the service.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						6. Contact Information
					</Typography>
					<Typography paragraph>
						If you have any questions about these Terms, please contact us at
						legal@threadfolio.com.
					</Typography>
				</Box>
			</Box>
		</Container>
	);
}
