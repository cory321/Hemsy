'use client';

import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Chip,
  Fab,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import CancelIcon from '@mui/icons-material/Cancel';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  getInvoicesPaginated,
  getInvoiceStats,
  cancelInvoice,
  generatePaymentLink,
} from '@/lib/actions/invoices';
import { sendPaymentRequestEmail } from '@/lib/actions/emails/invoice-emails';
import type { InvoicesFilters } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/formatting';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface InvoicesClientProps {
  initialPage?: number;
  initialFilters?: InvoicesFilters;
}

export default function InvoicesClient({
  initialPage = 1,
  initialFilters = {},
}: InvoicesClientProps) {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '');
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Map tab values to status filters
  const getStatusFromTab = (
    tab: number
  ): InvoicesFilters['status'] | undefined => {
    switch (tab) {
      case 1:
        return 'pending';
      case 2:
        return 'partially_paid';
      case 3:
        return 'paid';
      case 4:
        return 'cancelled';
      default:
        return undefined;
    }
  };

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const status = getStatusFromTab(tabValue);
      const filters: InvoicesFilters = {
        search: debouncedSearchTerm,
        ...(status && { status }),
        sortBy: 'created_at',
        sortOrder: 'desc',
      };

      const result = await getInvoicesPaginated(page, 10, filters);
      setInvoices(result.data);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearchTerm, tabValue]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getInvoiceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    invoiceId: string
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleCancelInvoice = async () => {
    if (!selectedInvoiceId) return;

    handleMenuClose();

    if (confirm('Are you sure you want to cancel this invoice?')) {
      try {
        const result = await cancelInvoice(selectedInvoiceId);
        if (result.success) {
          toast.success('Invoice cancelled');
          fetchInvoices();
          fetchStats();
        } else {
          toast.error(result.error || 'Failed to cancel invoice');
        }
      } catch (error) {
        toast.error('Failed to cancel invoice');
      }
    }
  };

  const handleSendPaymentLink = async () => {
    if (!selectedInvoiceId) return;

    handleMenuClose();

    try {
      // Generate payment link
      const linkResult = await generatePaymentLink(selectedInvoiceId);
      if (!linkResult.success) {
        toast.error(linkResult.error || 'Failed to generate payment link');
        return;
      }

      // Email is sent automatically by the server action
      toast.success('Payment link sent');
    } catch (error) {
      toast.error('Failed to send payment link');
    }
  };

  const handleResendInvoice = async () => {
    if (!selectedInvoiceId) return;

    handleMenuClose();

    try {
      const result = await sendPaymentRequestEmail(selectedInvoiceId);
      if (result.success) {
        toast.success('Invoice email sent');
      } else {
        toast.error(result.error || 'Failed to send invoice');
      }
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partially_paid':
        return 'info';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'partially_paid':
        return 'Partial';
      case 'paid':
        return 'Paid';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const isOverdue = (invoice: any) => {
    return (
      invoice.status === 'pending' &&
      invoice.due_date &&
      new Date(invoice.due_date) < new Date()
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Invoices
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Outstanding
                </Typography>
                {stats ? (
                  <Typography variant="h5">
                    {formatCurrency(stats.pendingAmountCents)}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={100} height={32} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {stats?.pendingCount || 0} invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Overdue
                </Typography>
                {stats ? (
                  <Typography variant="h5" color="error">
                    {formatCurrency(stats.overdueAmountCents)}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={100} height={32} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {stats?.overdueCount || 0} invoices
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  This Month
                </Typography>
                {stats ? (
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(stats.monthlyRevenueCents)}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={100} height={32} />
                )}
                <Typography variant="caption" color="text.secondary">
                  Collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Invoice
                </Typography>
                {stats && stats.pendingCount > 0 ? (
                  <Typography variant="h5">
                    {formatCurrency(
                      Math.round(stats.pendingAmountCents / stats.pendingCount)
                    )}
                  </Typography>
                ) : (
                  <Typography variant="h5">$0.00</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Search Bar */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by invoice number, client name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => {
            setTabValue(newValue);
            setPage(1);
          }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Partial" />
          <Tab label="Paid" />
          <Tab label="Cancelled" />
        </Tabs>

        {/* Invoices List */}
        {loading && invoices.length === 0 ? (
          <Box>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={80}
                sx={{ mb: 1, borderRadius: 1 }}
              />
            ))}
          </Box>
        ) : invoices.length === 0 ? (
          <Alert severity="info">No invoices found</Alert>
        ) : (
          <List>
            {invoices.map((invoice) => (
              <ListItem
                key={invoice.id}
                component={Link}
                href={`/invoices/${invoice.id}`}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  pr: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemText
                  disableTypography
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1">
                        {invoice.invoice_number}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        - {invoice.client.first_name} {invoice.client.last_name}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created{' '}
                        {formatDistanceToNow(new Date(invoice.created_at), {
                          addSuffix: true,
                        })}
                        {invoice.due_date &&
                          ` • Due ${new Date(invoice.due_date).toLocaleDateString()}`}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6">
                    {formatCurrency(invoice.amount_cents)}
                  </Typography>
                  <Chip
                    label={
                      isOverdue(invoice)
                        ? 'OVERDUE'
                        : getStatusLabel(invoice.status)
                    }
                    color={
                      isOverdue(invoice)
                        ? 'error'
                        : (getStatusColor(invoice.status) as any)
                    }
                    size="small"
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, invoice.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            {/* Add pagination component here */}
          </Box>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleResendInvoice}>
            <EmailIcon sx={{ mr: 1 }} fontSize="small" />
            Resend Invoice
          </MenuItem>
          <MenuItem onClick={handleSendPaymentLink}>
            <LinkIcon sx={{ mr: 1 }} fontSize="small" />
            Send Payment Link
          </MenuItem>
          <MenuItem onClick={handleCancelInvoice}>
            <CancelIcon sx={{ mr: 1 }} fontSize="small" />
            Cancel Invoice
          </MenuItem>
        </Menu>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="create invoice"
          component={Link}
          href="/orders"
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
