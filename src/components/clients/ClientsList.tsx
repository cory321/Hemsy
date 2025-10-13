'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
	Box,
	TextField,
	InputAdornment,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TablePagination,
	Paper,
	IconButton,
	Avatar,
	Typography,
	Alert,
	Skeleton,
	FormControlLabel,
	Checkbox,
	Chip,
	LinearProgress,
	CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArchiveIcon from '@mui/icons-material/Archive';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPhoneNumber } from '@/lib/utils/phone';
import type { PaginatedClients, ClientsFilters } from '@/lib/actions/clients';

function getClientInitials(firstName: string, lastName: string) {
	const f = firstName?.trim() || '';
	const l = lastName?.trim() || '';
	const fi = f ? f[0] : '';
	const li = l ? l[0] : '';
	return `${fi}${li}`.toUpperCase() || '?';
}

interface ClientsListProps {
	initialData: PaginatedClients;
	getClientsAction: (
		page: number,
		pageSize: number,
		filters?: ClientsFilters
	) => Promise<PaginatedClients>;
	archivedClientsCount: number;
}

export default function ClientsList({
	initialData,
	getClientsAction,
	archivedClientsCount,
}: ClientsListProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(initialData.page - 1);
	const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
	const [showArchived, setShowArchived] = useState(false);

	const debouncedSearch = useDebounce(search, 300);
	const getClientsActionRef = useRef(getClientsAction);

	useEffect(() => {
		getClientsActionRef.current = getClientsAction;
	}, [getClientsAction]);

	const isInitialQueryKey =
		page === initialData.page - 1 &&
		rowsPerPage === initialData.pageSize &&
		debouncedSearch === '' &&
		showArchived === false;

	const { data, isLoading, isFetching } = useQuery({
		queryKey: ['clients', page, rowsPerPage, debouncedSearch, showArchived],
		queryFn: async () => {
			setError(null);
			try {
				const filters: ClientsFilters = {
					search: debouncedSearch,
					sortBy: 'created_at',
					sortOrder: 'desc',
					includeArchived: showArchived,
				};
				return await getClientsActionRef.current(
					page + 1,
					rowsPerPage,
					filters
				);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to fetch clients'
				);
				throw err;
			}
		},
		staleTime: 30 * 1000,
		refetchOnWindowFocus: false,
		// Keep previous data while fetching new to minimize UI flicker
		placeholderData: (prev) => prev,
		// Provide initial data only for the initial hydrated key
		...(isInitialQueryKey ? { initialData } : {}),
	});

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setPage(0);
	};

	const handleRowClick = (clientId: string) => {
		router.push(`/clients/${clientId}`);
	};

	// Remove local formatPhoneNumber function - using imported utility

	return (
		<Box>
			{/* Search Bar and Archive Toggle */}
			<Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search by name, email, or phone..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
				/>
				{archivedClientsCount > 0 && (
					<FormControlLabel
						control={
							<Checkbox
								checked={showArchived}
								onChange={(e) => {
									setShowArchived(e.target.checked);
									setPage(0); // Reset to first page when toggling
								}}
								disabled={isLoading}
							/>
						}
						label={
							<Box
								sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
							>
								<span>Show Archived</span>
								{!isLoading && isFetching && <CircularProgress size={14} />}
							</Box>
						}
						sx={{ flexShrink: 0 }}
					/>
				)}
			</Box>

			{/* Background loading indicator while keeping table content */}
			{!isLoading && isFetching && (
				<LinearProgress sx={{ mb: 1 }} aria-label="Loading clients" />
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Table */}
			<TableContainer component={Paper} elevation={1}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Name</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Phone</TableCell>
							<TableCell>Notes</TableCell>
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							// Loading skeletons
							Array.from({ length: rowsPerPage }).map((_, index) => (
								<TableRow key={index}>
									<TableCell>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<Skeleton variant="circular" width={40} height={40} />
											<Skeleton variant="text" width={150} />
										</Box>
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={200} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={120} />
									</TableCell>
									<TableCell>
										<Skeleton variant="text" width={100} />
									</TableCell>
									<TableCell align="right">
										<Skeleton variant="circular" width={24} height={24} />
									</TableCell>
								</TableRow>
							))
						) : (data?.data?.length ?? 0) === 0 ? (
							<TableRow>
								<TableCell colSpan={5} align="center">
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ py: 4 }}
									>
										{search
											? 'No clients found matching your search'
											: 'No clients yet'}
									</Typography>
								</TableCell>
							</TableRow>
						) : (
							(data?.data ?? []).map((client) => (
								<TableRow
									key={client.id}
									hover
									sx={{
										cursor: 'pointer',
										opacity: (client as any).is_archived ? 0.7 : 1,
									}}
									onClick={() => handleRowClick(client.id)}
								>
									<TableCell>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
											<Avatar
												sx={{
													width: 40,
													height: 40,
													bgcolor: (client as any).is_archived
														? 'grey.400'
														: 'secondary.dark',
													color: 'primary.contrastText',
													fontSize: (theme) => theme.typography.body1.fontSize, // 16px
													fontWeight: 600,
													'tr:hover &': {
														bgcolor: (client as any).is_archived
															? 'grey.400'
															: 'primary.main',
													},
												}}
											>
												{getClientInitials(client.first_name, client.last_name)}
											</Avatar>
											<Box>
												<Typography variant="body2">
													{client.first_name} {client.last_name}
												</Typography>
												{(client as any).is_archived && (
													<Chip
														icon={<ArchiveIcon />}
														label="Archived"
														size="small"
														color="default"
														sx={{ mt: 0.5 }}
													/>
												)}
											</Box>
										</Box>
									</TableCell>
									<TableCell>{client.email}</TableCell>
									<TableCell>
										{formatPhoneNumber(client.phone_number)}
									</TableCell>
									<TableCell>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												maxWidth: 200,
											}}
										>
											{client.notes || '—'}
										</Typography>
									</TableCell>
									<TableCell align="right">
										<IconButton size="small">
											<ChevronRightIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
				<TablePagination
					rowsPerPageOptions={[5, 10, 25, 50]}
					component="div"
					count={data?.count ?? 0}
					rowsPerPage={rowsPerPage}
					page={page}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
				/>
			</TableContainer>
		</Box>
	);
}
