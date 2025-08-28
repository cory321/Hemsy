import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { checkPaymentDiscrepancies } from '@/lib/actions/payment-reconciliation';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import Link from 'next/link';

export default async function PaymentReconciliationPage() {
  const result = await checkPaymentDiscrepancies();

  if (!result.success) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            Failed to load payment reconciliation data: {result.error}
          </Alert>
        </Box>
      </Container>
    );
  }

  const discrepancies = result.data || [];
  const hasDiscrepancies = discrepancies.length > 0;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Payment Reconciliation
            </Typography>
            <Typography color="text.secondary">
              Monitor payment and refund data consistency
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            href="/admin/payment-reconciliation"
          >
            Refresh
          </Button>
        </Box>

        {/* Status Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {hasDiscrepancies ? (
                <>
                  <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" color="warning.main">
                      {discrepancies.length} Discrepancies Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment records don&apos;t match refund records
                    </Typography>
                  </Box>
                </>
              ) : (
                <>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6" color="success.main">
                      All Payments Reconciled
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment and refund records are consistent
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Discrepancies Table */}
        {hasDiscrepancies && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Discrepancies
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment ID</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Discrepancy</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {discrepancies.map((discrepancy) => (
                      <TableRow key={discrepancy.payment_id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                          >
                            {discrepancy.payment_id.slice(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={discrepancy.payment_method}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={discrepancy.consistency_status.replace(
                              /_/g,
                              ' '
                            )}
                            size="small"
                            color={
                              discrepancy.consistency_status ===
                              'PAYMENT_TABLE_HIGHER'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={
                              discrepancy.discrepancy_amount > 0
                                ? 'error.main'
                                : 'warning.main'
                            }
                            fontWeight="bold"
                          >
                            {formatCentsAsCurrency(
                              Math.abs(discrepancy.discrepancy_amount)
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {discrepancy.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            component={Link}
                            href={`/invoices/${discrepancy.invoice_id}`}
                          >
                            View Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>How to resolve discrepancies:</strong>
                </Typography>
                <Typography
                  variant="body2"
                  component="ul"
                  sx={{ mt: 1, mb: 0 }}
                >
                  <li>
                    Check if refunds were processed outside of the system
                    (manual refunds)
                  </li>
                  <li>Verify Stripe webhook events were received correctly</li>
                  <li>Review payment audit logs for unusual activity</li>
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
}
