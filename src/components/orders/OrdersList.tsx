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
  CircularProgress,
  Backdrop,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import type { PaginatedOrders, OrdersFilters } from '@/lib/actions/orders';
import type { Database } from '@/types/supabase';
import OrderCardMinimal from './OrderCardMinimal';

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
    case 'new':
      return 'default';
    case 'in_progress':
      return 'info';
    case 'ready_for_pickup':
      return 'warning';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'new':
      return 'New';
    case 'in_progress':
      return 'In Progress';
    case 'ready_for_pickup':
      return 'Ready For Pickup';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
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
  const [statusFilter, setStatusFilter] = useState<
    Database['public']['Enums']['order_status'] | 'active' | 'all'
  >('active');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(initialData.page - 1);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

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
      // Use isFiltering for search/status changes, loading for pagination
      const isSearchOrStatusChange =
        debouncedSearch !== '' ||
        statusFilter !== 'active' ||
        paymentStatusFilter !== 'all';
      if (isSearchOrStatusChange) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const status = statusFilter === 'active' ? undefined : statusFilter;
        const paymentStatus =
          paymentStatusFilter === 'all' ? undefined : paymentStatusFilter;

        // Handle cancelled order filtering
        const onlyCancelled = statusFilter === 'cancelled';
        const includeCancelled = statusFilter === 'cancelled';

        // Handle active orders filtering (exclude completed and cancelled)
        const onlyActive = statusFilter === 'active';

        const filters: OrdersFilters = {
          search: debouncedSearch,
          ...(status && status !== 'cancelled' && { status }),
          ...(paymentStatus && { paymentStatus }),
          sortBy: 'created_at',
          sortOrder: 'desc',
          includeCancelled,
          onlyCancelled,
          onlyActive,
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
        setIsFiltering(false);
      }
    };

    fetchData();
  }, [
    page,
    rowsPerPage,
    debouncedSearch,
    statusFilter,
    paymentStatusFilter,
    isInitialLoad,
  ]);

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

  // The paid amount is now calculated on the server from actual invoice payments
  // No need to estimate here anymore
  const ordersWithPaymentInfo = data.data;

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Order Status</InputLabel>
            <Select
              value={statusFilter}
              label="Order Status"
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | Database['public']['Enums']['order_status']
                    | 'active'
                )
              }
              MenuProps={{
                disableScrollLock: true,
              }}
            >
              <MenuItem value="active">All Active Orders</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="ready_for_pickup">Ready For Pickup</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={paymentStatusFilter}
              label="Payment Status"
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              MenuProps={{
                disableScrollLock: true,
              }}
            >
              <MenuItem value="all">All Payment Statuses</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="partially_paid">Partially Paid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="overpaid">Overpaid</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Orders List */}
      <Box sx={{ position: 'relative' }}>
        {/* Subtle loading overlay for filtering */}
        {isFiltering && (
          <Backdrop
            open={isFiltering}
            sx={{
              position: 'absolute',
              zIndex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 1,
            }}
          >
            <CircularProgress size={40} />
          </Backdrop>
        )}

        <Stack spacing={2}>
          {loading ? (
            // Loading skeletons for pagination
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
            ordersWithPaymentInfo.map((order) => (
              <OrderCardMinimal
                key={order.id}
                order={order}
                onClick={handleCardClick}
              />
            ))
          )}
        </Stack>
      </Box>

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
