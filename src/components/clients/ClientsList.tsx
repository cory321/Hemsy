'use client';

import { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
}

export default function ClientsList({
  initialData,
  getClientsAction,
}: ClientsListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedClients>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(initialData.page - 1);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const getClientsActionRef = useRef(getClientsAction);

  useEffect(() => {
    getClientsActionRef.current = getClientsAction;
  }, [getClientsAction]);

  useEffect(() => {
    // Skip the initial load since we already have data
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters: ClientsFilters = {
          search: debouncedSearch,
          sortBy: 'created_at',
          sortOrder: 'desc',
        };
        const result = await getClientsActionRef.current(
          page + 1,
          rowsPerPage,
          filters
        );
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch clients'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, rowsPerPage, debouncedSearch, isInitialLoad, getClientsAction]);

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
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name, email, or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

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
            {loading ? (
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
            ) : data.data.length === 0 ? (
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
              data.data.map((client) => (
                <TableRow
                  key={client.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(client.id)}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                        }}
                      >
                        {getClientInitials(client.first_name, client.last_name)}
                      </Avatar>
                      <Typography variant="body2">
                        {client.first_name} {client.last_name}
                      </Typography>
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
          count={data.count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
}
