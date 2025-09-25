'use client';

import { useEffect, useState, useCallback } from 'react';
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
	Paper,
	Typography,
	CircularProgress,
	Alert,
	Chip,
	IconButton,
	Tooltip,
	useTheme,
	useMediaQuery,
	Skeleton,
	Stack,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UpdateIcon from '@mui/icons-material/Update';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { getGarmentHistory } from '@/lib/actions/garments';
import { format, formatDistanceToNow } from 'date-fns';
import { useGarment } from '@/contexts/GarmentContext';

interface HistoryEntry {
	id: string;
	garment_id: string;
	changed_by: string;
	changed_at: string;
	field_name: string;
	old_value: any;
	new_value: any;
	change_type: string;
	related_service_id?: string | null;
	isOptimistic?: boolean;
	isPersisting?: boolean;
}

interface GarmentHistoryTableProps {
	garmentId: string;
	initialHistoryData?: HistoryEntry[] | undefined;
}

export default function GarmentHistoryTable({
	garmentId,
	initialHistoryData,
}: GarmentHistoryTableProps) {
	const [history, setHistory] = useState<HistoryEntry[]>(
		initialHistoryData || []
	);
	const [loading, setLoading] = useState(!initialHistoryData);
	const [error, setError] = useState<string | null>(null);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [filterType, setFilterType] = useState<string>('all');

	const { optimisticHistoryEntry, historyRefreshSignal } = useGarment();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

	// Initial load - only fetch if no initial data provided
	useEffect(() => {
		if (!initialHistoryData) {
			fetchHistory();
		}
	}, [garmentId, initialHistoryData]);

	// Handle optimistic updates
	useEffect(() => {
		if (optimisticHistoryEntry) {
			setHistory((prev) => [
				{ ...optimisticHistoryEntry, isPersisting: true },
				...prev,
			]);

			const timer = setTimeout(() => {
				setHistory((prev) =>
					prev.map((entry) =>
						entry.id === optimisticHistoryEntry.id
							? { ...entry, isPersisting: false, isOptimistic: false }
							: entry
					)
				);
			}, 500);

			return () => clearTimeout(timer);
		}
		// Return undefined for the else case to satisfy TypeScript
		return undefined;
	}, [optimisticHistoryEntry]);

	// Refresh on signal
	useEffect(() => {
		if (historyRefreshSignal > 0) {
			refreshHistory();
		}
	}, [historyRefreshSignal]);

	const fetchHistory = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await getGarmentHistory(garmentId);
			if (result.success) {
				setHistory(result.history || []);
			} else {
				setError(result.error || 'Failed to load history');
			}
		} catch (err) {
			setError('An unexpected error occurred');
		} finally {
			setLoading(false);
		}
	};

	const refreshHistory = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const result = await getGarmentHistory(garmentId);
			if (result.success) {
				setHistory(result.history || []);
			}
		} catch (err) {
			// Silent refresh failure
		} finally {
			setIsRefreshing(false);
		}
	}, [garmentId]);

	const handleChangePage = (event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const getChangeIcon = (entry: HistoryEntry) => {
		const { change_type, field_name, new_value, old_value } = entry;

		// Service changes
		if (change_type === 'service_added')
			return <AddIcon sx={{ fontSize: 20, color: '#4CAF50' }} />;
		if (change_type === 'service_removed')
			return <RemoveIcon sx={{ fontSize: 20, color: '#F44336' }} />;
		if (change_type === 'service_restored')
			return <RestartAltIcon sx={{ fontSize: 20, color: '#4CAF50' }} />;
		if (change_type === 'service_updated') {
			if (new_value?.completion_status === 'completed') {
				return <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />;
			} else if (new_value?.completion_status === 'incomplete') {
				return (
					<RadioButtonUncheckedIcon sx={{ fontSize: 20, color: '#757575' }} />
				);
			}
			return <EditIcon sx={{ fontSize: 20, color: '#FF9800' }} />;
		}

		// Field-specific changes
		if (field_name === 'due_date' || field_name === 'event_date')
			return <EventIcon sx={{ fontSize: 20, color: '#2196F3' }} />;
		if (field_name === 'stage') {
			const newStage = new_value;
			const oldStage = old_value;

			if (newStage === 'In Progress' && oldStage === 'New') {
				return (
					<PlayCircleOutlineIcon sx={{ fontSize: 20, color: '#2196F3' }} />
				);
			} else if (newStage === 'Ready For Pickup') {
				return (
					<CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
				);
			} else if (newStage === 'Done') {
				return <LocalShippingIcon sx={{ fontSize: 20, color: '#9C27B0' }} />;
			} else if (newStage === 'New') {
				return <RestartAltIcon sx={{ fontSize: 20, color: '#FF9800' }} />;
			}
			return <UpdateIcon sx={{ fontSize: 20, color: '#2196F3' }} />;
		}

		return <EditIcon sx={{ fontSize: 20, color: '#FF9800' }} />;
	};

	const formatChange = (entry: HistoryEntry) => {
		const { change_type, field_name, old_value, new_value } = entry;

		switch (change_type) {
			case 'field_update':
				if (field_name === 'stage') {
					const oldStage = old_value || 'not set';
					const newStage = new_value || 'not set';

					if (newStage === 'In Progress' && oldStage === 'New') {
						return {
							action: 'Garment started',
							detail: 'Moved to In Progress',
						};
					} else if (
						newStage === 'Ready For Pickup' &&
						oldStage === 'In Progress'
					) {
						return { action: 'Garment completed', detail: 'Ready for pickup' };
					} else if (newStage === 'Done' && oldStage === 'Ready For Pickup') {
						return { action: 'Garment picked up', detail: 'Marked as done' };
					} else if (newStage === 'New') {
						return { action: 'Garment reset', detail: 'Moved back to New' };
					}
					return { action: `Moved to ${newStage}`, detail: `From ${oldStage}` };
				}

				const fieldLabels: Record<string, string> = {
					name: 'Name',
					due_date: 'Due date',
					event_date: 'Event date',
					icon: 'Icon',
					fill_color: 'Icon color',
					notes: 'Notes',
				};

				const fieldLabel = fieldLabels[field_name] || field_name;

				if (field_name === 'due_date' || field_name === 'event_date') {
					const oldDate = old_value
						? format(new Date(old_value + 'T12:00:00'), 'M/d/yy')
						: 'not set';
					const newDate = new_value
						? format(new Date(new_value + 'T12:00:00'), 'M/d/yy')
						: 'not set';
					return {
						action: `${fieldLabel} changed`,
						detail: `${oldDate} → ${newDate}`,
					};
				}

				return {
					action: `${fieldLabel} updated`,
					detail: `${old_value || ''} → ${new_value || ''}`,
				};

			case 'service_added':
				return { action: 'Service added', detail: new_value?.name || '' };

			case 'service_removed':
				return { action: 'Service removed', detail: old_value?.name || '' };

			case 'service_restored':
				return { action: 'Service restored', detail: new_value?.name || '' };

			case 'service_updated':
				const serviceName = old_value?.service_name || new_value?.service_name;

				if (old_value?.completion_status && new_value?.completion_status) {
					if (new_value.completion_status === 'completed') {
						return { action: 'Service completed', detail: serviceName };
					} else {
						return { action: 'Service marked incomplete', detail: serviceName };
					}
				}

				return { action: 'Service updated', detail: serviceName || '' };

			default:
				return { action: 'Changes made', detail: '' };
		}
	};

	if (loading) {
		return (
			<Paper elevation={0} sx={{ p: 2 }}>
				<Stack spacing={2}>
					<Skeleton variant="rectangular" height={40} />
					<Skeleton variant="rectangular" height={400} />
				</Stack>
			</Paper>
		);
	}

	if (error) {
		return (
			<Paper elevation={0} sx={{ p: 2 }}>
				<Alert severity="error">{error}</Alert>
			</Paper>
		);
	}

	// Filter history based on selected type
	const filteredHistory = history.filter((entry) => {
		if (filterType === 'all') return true;
		if (filterType === 'stage') return entry.field_name === 'stage';
		if (filterType === 'services')
			return [
				'service_added',
				'service_removed',
				'service_updated',
				'service_restored',
			].includes(entry.change_type);
		if (filterType === 'fields')
			return (
				entry.change_type === 'field_update' && entry.field_name !== 'stage'
			);
		return true;
	});

	const paginatedHistory = filteredHistory.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage
	);

	return (
		<Paper
			elevation={0}
			sx={{
				width: '100%',
				overflow: 'hidden',
				border: 1,
				borderColor: 'divider',
				borderRadius: 2,
				backgroundColor: 'background.paper',
			}}
		>
			<Box
				sx={{
					p: 2.5,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					borderBottom: 1,
					borderColor: 'divider',
					backgroundColor: 'grey.50',
				}}
			>
				<Box>
					<Typography variant="h6" component="h2" fontWeight={600}>
						Change History
					</Typography>
					{history.length > 0 && (
						<Typography variant="caption" color="text.secondary">
							{filteredHistory.length}
							{filteredHistory.length !== history.length &&
								` of ${history.length}`}{' '}
							change{filteredHistory.length !== 1 ? 's' : ''}
						</Typography>
					)}
				</Box>
				<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
					{!isMobile && (
						<FormControl size="small" sx={{ minWidth: 120 }}>
							<Select
								value={filterType}
								onChange={(e) => {
									setFilterType(e.target.value);
									setPage(0);
								}}
								displayEmpty
								sx={{ fontSize: 14 }}
							>
								<MenuItem value="all">All Changes</MenuItem>
								<MenuItem value="stage">Stage Changes</MenuItem>
								<MenuItem value="services">Service Changes</MenuItem>
								<MenuItem value="fields">Field Updates</MenuItem>
							</Select>
						</FormControl>
					)}
					<Tooltip title="Refresh history">
						<IconButton
							onClick={refreshHistory}
							disabled={isRefreshing}
							size="small"
							sx={{
								backgroundColor: 'background.paper',
								'&:hover': {
									backgroundColor: 'action.hover',
								},
							}}
						>
							<RefreshIcon
								sx={{
									fontSize: 20,
									animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
									'@keyframes spin': {
										'0%': { transform: 'rotate(0deg)' },
										'100%': { transform: 'rotate(360deg)' },
									},
								}}
							/>
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{history.length === 0 ? (
				<Box sx={{ p: 4, textAlign: 'center' }}>
					<Typography color="text.secondary">
						No changes recorded yet
					</Typography>
				</Box>
			) : (
				<>
					<TableContainer sx={{ maxHeight: 600 }}>
						<Table stickyHeader size="medium">
							<TableHead>
								<TableRow>
									<TableCell width={50} sx={{ fontWeight: 600 }}></TableCell>
									<TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
										Action
									</TableCell>
									{!isMobile && (
										<TableCell sx={{ fontWeight: 600, minWidth: 300 }}>
											Details
										</TableCell>
									)}
									<TableCell
										align="right"
										sx={{ fontWeight: 600, minWidth: 150 }}
									>
										When
									</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{paginatedHistory.map((entry) => {
									const { action, detail } = formatChange(entry);
									const isPending = entry.isOptimistic || entry.isPersisting;

									return (
										<TableRow
											key={entry.id}
											sx={{
												opacity: isPending ? 0.6 : 1,
												transition: 'all 0.2s ease',
												'&:hover': {
													backgroundColor: 'action.hover',
													'& .MuiTableCell-root': {
														borderColor: 'divider',
													},
												},
												'& .MuiTableCell-root': {
													borderBottom: '1px solid',
													borderColor: 'divider',
													py: 2,
												},
											}}
										>
											<TableCell>
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												>
													{getChangeIcon(entry)}
												</Box>
											</TableCell>
											<TableCell>
												<Typography variant="body2" fontWeight={500}>
													{action}
												</Typography>
												{isMobile && detail && (
													<Typography variant="caption" color="text.secondary">
														{detail}
													</Typography>
												)}
											</TableCell>
											{!isMobile && (
												<TableCell>
													<Typography variant="body2" color="text.secondary">
														{detail}
													</Typography>
												</TableCell>
											)}
											<TableCell align="right">
												<Tooltip
													title={format(new Date(entry.changed_at), 'PPpp')}
												>
													<Typography variant="caption" color="text.secondary">
														{formatDistanceToNow(new Date(entry.changed_at), {
															addSuffix: true,
														})}
													</Typography>
												</Tooltip>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>

					<TablePagination
						rowsPerPageOptions={[5, 10, 25, 50]}
						component="div"
						count={filteredHistory.length}
						rowsPerPage={rowsPerPage}
						page={page}
						onPageChange={handleChangePage}
						onRowsPerPageChange={handleChangeRowsPerPage}
					/>
				</>
			)}
		</Paper>
	);
}
