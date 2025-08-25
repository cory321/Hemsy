'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Typography,
  Checkbox,
  Button,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

import { useOrderFlow, GarmentDraft } from '@/contexts/OrderFlowContext';
import { formatCurrency } from '@/lib/utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { GarmentDetailForm } from '@/components/orders/desktop/GarmentDetailForm';
import { format as formatDate } from 'date-fns';

export const MultiGarmentManager = () => {
  const { orderDraft, addGarment, updateGarment, removeGarment } =
    useOrderFlow();

  const [selectedGarments, setSelectedGarments] = useState<Set<string>>(
    new Set()
  );
  const [activeGarmentId, setActiveGarmentId] = useState<string | null>(
    orderDraft.garments[0]?.id || null
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const activeGarment = orderDraft.garments.find(
    (g) => g.id === activeGarmentId
  );

  const calculateGarmentTotal = (garment: GarmentDraft) => {
    return garment.services.reduce(
      (sum, service) => sum + service.quantity * service.unitPriceCents,
      0
    );
  };

  const handleAddGarment = () => {
    const newGarment: GarmentDraft = {
      id: uuidv4(),
      name: '',
      isNameUserEdited: false,
      notes: '',
      dueDate: formatDate(new Date(), 'yyyy-MM-dd'),
      specialEvent: false,
      services: [],
    };
    addGarment(newGarment);
    setActiveGarmentId(newGarment.id);
  };

  const handleGarmentSelect = (garmentId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      const newSelected = new Set(selectedGarments);
      if (newSelected.has(garmentId)) {
        newSelected.delete(garmentId);
      } else {
        newSelected.add(garmentId);
      }
      setSelectedGarments(newSelected);
    } else if (event.shiftKey && selectedGarments.size > 0) {
      // Range select with Shift
      // Implementation would go here
    } else {
      // Single select
      setSelectedGarments(new Set());
      setActiveGarmentId(garmentId);
    }
  };

  const handleBulkDelete = () => {
    selectedGarments.forEach((id) => removeGarment(id));
    setSelectedGarments(new Set());
    setAnchorEl(null);
  };

  const handleDuplicateGarment = () => {
    if (!activeGarment) return;

    const duplicate: GarmentDraft = {
      ...activeGarment,
      id: uuidv4(),
      name: `${activeGarment.name} (Copy)`,
    };
    addGarment(duplicate);
    setActiveGarmentId(duplicate.id);
  };

  return (
    <Box display="flex" gap={3} height="100%">
      {/* Garment List */}
      <Paper sx={{ width: 320, display: 'flex', flexDirection: 'column' }}>
        <Box p={2} borderBottom={1} borderColor="divider">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              Garments ({orderDraft.garments.length})
            </Typography>
            <Box>
              {selectedGarments.size > 0 && (
                <Tooltip title="Bulk Actions">
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Add Garment (Ctrl+G)">
                <IconButton onClick={handleAddGarment} color="primary">
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {selectedGarments.size > 0 && (
            <Typography variant="caption" color="text.secondary">
              {selectedGarments.size} selected
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List dense>
            {orderDraft.garments.map((garment, index) => (
              <ListItem key={garment.id} sx={{ p: 0, mb: 0.5, mx: 1 }}>
                <ListItemButton
                  selected={activeGarmentId === garment.id}
                  onClick={(e) => handleGarmentSelect(garment.id, e)}
                  sx={{
                    borderRadius: 1,
                    bgcolor: selectedGarments.has(garment.id)
                      ? 'action.selected'
                      : undefined,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  {selectedGarments.size > 0 && (
                    <Checkbox
                      checked={selectedGarments.has(garment.id)}
                      onClick={(e) => e.stopPropagation()}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                  )}
                  <ListItemText
                    primary={garment.name || `Garment ${index + 1}`}
                    secondary={
                      <Box display="flex" gap={0.5} alignItems="center">
                        {garment.services.length > 0 && (
                          <Chip
                            label={`${garment.services.length}`}
                            size="small"
                            sx={{ height: 16, fontSize: '0.7rem' }}
                          />
                        )}
                        <Typography variant="caption">
                          {formatCurrency(calculateGarmentTotal(garment) / 100)}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{
                      component: 'div',
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Bulk Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={handleBulkDelete}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Selected</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>

      {/* Detail Panel */}
      <Paper sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {activeGarment ? (
          <GarmentDetailForm
            garment={activeGarment}
            onUpdate={(updates: Partial<GarmentDraft>) =>
              updateGarment(activeGarment.id, updates)
            }
            onDuplicate={handleDuplicateGarment}
            onDelete={() => {
              removeGarment(activeGarment.id);
              setActiveGarmentId(orderDraft.garments[0]?.id || null);
            }}
          />
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            color="text.secondary"
          >
            <Box textAlign="center">
              <Typography variant="h6" gutterBottom>
                No garment selected
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddGarment}
              >
                Add First Garment
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
