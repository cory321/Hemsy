'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  RestoreFromTrash as RestoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCentsAsCurrency } from '@/lib/utils/currency';

interface InvoiceLineItem {
  id: string;
  garment_id: string;
  name: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  description?: string;
  is_removed?: boolean;
  removed_at?: string;
  removal_reason?: string;
  garment_name?: string;
}

interface InvoiceLineItemsProps {
  items: InvoiceLineItem[];
  showRemoved?: boolean;
  onRestoreItem?: (itemId: string, garmentId: string) => void;
  readonly?: boolean;
}

export default function InvoiceLineItems({
  items,
  showRemoved = true,
  onRestoreItem,
  readonly = false,
}: InvoiceLineItemsProps) {
  const activeItems = items.filter((item) => !item.is_removed);
  const removedItems = items.filter((item) => item.is_removed);

  const activeTotal = activeItems.reduce(
    (sum, item) => sum + item.line_total_cents,
    0
  );
  const removedTotal = removedItems.reduce(
    (sum, item) => sum + item.line_total_cents,
    0
  );

  const renderItemRow = (item: InvoiceLineItem, isRemoved = false) => (
    <TableRow
      key={item.id}
      sx={{
        opacity: isRemoved ? 0.6 : 1,
        backgroundColor: isRemoved ? 'action.hover' : 'inherit',
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="body2"
            sx={{
              textDecoration: isRemoved ? 'line-through' : 'none',
              color: isRemoved ? 'text.secondary' : 'text.primary',
            }}
          >
            {item.name}
          </Typography>
          {isRemoved && (
            <Chip
              label="Removed"
              size="small"
              color="default"
              variant="outlined"
            />
          )}
        </Box>
        {item.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: isRemoved ? 'line-through' : 'none',
            }}
          >
            {item.description}
          </Typography>
        )}
        {item.garment_name && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textDecoration: isRemoved ? 'line-through' : 'none',
            }}
          >
            Garment: {item.garment_name}
          </Typography>
        )}
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          sx={{
            textDecoration: isRemoved ? 'line-through' : 'none',
            color: isRemoved ? 'text.secondary' : 'text.primary',
          }}
        >
          {item.quantity}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Typography
          variant="body2"
          sx={{
            textDecoration: isRemoved ? 'line-through' : 'none',
            color: isRemoved ? 'text.secondary' : 'text.primary',
          }}
        >
          {formatCentsAsCurrency(item.unit_price_cents)}
        </Typography>
      </TableCell>

      <TableCell align="right">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          gap={1}
        >
          <Typography
            variant="body2"
            sx={{
              textDecoration: isRemoved ? 'line-through' : 'none',
              color: isRemoved ? 'text.secondary' : 'text.primary',
              fontWeight: isRemoved ? 'normal' : 'medium',
            }}
          >
            {formatCentsAsCurrency(item.line_total_cents)}
          </Typography>

          {isRemoved && (
            <>
              {item.removal_reason && (
                <Tooltip title={`Removed: ${item.removal_reason}`}>
                  <InfoIcon fontSize="small" color="action" />
                </Tooltip>
              )}

              {!readonly && onRestoreItem && (
                <Tooltip title="Restore this service">
                  <IconButton
                    size="small"
                    onClick={() => onRestoreItem(item.id, item.garment_id)}
                    color="primary"
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Service</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit Price</TableCell>
            <TableCell align="right">Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Active Items */}
          {activeItems.map((item) => renderItemRow(item, false))}

          {/* Removed Items (if showing) */}
          {showRemoved && removedItems.length > 0 && (
            <>
              {/* Separator row */}
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Removed Services (not charged):
                  </Typography>
                </TableCell>
              </TableRow>

              {removedItems.map((item) => renderItemRow(item, true))}
            </>
          )}

          {/* Totals */}
          <TableRow>
            <TableCell colSpan={3}>
              <Typography variant="subtitle2">
                Subtotal ({activeItems.length} services):
              </Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="subtitle2" fontWeight="bold">
                {formatCentsAsCurrency(activeTotal)}
              </Typography>
            </TableCell>
          </TableRow>

          {removedItems.length > 0 && showRemoved && (
            <TableRow>
              <TableCell colSpan={3}>
                <Typography variant="caption" color="text.secondary">
                  Removed services (not charged):
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through' }}
                >
                  {formatCentsAsCurrency(removedTotal)}
                </Typography>
              </TableCell>
            </TableRow>
          )}

          <TableRow>
            <TableCell colSpan={3}>
              <Typography variant="h6">Total:</Typography>
            </TableCell>
            <TableCell align="right">
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCentsAsCurrency(activeTotal)}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
