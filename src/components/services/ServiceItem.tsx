'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DuplicateIcon from '@mui/icons-material/FileCopy';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import EditServiceDialog from '@/components/services/EditServiceDialog';
import {
  Service,
  ServiceFormData,
  calculateTotalPrice,
} from '@/lib/utils/serviceUtils';
import { pluralizeUnit } from '@/lib/utils/unitUtils';

interface ServiceItemProps {
  service: Service;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, updatedService: ServiceFormData) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onDelete,
  onEdit,
  onDuplicate,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    // Prevent card click from triggering when opening the menu
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (service.id) {
      await onDelete(service.id);
    }
  };

  const handleDuplicate = async () => {
    handleMenuClose();
    if (service.id) {
      await onDuplicate(service.id);
    }
  };

  const handleSave = async (updatedService: ServiceFormData) => {
    if (service.id) {
      await onEdit(service.id, updatedService);
    }
    setIsEditing(false);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          width: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.1s',
          opacity: isLoading ? 0.6 : 1,
          '&:hover': {
            boxShadow: 3,
          },
        }}
        onClick={(event) => {
          // If the kebab menu is open, ignore card clicks so dismissing the menu
          // doesn't also open the edit dialog.
          if (open) {
            event.stopPropagation();
            return;
          }
          setIsEditing(true);
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6">{service.name}</Typography>
                {service.frequently_used && (
                  <Chip
                    icon={<StarIcon />}
                    label="Frequently Used"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              {service.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {service.description}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Default: {service.default_qty}{' '}
                {pluralizeUnit(service.default_unit, service.default_qty)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 2 }}>
              <Typography variant="h6" align="right">
                {calculateTotalPrice(service)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 1 }}>
              <Box display="flex" justifyContent="flex-end">
                <IconButton onClick={handleMenuClick} disabled={isLoading}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Edit service" />
                  </MenuItem>
                  <MenuItem onClick={handleDuplicate}>
                    <ListItemIcon>
                      <DuplicateIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Duplicate" />
                  </MenuItem>
                  <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Delete" />
                  </MenuItem>
                </Menu>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {isEditing && (
        <EditServiceDialog
          service={service}
          open={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default ServiceItem;
