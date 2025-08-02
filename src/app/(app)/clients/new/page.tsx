'use client';

import {
	Container,
	Typography,
	Box,
	TextField,
	Button,
	Card,
	CardContent,
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function NewClientPage() {
	const router = useRouter();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Handle form submission
		router.push('/clients');
	};

	return (
		<Container maxWidth="sm">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Add New Client
				</Typography>

				<Card>
					<CardContent>
						<Box component="form" onSubmit={handleSubmit}>
							<TextField
								required
								fullWidth
								label="Full Name"
								name="name"
								autoFocus
								sx={{ mb: 2 }}
							/>
							<TextField
								required
								fullWidth
								label="Phone Number"
								name="phone"
								type="tel"
								sx={{ mb: 2 }}
							/>
							<TextField
								fullWidth
								label="Email Address"
								name="email"
								type="email"
								sx={{ mb: 2 }}
							/>
							<TextField
								fullWidth
								label="Address"
								name="address"
								multiline
								rows={2}
								sx={{ mb: 2 }}
							/>
							<TextField
								fullWidth
								label="Notes"
								name="notes"
								multiline
								rows={3}
								helperText="Any special preferences or important information"
								sx={{ mb: 3 }}
							/>
							<Box sx={{ display: 'flex', gap: 2 }}>
								<Button
									variant="outlined"
									fullWidth
									onClick={() => router.back()}
								>
									Cancel
								</Button>
								<Button type="submit" variant="contained" fullWidth>
									Add Client
								</Button>
							</Box>
						</Box>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
}
