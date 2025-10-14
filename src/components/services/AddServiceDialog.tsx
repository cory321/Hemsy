'use client';

import React, { useState } from 'react';
import {
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	IconButton,
	Box,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import AddServiceForm from './AddServiceForm';
import { Service } from '@/lib/utils/serviceUtils';
import { RemixIcon } from '@/components/dashboard/common/RemixIcon';
import { actionButtonStyle } from '@/constants/buttonStyles';

interface AddServiceDialogProps {
	setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const AddServiceDialog: React.FC<AddServiceDialogProps> = ({ setServices }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const [open, setOpen] = useState(false);

	const handleOpen = () => setOpen(true);
	const handleClose = () => setOpen(false);

	return (
		<>
			<Button
				variant="contained"
				color="primary"
				onClick={handleOpen}
				sx={actionButtonStyle}
			>
				<RemixIcon name="ri-service-line" size={18} color="inherit" />
				<Box component="span">Add Service</Box>
			</Button>

			<Dialog
				open={open}
				onClose={handleClose}
				aria-labelledby="add-service-dialog-title"
				maxWidth="sm"
				fullWidth
				fullScreen={isMobile}
			>
				<DialogTitle id="add-service-dialog-title">
					Add Service
					<IconButton
						aria-label="close"
						onClick={handleClose}
						sx={{
							position: 'absolute',
							right: 8,
							top: 8,
							color: (theme) => theme.palette.grey[500],
						}}
					>
						<CloseIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 2 }}>
						<AddServiceForm onClose={handleClose} setServices={setServices} />
					</Box>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default AddServiceDialog;
