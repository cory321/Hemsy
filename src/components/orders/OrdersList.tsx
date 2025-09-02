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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonIcon from '@mui/icons-material/Person';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import type { PaginatedOrders, OrdersFilters } from '@/lib/actions/orders';
import type { Database } from '@/types/supabase';
import OrderCardMinimal from './OrderCardMinimal';
import OrderCardCompact from './OrderCardCompact';
import OrderCardDetailed from './OrderCardDetailed';

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
    case 'active':
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
    case 'active':
      return 'Active';
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

type ViewMode = 'minimal' | 'compact' | 'detailed';

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
    Database['public']['Enums']['order_status'] | 'all'
  >('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [page, setPage] = useState(initialData.page - 1);
  const [rowsPerPage, setRowsPerPage] = useState(initialData.pageSize);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  // View mode state with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>('compact');

  const debouncedSearch = useDebounce(search, 300);
  const getOrdersActionRef = useRef(getOrdersAction);

  // Load view preference from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem('orderListViewMode') as ViewMode;
    if (savedView && ['minimal', 'compact', 'detailed'].includes(savedView)) {
      setViewMode(savedView);
    }
  }, []);

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
        statusFilter !== 'all' ||
        paymentStatusFilter !== 'all';
      if (isSearchOrStatusChange) {
        setIsFiltering(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const status = statusFilter === 'all' ? undefined : statusFilter;
        const paymentStatus =
          paymentStatusFilter === 'all' ? undefined : paymentStatusFilter;
        const filters: OrdersFilters = {
          search: debouncedSearch,
          ...(status && { status }),
          ...(paymentStatus && { paymentStatus }),
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

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
      localStorage.setItem('orderListViewMode', newMode);
    }
  };

  // The paid amount is now calculated on the server from actual invoice payments
  // No need to estimate here anymore
  const ordersWithPaymentInfo = data.data;

  return (
    <Box data-testid="orders-list">
      {/* Filters */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
          {/* View Mode Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value="minimal" aria-label="minimal view">
              <Tooltip title="Minimal View">
                <ViewListIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="compact" aria-label="compact view">
              <Tooltip title="Compact View">
                <ViewAgendaIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="detailed" aria-label="detailed view">
              <Tooltip title="Detailed View">
                <DashboardIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
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
                    | 'all'
                )
              }
            >
              <MenuItem value="all">All Order Statuses</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="active">Active</MenuItem>
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
            ordersWithPaymentInfo.map((order) => {
              // Render different card component based on view mode
              switch (viewMode) {
                case 'minimal':
                  return (
                    <OrderCardMinimal
                      key={order.id}
                      order={order}
                      onClick={handleCardClick}
                    />
                  );
                case 'detailed':
                  return (
                    <OrderCardDetailed
                      key={order.id}
                      order={order}
                      onClick={handleCardClick}
                    />
                  );
                case 'compact':
                default:
                  return (
                    <OrderCardCompact
                      key={order.id}
                      order={order}
                      onClick={handleCardClick}
                    />
                  );
              }
            })
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
