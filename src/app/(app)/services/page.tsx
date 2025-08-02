'use client';

import {
	Container,
	Typography,
	Box,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	InputAdornment,
	Fab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useState } from 'react';

export default function ServicesPage() {
	const [openDialog, setOpenDialog] = useState(false);
	const [editingService, setEditingService] = useState<any>(null);

	// Mock data for demonstration
	const services = [
		{ id: 1, name: 'Hemming - Pants', unit: 'per item', price: 25 },
		{ id: 2, name: 'Hemming - Dress/Skirt', unit: 'per item', price: 35 },
		{ id: 3, name: 'Take in sides', unit: 'per item', price: 30 },
		{ id: 4, name: 'Let out sides', unit: 'per item', price: 30 },
		{ id: 5, name: 'Shorten sleeves', unit: 'per item', price: 25 },
		{ id: 6, name: 'Replace zipper', unit: 'per item', price: 40 },
		{ id: 7, name: 'Add bustle', unit: 'per item', price: 60 },
		{ id: 8, name: 'Custom fitting', unit: 'per hour', price: 75 },
	];

	const handleOpenDialog = (service?: any) => {
		setEditingService(service || null);
		setOpenDialog(true);
	};

	const handleCloseDialog = () => {
		setOpenDialog(false);
		setEditingService(null);
	};

	const handleSave = () => {
		// TODO: Handle save
		handleCloseDialog();
	};

	return (
		<Container maxWidth="lg">
			<Box sx={{ mt: 4, mb: 4 }}>
				<Typography variant="h4" component="h1" gutterBottom>
					Services
				</Typography>
				<Typography color="text.secondary" gutterBottom>
					Manage your alteration services and pricing
				</Typography>

				{/* Services List */}
				<List sx={{ mt: 3 }}>
					{services.map((service) => (
						<ListItem
							key={service.id}
							sx={{
								bgcolor: 'background.paper',
								mb: 1,
								borderRadius: 1,
							}}
							secondaryAction={
								<Box>
									<IconButton onClick={() => handleOpenDialog(service)}>
										<EditIcon />
									</IconButton>
									<IconButton color="error">
										<DeleteIcon />
									</IconButton>
								</Box>
							}
						>
							<ListItemText primary={service.name} secondary={service.unit} />
							<Typography variant="h6" sx={{ mr: 2 }}>
								${service.price}
							</Typography>
						</ListItem>
					))}
				</List>

				{/* Add/Edit Service Dialog */}
				<Dialog
					open={openDialog}
					onClose={handleCloseDialog}
					maxWidth="sm"
					fullWidth
				>
					<DialogTitle>
						{editingService ? 'Edit Service' : 'Add New Service'}
					</DialogTitle>
					<DialogContent>
						<TextField
							autoFocus
							margin="dense"
							label="Service Name"
							fullWidth
							variant="outlined"
							defaultValue={editingService?.name || ''}
							sx={{ mb: 2 }}
						/>
						<TextField
							margin="dense"
							label="Unit"
							fullWidth
							variant="outlined"
							placeholder="e.g., per item, per hour"
							defaultValue={editingService?.unit || ''}
							sx={{ mb: 2 }}
						/>
						<TextField
							margin="dense"
							label="Price"
							fullWidth
							variant="outlined"
							type="number"
							defaultValue={editingService?.price || ''}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">$</InputAdornment>
								),
							}}
						/>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseDialog}>Cancel</Button>
						<Button onClick={handleSave} variant="contained">
							{editingService ? 'Save' : 'Add'}
						</Button>
					</DialogActions>
				</Dialog>

				{/* Floating Action Button */}
				<Fab
					color="primary"
					aria-label="add service"
					onClick={() => handleOpenDialog()}
					sx={{
						position: 'fixed',
						bottom: 80,
						right: 16,
					}}
				>
					<AddIcon />
				</Fab>
			</Box>
		</Container>
	);
}
