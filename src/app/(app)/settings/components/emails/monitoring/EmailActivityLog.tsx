'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Send as ResendIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import type { Dayjs } from 'dayjs';
import { format } from 'date-fns';

import { getEmailLogs } from '@/lib/actions/emails';
import { EmailLog, EmailStatus } from '@/types/email';
import {
  EMAIL_TYPE_LABELS,
  EMAIL_STATUS_LABELS,
  EMAIL_STATUS_COLORS,
} from '@/lib/utils/email/constants';
import { EmailLogDetails } from './EmailLogDetails';

export function EmailActivityLog() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    emailType: '',
    startDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    page: 0,
    rowsPerPage: 10,
  });

  useEffect(() => {
    loadLogs();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getEmailLogs({
        status: filters.status || undefined,
        emailType: filters.emailType || undefined,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        limit: filters.rowsPerPage,
        offset: filters.page * filters.rowsPerPage,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setLogs(result.data?.logs || []);
      setTotal(result.data?.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load email logs'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  const getStatusChip = (status: EmailStatus) => {
    return (
      <Chip
        label={EMAIL_STATUS_LABELS[status]}
        size="small"
        color={EMAIL_STATUS_COLORS[status] as any}
      />
    );
  };

  if (selectedLog) {
    return (
      <EmailLogDetails
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onResend={() => {
          setSelectedLog(null);
          loadLogs();
        }}
      />
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Email Activity</Typography>
        <IconButton onClick={loadLogs} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 0,
                  }))
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="sent">Sent</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="bounced">Bounced</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Email Type"
                value={filters.emailType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    emailType: e.target.value,
                    page: 0,
                  }))
                }
              >
                <MenuItem value="">All</MenuItem>
                {Object.entries(EMAIL_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: date,
                    page: 0,
                  }))
                }
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: date,
                    page: 0,
                  }))
                }
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadLogs}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : logs.length === 0 ? (
        <Alert severity="info">No emails found matching your filters.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell>{EMAIL_TYPE_LABELS[log.email_type]}</TableCell>
                  <TableCell>{log.recipient_email}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                      {log.subject}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(log.status)}</TableCell>
                  <TableCell>
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedLog(log)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    {log.status === 'failed' && log.attempts < 5 && (
                      <Tooltip title="Resend">
                        <IconButton size="small">
                          <ResendIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={filters.rowsPerPage}
            page={filters.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </TableContainer>
      )}
    </Box>
  );
}
