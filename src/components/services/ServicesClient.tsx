'use client';

import { useState } from 'react';
import { Typography, Box, Paper } from '@mui/material';
import Grid from '@mui/material/Grid2';

import ServiceList from '@/components/services/ServiceList';
import AddServiceDialog from '@/components/services/AddServiceDialog';
import { Service } from '@/lib/utils/serviceUtils';

interface ServicesClientProps {
	initialServices: Service[];
}

export default function ServicesClient({
	initialServices,
}: ServicesClientProps) {
	const [services, setServices] = useState<Service[]>(initialServices);

	const frequentlyUsedServices = services
		.filter((s) => s.frequently_used)
		.sort((a, b) => {
			const posA = a.frequently_used_position ?? Number.MAX_VALUE;
			const posB = b.frequently_used_position ?? Number.MAX_VALUE;
			return posA - posB;
		});

	const otherServices = services.filter((s) => !s.frequently_used);

	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ mt: 2, mb: 4 }}>
				<Grid
					container
					justifyContent="space-between"
					alignItems="center"
					sx={{ mb: 3 }}
				>
					<Grid>
						<Typography variant="h2" component="h1" gutterBottom>
							Service Catalog
						</Typography>
					</Grid>
					<Grid>
						<AddServiceDialog setServices={setServices} />
					</Grid>
				</Grid>

				{services.length === 0 ? (
					<Paper sx={{ p: 4, textAlign: 'center' }}>
						<Typography variant="h6" gutterBottom>
							No services yet
						</Typography>
						<Typography color="text.secondary">
							Add your first service to get started
						</Typography>
					</Paper>
				) : (
					<Box>
						{frequentlyUsedServices.length > 0 && (
							<Box sx={{ mb: 4 }}>
								<Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
									Frequently Used Services
								</Typography>
								<ServiceList
									services={frequentlyUsedServices}
									setServices={setServices}
								/>
							</Box>
						)}

						{otherServices.length > 0 && (
							<Box>
								<Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
									{frequentlyUsedServices.length > 0
										? 'Other Services'
										: 'All Services'}
								</Typography>
								<ServiceList
									services={otherServices}
									setServices={setServices}
								/>
							</Box>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
}
