'use client';

import { useState, useEffect, useRef } from 'react';
import {
	Box,
	TextField,
	FormControlLabel,
	Checkbox,
	Stack,
	Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format as formatDate } from 'date-fns';
import { GarmentDraft } from '@/contexts/OrderFlowContext';
import GarmentImageOverlay from '../GarmentImageOverlay';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import PresetGarmentIconModal, {
	PresetGarmentIconModalResult,
} from '../PresetGarmentIconModal';
import { getPresetIconUrl, getPresetIconLabel } from '@/utils/presetIcons';
import SafeCldImage from '@/components/ui/SafeCldImage';

interface GarmentDetailsStepProps {
	garment: GarmentDraft;
	onGarmentUpdate: (updates: Partial<GarmentDraft>) => void;
	onValidationChange: (isValid: boolean) => void;
	index: number;
	isNew: boolean;
}

export default function GarmentDetailsStepImproved({
	garment,
	onGarmentUpdate,
	onValidationChange,
	index,
	isNew,
}: GarmentDetailsStepProps) {
	const [iconModalOpen, setIconModalOpen] = useState(false);
	const [dateValidationError, setDateValidationError] = useState<{
		dueDate?: string;
		eventDate?: string;
	}>({});
	const eventDatePickerRef = useRef<HTMLInputElement>(null);

	// Validate the step whenever garment or validation errors change
	useEffect(() => {
		const today = dayjs().startOf('day');
		let isValid = true;

		// Check due date
		if (garment.dueDate) {
			const dueDate = dayjs(garment.dueDate);
			if (dueDate.isBefore(today)) {
				isValid = false;
			}
		}

		// Check event date if special event is enabled
		if (garment.specialEvent && garment.eventDate && garment.dueDate) {
			const eventDate = dayjs(garment.eventDate);
			const dueDate = dayjs(garment.dueDate);

			if (
				eventDate.isBefore(today) ||
				eventDate.isBefore(dueDate) ||
				eventDate.isSame(dueDate)
			) {
				isValid = false;
			}
		}

		// Check if there are any validation errors
		if (Object.keys(dateValidationError).length > 0) {
			isValid = false;
		}

		onValidationChange(isValid);
	}, [garment, dateValidationError, onValidationChange]);

	const handleImageUpload = (result: any) => {
		if (result?.info) {
			onGarmentUpdate({
				cloudinaryPublicId: result.info.public_id,
				imageCloudId: result.info.public_id, // Set both fields for compatibility
				imageUrl: result.info.secure_url,
				// Clear preset icon when image is uploaded
				presetIconKey: undefined,
				presetFillColor: undefined,
			});
		}
	};

	const handleImageRemove = () => {
		onGarmentUpdate({
			cloudinaryPublicId: undefined,
			imageCloudId: undefined, // Clear both fields for compatibility
			imageUrl: undefined,
		});
	};

	const handleIconSelect = (result: PresetGarmentIconModalResult) => {
		const presetLabel = getPresetIconLabel(result.presetIconKey);

		// Auto-fill name logic:
		// 1. If name is empty, auto-fill with preset label
		// 2. If name exists but isNameUserEdited is explicitly false, override with preset label
		// 3. If name exists and isNameUserEdited is undefined or true, don't change it
		const shouldAutoFillName =
			!garment.name || garment.isNameUserEdited === false;

		// Build the update object
		const updateForParent: Partial<GarmentDraft> = {
			presetIconKey: result.presetIconKey,
			presetFillColor: result.presetFillColor,
			// Clear cloudinary image when icon is selected
			cloudinaryPublicId: undefined,
			imageCloudId: undefined, // Clear both fields for compatibility
			imageUrl: undefined,
		};

		// Only include name in update if we're auto-filling it
		if (shouldAutoFillName && presetLabel) {
			updateForParent.name = presetLabel;
		}

		onGarmentUpdate(updateForParent);
	};

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<Box sx={{ maxWidth: 800, mx: 'auto' }}>
				{/* Centered Layout with Better Proportions */}
				<Grid container spacing={4}>
					{/* Left Column - Visual */}
					<Grid size={{ xs: 12, md: 5 }}>
						<Box sx={{ position: 'sticky', top: 0 }}>
							<Stack spacing={3}>
								{/* Garment Image/Icon with Overlay */}
								<Box aria-label="Garment Image">
									<GarmentImageOverlay
										imageType={
											garment.cloudinaryPublicId ? 'cloudinary' : 'icon'
										}
										onUploadSuccess={handleImageUpload}
										onIconChange={() => setIconModalOpen(true)}
										onImageRemove={handleImageRemove}
									>
										<Box
											sx={{
												width: '100%',
												aspectRatio: '1',
												border: '2px solid',
												borderColor: 'divider',
												borderRadius: 3,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden',
												bgcolor: 'grey.50',
												position: 'relative',
												minHeight: 280,
											}}
										>
											{garment.cloudinaryPublicId ? (
												<SafeCldImage
													src={garment.cloudinaryPublicId}
													alt={garment.name || 'Garment image'}
													fill
													style={{ objectFit: 'cover' }}
													sizes="(max-width: 768px) 100vw, 400px"
													fallbackIconKey={garment.presetIconKey}
													fallbackIconColor={garment.presetFillColor}
												/>
											) : garment.presetIconKey ? (
												<InlinePresetSvg
													src={
														getPresetIconUrl(garment.presetIconKey) ||
														'/presets/garments/select-garment.svg'
													}
													fillColor={garment.presetFillColor || '#000000'}
													style={{
														width: '60%',
														height: '60%',
														maxWidth: '60%',
														maxHeight: '60%',
													}}
												/>
											) : (
												<InlinePresetSvg
													src="/presets/garments/select-garment.svg"
													style={{
														width: '60%',
														height: '60%',
														maxWidth: '60%',
														maxHeight: '60%',
													}}
												/>
											)}
										</Box>
									</GarmentImageOverlay>
								</Box>

								{/* Quick Info Card */}
								<Box
									sx={{
										p: 2,
										bgcolor: 'grey.50',
										borderRadius: 2,
										border: '1px solid',
										borderColor: 'divider',
									}}
								>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ mb: 1, display: 'block' }}
									>
										Quick Tips
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ lineHeight: 1.4 }}
									>
										• Click the image to upload a photo or select an icon
										<br />
										• Set a due date to track progress
										<br />• Use special events for weddings, proms, etc.
									</Typography>
								</Box>
							</Stack>
						</Box>
					</Grid>

					{/* Right Column - Form Details */}
					<Grid size={{ xs: 12, md: 7 }}>
						<Stack spacing={3}>
							{/* Header */}
							<Box>
								<Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
									Garment Details
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Fill in the basic information for this garment
								</Typography>
							</Box>

							{/* Garment Name */}
							<TextField
								fullWidth
								label="Garment Name"
								value={garment.name}
								onChange={(e) => {
									onGarmentUpdate({
										name: e.target.value,
										isNameUserEdited: true,
									});
								}}
								placeholder="e.g., Blue Wedding Dress"
								variant="outlined"
								sx={{
									'& .MuiOutlinedInput-root': {
										borderRadius: 2,
									},
								}}
							/>

							{/* Dates Section */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
									Timeline
								</Typography>
								{/* Due Date */}
								<DatePicker
									label="Due Date"
									value={garment.dueDate ? dayjs(garment.dueDate) : null}
									format="dddd, MMMM D, YYYY"
									onChange={(newValue) => {
										if (newValue) {
											const today = dayjs().startOf('day');
											const selectedDate = newValue.startOf('day');
											const eventDate = garment.eventDate
												? dayjs(garment.eventDate).startOf('day')
												: null;

											// Validate due date
											if (selectedDate.isBefore(today)) {
												setDateValidationError({
													dueDate: 'Due date cannot be in the past',
												});
											} else if (
												garment.specialEvent &&
												eventDate &&
												selectedDate.isAfter(eventDate)
											) {
												setDateValidationError({
													dueDate:
														'Due date must be on or before the event date',
												});
											} else {
												// Clear due date error if valid
												setDateValidationError((prev) => {
													const { dueDate, ...rest } = prev;
													return rest;
												});
											}

											onGarmentUpdate({
												dueDate: formatDate(newValue.toDate(), 'yyyy-MM-dd'),
											});
										}
									}}
									minDate={dayjs()}
									{...(garment.specialEvent &&
										garment.eventDate && {
											maxDate: dayjs(garment.eventDate),
										})}
									slotProps={{
										textField: {
											fullWidth: true,
											error: !!dateValidationError.dueDate,
											helperText: dateValidationError.dueDate,
											onClick: (e: any) => {
												// Find and click the calendar button to open picker
												const button = e.currentTarget.querySelector('button');
												if (button) button.click();
											},
											InputProps: {
												readOnly: true,
											},
											inputProps: {
												'aria-label': 'Due Date',
												style: {
													cursor: 'pointer',
													caretColor: 'transparent',
												},
												onKeyDown: (e: any) => {
													e.preventDefault();
													e.stopPropagation();
												},
												onPaste: (e: any) => e.preventDefault(),
												onCut: (e: any) => e.preventDefault(),
												onDrop: (e: any) => e.preventDefault(),
												onMouseDown: (e: any) => e.preventDefault(),
												onSelect: (e: any) => {
													if (
														e.target.selectionStart !== e.target.selectionEnd
													) {
														e.target.setSelectionRange(0, 0);
													}
												},
											},
											sx: {
												'& .MuiOutlinedInput-root': {
													borderRadius: 2,
												},
												'& input': {
													userSelect: 'none',
													WebkitUserSelect: 'none',
													MozUserSelect: 'none',
													msUserSelect: 'none',
												},
											},
										},
									}}
								/>

								{/* Special Event Checkbox */}
								<Box sx={{ mt: 2 }}>
									<FormControlLabel
										control={
											<Checkbox
												checked={garment.specialEvent}
												onChange={(e) => {
													const isChecked = e.target.checked;
													onGarmentUpdate({
														specialEvent: isChecked,
														// When checking, set event date to due date if available, otherwise keep existing
														// When unchecking, clear event date
														eventDate: isChecked
															? garment.eventDate || garment.dueDate
															: undefined,
													});
													// Clear any event date validation errors when unchecking
													if (!isChecked) {
														setDateValidationError((prev) => {
															const { eventDate, ...rest } = prev;
															return rest;
														});
													} else {
														// Auto-focus and open the event date picker when checking
														setTimeout(() => {
															if (eventDatePickerRef.current) {
																eventDatePickerRef.current.focus();
																// Find and click the calendar button to open picker
																const button =
																	eventDatePickerRef.current.querySelector(
																		'button'
																	);
																if (button) {
																	button.click();
																}
															}
														}, 100);
													}
												}}
											/>
										}
										label={
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												Garment is for a special event{' '}
												<Typography
													component="span"
													variant="caption"
													color="text.secondary"
													sx={{ fontWeight: 400 }}
												>
													(Wedding, Prom, etc.)
												</Typography>
											</Typography>
										}
									/>
								</Box>

								{/* Event Date - appears below checkbox when special event is checked */}
								{garment.specialEvent && (
									<Box sx={{ mt: 2 }}>
										<DatePicker
											label="Event Date"
											value={
												garment.eventDate ? dayjs(garment.eventDate) : null
											}
											format="dddd, MMMM D, YYYY"
											onChange={(newValue) => {
												if (newValue) {
													const today = dayjs().startOf('day');
													const selectedDate = newValue.startOf('day');
													const dueDate = garment.dueDate
														? dayjs(garment.dueDate).startOf('day')
														: null;

													// Validate event date
													if (selectedDate.isBefore(today)) {
														setDateValidationError({
															eventDate: 'Event date cannot be in the past',
														});
													} else if (
														dueDate &&
														selectedDate.isBefore(dueDate)
													) {
														setDateValidationError({
															eventDate:
																'Event date must be on or after the due date',
														});
													} else {
														// Clear event date error if valid, but also check if due date is now invalid
														setDateValidationError((prev) => {
															const { eventDate, ...rest } = prev;
															let newErrors = rest;

															// Check if due date is now invalid due to new event date
															if (dueDate && dueDate.isAfter(selectedDate)) {
																newErrors = {
																	...newErrors,
																	dueDate:
																		'Due date must be on or before the event date',
																};
															} else {
																// Clear due date error if it was about event date conflict
																const {
																	dueDate: dueDateError,
																	...restWithoutDueDate
																} = newErrors;
																if (
																	dueDateError ===
																		'Due date must be on or before the event date' ||
																	dueDateError ===
																		'Due date must be before the event date'
																) {
																	newErrors = restWithoutDueDate;
																} else if (dueDateError) {
																	newErrors = {
																		...restWithoutDueDate,
																		dueDate: dueDateError,
																	};
																}
															}

															return newErrors;
														});
													}
												} else {
													// Clear error when clearing the date, and also clear due date errors related to event date
													setDateValidationError((prev) => {
														const {
															eventDate,
															dueDate: dueDateError,
															...rest
														} = prev;
														let newErrors = rest;

														// Clear due date error if it was about event date conflict
														if (
															dueDateError &&
															dueDateError !== 'Due date cannot be in the past'
														) {
															// Keep the error if it's about past date, clear if it's about event date conflict
															if (
																dueDateError ===
																	'Due date must be before the event date' ||
																dueDateError ===
																	'Due date must be on or before the event date'
															) {
																// Don't add it back
															} else {
																newErrors = {
																	...newErrors,
																	dueDate: dueDateError,
																};
															}
														}

														return newErrors;
													});
												}

												onGarmentUpdate({
													eventDate: newValue
														? formatDate(newValue.toDate(), 'yyyy-MM-dd')
														: undefined,
												});
											}}
											minDate={
												garment.dueDate ? dayjs(garment.dueDate) : dayjs()
											}
											slotProps={{
												textField: {
													ref: eventDatePickerRef,
													fullWidth: true,
													error: !!dateValidationError.eventDate,
													helperText: dateValidationError.eventDate,
													onClick: (e: any) => {
														// Find and click the calendar button to open picker
														const button =
															e.currentTarget.querySelector('button');
														if (button) button.click();
													},
													InputProps: {
														readOnly: true,
													},
													inputProps: {
														'aria-label': 'Event Date',
														style: {
															cursor: 'pointer',
															caretColor: 'transparent',
														},
														onKeyDown: (e: any) => {
															e.preventDefault();
															e.stopPropagation();
														},
														onPaste: (e: any) => e.preventDefault(),
														onCut: (e: any) => e.preventDefault(),
														onDrop: (e: any) => e.preventDefault(),
														onMouseDown: (e: any) => e.preventDefault(),
														onSelect: (e: any) => {
															if (
																e.target.selectionStart !==
																e.target.selectionEnd
															) {
																e.target.setSelectionRange(0, 0);
															}
														},
													},
													sx: {
														'& .MuiOutlinedInput-root': {
															borderRadius: 2,
														},
														'& input': {
															userSelect: 'none',
															WebkitUserSelect: 'none',
															MozUserSelect: 'none',
															msUserSelect: 'none',
														},
													},
												},
											}}
										/>
									</Box>
								)}
							</Box>

							{/* Notes Section */}
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
									Additional Notes
								</Typography>
								<TextField
									fullWidth
									multiline
									rows={4}
									label="Notes (Optional)"
									value={garment.notes}
									onChange={(e) => {
										onGarmentUpdate({
											notes: e.target.value,
										});
									}}
									placeholder="Any special instructions, measurements, or details about this garment..."
									variant="outlined"
									sx={{
										'& .MuiOutlinedInput-root': {
											borderRadius: 2,
										},
									}}
								/>
							</Box>
						</Stack>
					</Grid>
				</Grid>
			</Box>

			{/* Icon Selection Modal */}
			<PresetGarmentIconModal
				open={iconModalOpen}
				onClose={() => setIconModalOpen(false)}
				onSave={handleIconSelect}
				initialKey={garment.presetIconKey}
				initialFill={garment.presetFillColor}
			/>
		</LocalizationProvider>
	);
}
