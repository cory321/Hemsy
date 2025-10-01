'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	TextField,
	Typography,
	Button,
	IconButton,
	Card,
	CardContent,
	MenuItem,
	Select,
	InputAdornment,
	Checkbox,
	FormControlLabel,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { ServiceDraft } from '@/contexts/OrderFlowContext';
import {
	formatCurrency,
	dollarsToCents,
	parseFloatFromCurrency,
	formatAsCurrency,
} from '@/lib/utils/currency';
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast';
import { searchServices, addService } from '@/lib/actions/services';

import ServicePriceInput from '@/components/common/ServicePriceInput';

interface ServiceOption {
	id: string;
	name: string;
	default_unit: string;
	default_qty: number;
	default_unit_price_cents: number;
}

interface ServiceSearchAndManagerProps {
	services: ServiceDraft[];
	onChange: (services: ServiceDraft[]) => void;
	garmentType?: string;
	showQuickAdd?: boolean;
	onQuickAddClose?: () => void;
	searchOnly?: boolean;
	addedServicesOnly?: boolean;
}

export default function ServiceSearchAndManager({
	services,
	onChange,
	garmentType,
	showQuickAdd: externalShowQuickAdd = false,
	onQuickAddClose,
	searchOnly = false,
	addedServicesOnly = false,
}: ServiceSearchAndManagerProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<ServiceOption[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [showQuickAdd, setShowQuickAdd] = useState(externalShowQuickAdd);
	const [quickAddName, setQuickAddName] = useState('');
	const [quickAddPrice, setQuickAddPrice] = useState('0.00');
	const [quickAddUnit, setQuickAddUnit] = useState<
		'flat_rate' | 'hour' | 'day'
	>('flat_rate');
	const [quickAddQuantity, setQuickAddQuantity] = useState(1);
	const [quickAddToCatalog, setQuickAddToCatalog] = useState(true);
	const [quickAddFrequentlyUsed, setQuickAddFrequentlyUsed] = useState(false);
	const [quickAddLoading, setQuickAddLoading] = useState(false);
	const [quickAddPriceError, setQuickAddPriceError] = useState('');
	const priceInputRef = useRef<HTMLInputElement>(null);

	// Handle external showQuickAdd changes
	useEffect(() => {
		setShowQuickAdd(externalShowQuickAdd);
	}, [externalShowQuickAdd]);

	// Search services
	useEffect(() => {
		let isActive = true;
		const searchDebounced = async () => {
			if (searchQuery.length < 2) {
				setSearchResults([]);
				setSearchLoading(false);
				return;
			}
			setSearchLoading(true);
			try {
				const result = await searchServices(searchQuery);
				if (isActive) {
					if (result.success) {
						setSearchResults(result.data);
					} else {
						console.error('Failed to search services:', result.error);
						setSearchResults([]);
					}
				}
			} catch (error) {
				if (isActive) {
					console.error('Unexpected error searching services:', error);
					setSearchResults([]);
				}
			} finally {
				if (isActive) {
					setSearchLoading(false);
				}
			}
		};

		const timer = setTimeout(searchDebounced, 300);
		return () => {
			isActive = false;
			clearTimeout(timer);
		};
	}, [searchQuery]);

	const handleAddService = (service: ServiceOption) => {
		const newService: ServiceDraft = {
			serviceId: service.id,
			name: service.name,
			quantity: service.default_qty,
			unit: service.default_unit as ServiceDraft['unit'],
			unitPriceCents: service.default_unit_price_cents,
		};
		onChange([...services, newService]);
		setSearchQuery('');
		setSearchResults([]);
	};

	const handleUpdateService = (
		index: number,
		updates: Partial<ServiceDraft>
	) => {
		const updatedServices = services.map((service, i) =>
			i === index ? { ...service, ...updates } : service
		);
		onChange(updatedServices);
	};

	const handleRemoveService = (index: number) => {
		const updatedServices = services.filter((_, i) => i !== index);
		onChange(updatedServices);
	};

	// Centralized function to reset and close the dialog
	const handleCloseQuickAdd = () => {
		setShowQuickAdd(false);
		onQuickAddClose?.();
		// Reset form state
		setQuickAddName('');
		setQuickAddPrice('0.00');
		setQuickAddUnit('flat_rate');
		setQuickAddQuantity(1);
		setQuickAddToCatalog(true);
		setQuickAddFrequentlyUsed(false);
		setQuickAddLoading(false);
		setQuickAddPriceError('');
	};

	const handleQuickAdd = async () => {
		// Clear any existing price error
		setQuickAddPriceError('');

		if (!quickAddName.trim()) {
			showErrorToast('Please enter a service name');
			return;
		}

		const priceCents = dollarsToCents(parseFloatFromCurrency(quickAddPrice));

		// Validate price is greater than $0.00
		if (priceCents <= 0) {
			setQuickAddPriceError('Price must be greater than $0.00');
			// Focus the price input field
			setTimeout(() => {
				priceInputRef.current?.focus();
			}, 100);
			return;
		}

		setQuickAddLoading(true);

		try {
			if (quickAddToCatalog) {
				const result = await addService({
					name: quickAddName,
					default_qty: quickAddQuantity,
					default_unit: quickAddUnit,
					default_unit_price_cents: priceCents,
					frequently_used: quickAddFrequentlyUsed,
				});

				if (!result.success) {
					// Check if it's a duplicate name error
					if (result.error.includes('already exists')) {
						showErrorToast(result.error);
					} else {
						showErrorToast(`Failed to add service: ${result.error}`);
					}
					setQuickAddLoading(false);
					return;
				}

				const created = result.data;
				const newService: ServiceDraft = {
					serviceId: created.id,
					name: quickAddName,
					quantity: quickAddQuantity,
					unit: quickAddUnit,
					unitPriceCents: priceCents,
				};
				onChange([...services, newService]);
				showSuccessToast('Service added to catalog');
			} else {
				// Add as inline service
				const newService: ServiceDraft = {
					name: quickAddName,
					quantity: quickAddQuantity,
					unit: quickAddUnit,
					unitPriceCents: priceCents,
					inline: {
						name: quickAddName,
					},
				};
				onChange([...services, newService]);
			}

			// Close dialog and reset form on success
			handleCloseQuickAdd();
		} catch (error) {
			console.error('Error in handleQuickAdd:', error);
			showErrorToast('An unexpected error occurred');
			setQuickAddLoading(false);
		}
	};

	return (
		<Box>
			{/* Search Services - only show if not addedServicesOnly */}
			{!addedServicesOnly && (
				<Box sx={{ mb: searchOnly ? 0 : 3 }}>
					<TextField
						fullWidth
						placeholder="Search services..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
							endAdornment: (
								<>
									{searchLoading ? (
										<CircularProgress color="inherit" size={20} />
									) : null}
								</>
							),
						}}
					/>
					{(searchLoading || searchQuery.length > 0) && (
						<Paper sx={{ mt: 1, p: 1, maxHeight: 200, overflow: 'auto' }}>
							{searchQuery.length < 2 && !searchLoading ? (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ p: 1 }}
								>
									Type at least 2 characters to search
								</Typography>
							) : searchLoading ? (
								<Box
									sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
								>
									<CircularProgress size={16} />
									<Typography variant="body2" color="text.secondary">
										Searching...
									</Typography>
								</Box>
							) : searchResults.length > 0 ? (
								searchResults.map((service) => (
									<Box
										key={service.id}
										sx={{
											p: 1,
											cursor: 'pointer',
											'&:hover': { bgcolor: 'action.hover' },
										}}
										onClick={() => handleAddService(service)}
									>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{service.name}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{formatCurrency(service.default_unit_price_cents / 100)} /{' '}
											{service.default_unit === 'flat_rate'
												? 'Flat Rate'
												: service.default_unit}
										</Typography>
									</Box>
								))
							) : (
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ p: 1 }}
								>
									No services found
								</Typography>
							)}
						</Paper>
					)}
				</Box>
			)}

			{/* Added Services - only show if not searchOnly */}
			{!searchOnly && (
				<Box>
					{services.length === 0 ? (
						<Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
							No services added yet
						</Typography>
					) : (
						<Stack spacing={1}>
							{services.map((service, index) => (
								<Card key={index} variant="outlined">
									<CardContent sx={{ py: 1 }}>
										<Grid container spacing={2} alignItems="center">
											<Grid size={{ xs: 12, sm: 4 }}>
												<Typography variant="body2">{service.name}</Typography>
											</Grid>
											<Grid size={{ xs: 4, sm: 2 }}>
												<TextField
													size="small"
													type="number"
													label={
														service.unit === 'hour'
															? 'Hours'
															: service.unit === 'day'
																? 'Days'
																: 'Qty'
													}
													value={service.quantity}
													onChange={(e) =>
														handleUpdateService(index, {
															quantity: Math.max(
																1,
																parseInt(e.target.value) || 1
															),
														})
													}
													disabled={service.unit === 'flat_rate'}
													placeholder={
														service.unit === 'flat_rate' ? 'N/A' : ''
													}
													inputProps={{ min: 1 }}
												/>
											</Grid>
											<Grid size={{ xs: 4, sm: 2 }}>
												<Select
													size="small"
													value={service.unit}
													onChange={(e) => {
														const newUnit = e.target.value as any;
														handleUpdateService(index, {
															unit: newUnit,
															// Reset quantity to 1 when switching to flat_rate
															...(newUnit === 'flat_rate' && { quantity: 1 }),
														});
													}}
													fullWidth
												>
													<MenuItem value="flat_rate">flat rate</MenuItem>
													<MenuItem value="hour">hour</MenuItem>
													<MenuItem value="day">day</MenuItem>
												</Select>
											</Grid>
											<Grid size={{ xs: 4, sm: 3 }}>
												<ServicePriceField
													unitPriceCents={service.unitPriceCents}
													onPriceChange={(cents) =>
														handleUpdateService(index, {
															unitPriceCents: cents,
														})
													}
												/>
											</Grid>
											<Grid size={{ xs: 12, sm: 1 }}>
												<IconButton
													color="error"
													onClick={() => handleRemoveService(index)}
													size="small"
												>
													<DeleteIcon />
												</IconButton>
											</Grid>
										</Grid>
									</CardContent>
								</Card>
							))}
						</Stack>
					)}
				</Box>
			)}

			{/* Quick Add Dialog */}
			<Dialog
				open={showQuickAdd}
				onClose={handleCloseQuickAdd}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					Quick Add Service
					<IconButton
						aria-label="close"
						onClick={handleCloseQuickAdd}
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
					<Stack spacing={2} sx={{ mt: 2 }}>
						<TextField
							fullWidth
							label="Service Name"
							value={quickAddName}
							onChange={(e) => setQuickAddName(e.target.value)}
							autoFocus
						/>
						<ServicePriceInput
							ref={priceInputRef}
							price={quickAddPrice}
							unit={quickAddUnit}
							quantity={quickAddQuantity}
							onPriceChange={(price) => {
								setQuickAddPrice(price);
								// Clear error only when price is valid (> $0.00)
								if (
									quickAddPriceError &&
									dollarsToCents(parseFloatFromCurrency(price)) > 0
								) {
									setQuickAddPriceError('');
								}
							}}
							onUnitChange={(unit) => setQuickAddUnit(unit)}
							onQuantityChange={(quantity) => setQuickAddQuantity(quantity)}
							showTotal={true}
							error={quickAddPriceError}
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={quickAddToCatalog}
									onChange={(e) => {
										setQuickAddToCatalog(e.target.checked);
										// Reset frequently used if not adding to catalog
										if (!e.target.checked) {
											setQuickAddFrequentlyUsed(false);
										}
									}}
								/>
							}
							label="Add to service catalog for future use"
						/>
						{quickAddToCatalog && (
							<FormControlLabel
								control={
									<Checkbox
										checked={quickAddFrequentlyUsed}
										onChange={(e) =>
											setQuickAddFrequentlyUsed(e.target.checked)
										}
									/>
								}
								label="Mark as frequently used service"
								sx={{ ml: 3 }}
							/>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseQuickAdd}>Cancel</Button>
					<Button
						onClick={handleQuickAdd}
						variant="contained"
						disabled={!quickAddName.trim() || quickAddLoading}
						startIcon={
							quickAddLoading ? (
								<CircularProgress size={20} color="inherit" />
							) : (
								<AddIcon />
							)
						}
					>
						{quickAddLoading ? 'Adding...' : 'Add Service'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}

// Optimized Price Field Component - Isolated to prevent re-renders of parent
const ServicePriceField = React.memo(function ServicePriceField({
	unitPriceCents,
	onPriceChange,
}: {
	unitPriceCents: number;
	onPriceChange: (cents: number) => void;
}) {
	// Local state for focused value
	const [localValue, setLocalValue] = useState('');
	const [isFocused, setIsFocused] = useState(false);

	// Display value - local when focused, formatted from props when not
	const displayValue = isFocused
		? localValue
		: formatAsCurrency((unitPriceCents / 100).toFixed(2));

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const rawValue = e.target.value;
		// Format the input as currency
		setLocalValue(formatAsCurrency(rawValue));
	};

	const handleFocus = () => {
		const currentValue = (unitPriceCents / 100).toFixed(2);
		// Clear if it's 0.00, otherwise show the current value for easy editing
		setLocalValue(currentValue === '0.00' ? '' : currentValue);
		setIsFocused(true);
	};

	const handleBlur = () => {
		const numericValue = parseFloatFromCurrency(localValue || '0');
		const formatted = numericValue.toFixed(2);
		setLocalValue(formatted);
		setIsFocused(false);

		// Update parent immediately on blur
		const cents = dollarsToCents(numericValue);
		onPriceChange(cents);
	};

	return (
		<TextField
			size="small"
			label="Price"
			value={displayValue}
			onChange={handleChange}
			onFocus={handleFocus}
			onBlur={handleBlur}
			InputProps={{
				startAdornment: <InputAdornment position="start">$</InputAdornment>,
			}}
		/>
	);
});
