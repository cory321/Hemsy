import { Container, Typography, Box } from '@mui/material';

export default function PrivacyPage() {
	return (
		<Container maxWidth="md">
			<Box sx={{ my: 8 }}>
				<Typography variant="h2" component="h1" gutterBottom>
					Privacy Policy
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Last updated: {new Date().toLocaleDateString()}
				</Typography>

				<Box sx={{ mt: 4 }}>
					<Typography variant="h4" component="h2" gutterBottom>
						1. Information We Collect
					</Typography>
					<Typography paragraph>
						We collect information you provide directly to us, such as when you
						create an account, use our services, or contact us for support.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						2. How We Use Your Information
					</Typography>
					<Typography paragraph>
						We use the information we collect to provide, maintain, and improve
						our services, process transactions, and communicate with you.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						3. Data Security
					</Typography>
					<Typography paragraph>
						We implement appropriate technical and organizational measures to
						protect your personal information against unauthorized access,
						alteration, disclosure, or destruction.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						4. Your Rights
					</Typography>
					<Typography paragraph>
						You have the right to access, update, or delete your personal
						information at any time. You can do this through your account
						settings or by contacting us.
					</Typography>

					<Typography variant="h4" component="h2" gutterBottom sx={{ mt: 4 }}>
						5. Contact Us
					</Typography>
					<Typography paragraph>
						If you have any questions about this Privacy Policy, please contact
						us at privacy@threadfolio.com.
					</Typography>
				</Box>
			</Box>
		</Container>
	);
}
