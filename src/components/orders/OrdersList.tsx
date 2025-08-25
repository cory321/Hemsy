'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  Typography,
  TablePagination,
  Paper,
  IconButton,
  Skeleton,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import type { PaginatedOrders, OrdersFilters } from '@/lib/actions/orders';

interface OrdersListProps {
  initialData: PaginatedOrders;
  getOrdersAction: (
    page: number,
    pageSize: number,
    filters?: OrdersFilters
  ) => Promise<PaginatedOrders>;
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'partially_paid':
      return 'info';
    case 'paid':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function OrdersList({
  initialData,
  getOrdersAction,
}: OrdersListProps) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedOrders>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(initialData.page - 1);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const getOrdersActionRef = useRef(getOrdersAction);

  useEffect(() => {
    getOrdersActionRef.current = getOrdersAction;
  }, [getOrdersAction]);

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
        const status = statusFilter === 'all' ? undefined : statusFilter;
        const filters: OrdersFilters = {
          search: debouncedSearch,
          ...(status && { status }),
          sortBy: 'created_at',
          sortOrder: 'desc',
        };
        const result = await getOrdersActionRef.current(
          page + 1,
          rowsPerPage,
          filters
        );
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, rowsPerPage, debouncedSearch, statusFilter, isInitialLoad]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCardClick = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  return (
    <Box data-testid="orders-list">
      {/* Filters */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by order number or notes..."
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="partially_paid">Partially Paid</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Orders List */}
      <Stack spacing={2}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: rowsPerPage }).map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Stack spacing={2}>
                  <Skeleton variant="text" width="30%" height={32} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="20%" />
                    </Box>
                  </Box>
                  <Skeleton variant="rectangular" height={24} width="25%" />
                </Stack>
              </CardContent>
            </Card>
          ))
        ) : data.data.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {search || statusFilter !== 'all'
                  ? 'No orders found matching your filters'
                  : 'No orders yet'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          data.data.map((order) => (
            <Card
              key={order.id}
              data-testid={`order-card-${order.id}`}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => handleCardClick(order.id)}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">
                    Order #{order.order_number || 'N/A'}
                  </Typography>
                  <IconButton size="small">
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {order.client
                      ? `${order.client.first_name} ${order.client.last_name}`
                      : 'No Client'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={getStatusLabel(order.status || 'pending')}
                      color={getStatusColor(order.status || 'pending')}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {order.garments?.length || 0} garment
                      {order.garments?.length !== 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Typography variant="h6">
                      {formatUSD(order.total_cents)}
                    </Typography>
                    {order.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Pagination */}
      <Paper elevation={1} sx={{ mt: 3 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
