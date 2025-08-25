'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  CircularProgress,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import InfoIcon from '@mui/icons-material/Info';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

import WarningIcon from '@mui/icons-material/Warning';
import { searchServices } from '@/lib/actions/services';
import { useGarment } from '@/contexts/GarmentContext';
import { SERVICE_UNIT_TYPES } from '@/lib/utils/serviceUnitTypes';
import { parseFloatFromCurrency } from '@/lib/utils/currency';
import ServicePriceInput from '@/components/common/ServicePriceInput';

interface Service {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  line_total_cents: number;
  description?: string | null;
  is_done?: boolean;
  // Payment tracking fields
  paid_amount_cents?: number;
  refunded_amount_cents?: number;
  payment_status?:
    | 'unpaid'
    | 'partial'
    | 'paid'
    | 'partial_refund'
    | 'refunded';

  refund_notes?: string;
  // Soft delete fields
  is_removed?: boolean;
  removed_at?: string | null;
  removed_by?: string | null;
  removal_reason?: string | null;
  is_locked?: boolean;
}

export default function GarmentServicesManagerOptimistic() {
  const {
    garment,
    addService,
    removeService,
    updateService,
    toggleServiceComplete,
    restoreService,
  } = useGarment();
  const isGarmentDone = garment?.stage === 'Done';
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPrice, setEditPrice] = useState('0.00');
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    serviceId: string | null;
    serviceName: string | null;
  }>({ open: false, serviceId: null, serviceName: null });

  const [newService, setNewService] = useState({
    isCustom: false,
    serviceId: '',
    name: '',
    unit: 'flat_rate' as 'flat_rate' | 'hour' | 'day',
    price: '0.00',
    quantity: 1,
    description: '',
    addToCatalog: false,
    markAsFrequentlyUsed: false,
  });
  const [isForceEdit, setIsForceEdit] = useState(false);

  const handleSearchServices = async (query: string) => {
    if (query.length < 2) return;
    setSearchLoading(true);
    try {
      const results = await searchServices(query);
      setCatalogServices(results);
    } catch (err) {
      console.error('Error searching services:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddService = async () => {
    setLoading(true);

    // Close dialog immediately for better UX
    setShowAddDialog(false);

    const unitPriceCents = Math.round(
      parseFloatFromCurrency(newService.price) * 100
    );

    const input = newService.isCustom
      ? {
          customService: {
            name: newService.name,
            description: newService.description || undefined,
            unit: newService.unit,
            unitPriceCents: unitPriceCents,
            quantity: newService.quantity,
          },
        }
      : {
          serviceId: newService.serviceId,
          customService: {
            name: newService.name,
            description: newService.description || undefined,
            unit: newService.unit,
            unitPriceCents: unitPriceCents,
            quantity: newService.quantity,
          },
        };

    // Optimistic update happens inside addService
    await addService(input);

    // Reset form
    setNewService({
      isCustom: false,
      serviceId: '',
      name: '',
      unit: 'flat_rate' as 'flat_rate' | 'hour' | 'day',
      price: '0.00',
      quantity: 1,
      description: '',
      addToCatalog: false,
      markAsFrequentlyUsed: false,
    });

    setLoading(false);
  };

  const handleRemoveService = async () => {
    if (!deleteConfirmation.serviceId) return;

    setLoading(true);

    // Close dialog immediately
    setDeleteConfirmation({ open: false, serviceId: null, serviceName: null });

    // Optimistic update happens inside removeService
    await removeService(deleteConfirmation.serviceId);

    setLoading(false);
  };

  const openDeleteConfirmation = (service: Service) => {
    setDeleteConfirmation({
      open: true,
      serviceId: service.id,
      serviceName: service.name,
    });
  };

  const handlePaidOrderServiceEdit = (service: Service) => {
    // Show confirmation dialog for services on paid orders
    if (
      window.confirm(
        `This order has paid invoices. Modifying services may require creating an adjustment invoice.\n\n` +
          `Do you want to proceed with editing?`
      )
    ) {
      setEditingService(service);
      setEditPrice((service.unit_price_cents / 100).toFixed(2));
      // Set a flag to indicate this is a forced edit
      setIsForceEdit(true);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setLoading(true);

    // Close dialog immediately for better UX
    setEditingService(null);

    // Optimistic update happens inside updateService
    await updateService(editingService.id, {
      quantity: editingService.quantity,
      unit_price_cents: editingService.unit_price_cents,
      unit: editingService.unit,
      description: editingService.description || null,
    });

    setLoading(false);
  };

  const handleLockedServiceEdit = (service: Service) => {
    if (
      window.confirm(
        `This service is locked. Do you want to override the lock and edit it?`
      )
    ) {
      setEditingService(service);
      setEditPrice((service.unit_price_cents / 100).toFixed(2));
      setIsForceEdit(true);
    }
  };

  const garmentServices = garment?.garment_services || [];

  // Filter out soft-deleted services for both total and progress calculations
  const activeServices = garmentServices.filter((s: Service) => !s.is_removed);

  const totalPrice = activeServices.reduce(
    (sum: number, service: Service) => sum + service.line_total_cents,
    0
  );
  const completedCount = activeServices.filter(
    (s: Service) => s.is_done
  ).length;
  const totalCount = activeServices.length;
  const completionPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Services</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={() => setShowAddDialog(true)}
            disabled={isGarmentDone}
          >
            Add Service
          </Button>
        </Box>

        {/* Progress Indicator */}
        {totalCount > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {completedCount} of {totalCount} completed
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completionPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {garmentServices.length > 0 ? (
          <>
            <List>
              {garmentServices.map((service: Service, index: number) => {
                const isRemoved = !!service.is_removed;
                return (
                  <ListItem
                    key={service.id}
                    divider={index < garmentServices.length - 1}
                    sx={{
                      opacity: isRemoved || service.is_done ? 0.6 : 1,
                      backgroundColor:
                        service.payment_status === 'refunded'
                          ? 'error.50'
                          : 'transparent',
                      position: 'relative',
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        backgroundColor:
                          service.payment_status === 'refunded'
                            ? 'error.100'
                            : 'action.hover',
                      },
                    }}
                    secondaryAction={
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {isRemoved ? (
                          <>
                            {service.removal_reason && (
                              <Tooltip
                                title={`Removed: ${service.removal_reason}`}
                              >
                                <InfoIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => restoreService(service.id)}
                              disabled={loading}
                              aria-label="Restore service"
                            >
                              <RestoreFromTrashIcon fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            {/* Complete/Incomplete button - disabled if refunded */}
                            {!service.payment_status?.includes('refund') && (
                              <>
                                {service.is_done && (
                                  <Chip
                                    label="Completed"
                                    size="small"
                                    color="success"
                                    sx={{ mr: 1 }}
                                  />
                                )}
                                <Button
                                  size="small"
                                  variant={
                                    service.is_done ? 'outlined' : 'contained'
                                  }
                                  onClick={() =>
                                    toggleServiceComplete(
                                      service.id,
                                      !service.is_done
                                    )
                                  }
                                  disabled={loading || isGarmentDone}
                                  startIcon={
                                    service.is_done ? (
                                      <CheckCircleIcon />
                                    ) : (
                                      <RadioButtonUncheckedIcon />
                                    )
                                  }
                                  sx={{ minWidth: '140px' }}
                                >
                                  {service.is_done
                                    ? 'Mark Incomplete'
                                    : 'Mark Complete'}
                                </Button>
                              </>
                            )}

                            {/* Edit button - show warning if locked or completed */}
                            {!isRemoved &&
                            !service.is_locked &&
                            !service.is_done ? (
                              <IconButton
                                onClick={() => {
                                  setEditingService(service);
                                  setEditPrice(
                                    (service.unit_price_cents / 100).toFixed(2)
                                  );
                                }}
                                disabled={loading || isGarmentDone}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              !isRemoved &&
                              (service.is_locked || service.is_done) && (
                                <Tooltip
                                  title={
                                    service.is_done
                                      ? 'Cannot edit completed services'
                                      : 'Service is locked. Override required to edit.'
                                  }
                                >
                                  <span>
                                    <IconButton
                                      {...(service.is_done
                                        ? {}
                                        : {
                                            onClick: () =>
                                              handleLockedServiceEdit(service),
                                          })}
                                      disabled={
                                        loading ||
                                        isGarmentDone ||
                                        !!service.is_done
                                      }
                                      size="small"
                                      color={
                                        service.is_done ? 'default' : 'warning'
                                      }
                                    >
                                      {service.is_done ? (
                                        <EditIcon fontSize="small" />
                                      ) : (
                                        <LockOpenIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            )}

                            {/* Delete button - show warning if locked or completed */}
                            {!isRemoved &&
                            !service.is_locked &&
                            !service.is_done ? (
                              <IconButton
                                onClick={() => openDeleteConfirmation(service)}
                                disabled={loading || isGarmentDone}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              !isRemoved &&
                              (service.is_locked || service.is_done) && (
                                <Tooltip
                                  title={
                                    service.is_done
                                      ? 'Cannot delete completed services'
                                      : 'Cannot delete paid services'
                                  }
                                >
                                  <span>
                                    <IconButton disabled size="small">
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            )}
                          </>
                        )}
                      </Box>
                    }
                  >
                    {/* Lock indicator */}

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                        pl: 0,
                      }}
                    >
                      {service.is_done &&
                        !isRemoved &&
                        !service.payment_status?.includes('refund') && (
                          <CheckCircleIcon color="success" />
                        )}

                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                textDecoration: isRemoved
                                  ? 'line-through'
                                  : 'none',
                                color: isRemoved
                                  ? 'text.secondary'
                                  : 'text.primary',
                              }}
                            >
                              {service.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            {/* Price and quantity info */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              component="span"
                              sx={{
                                textDecoration: isRemoved
                                  ? 'line-through'
                                  : 'none',
                                color: isRemoved
                                  ? 'text.secondary'
                                  : 'text.secondary',
                              }}
                            >
                              {service.unit === 'flat_rate'
                                ? `$${(service.unit_price_cents / 100).toFixed(2)} flat rate`
                                : `${service.quantity || 1} ${service.unit || 'service'}${(service.quantity || 1) > 1 ? 's' : ''} @ $${(service.unit_price_cents / 100).toFixed(2)}/${service.unit || 'service'}`}
                              {service.description &&
                                ` • ${service.description}`}
                            </Typography>

                            {/* Refund notes if any */}
                            {service.refund_notes && (
                              <Typography
                                variant="caption"
                                color="error"
                                component="span"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                Refund reason: {service.refund_notes}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </Box>
                  </ListItem>
                );
              })}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6">
                Total: ${(totalPrice / 100).toFixed(2)}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography
            color="text.secondary"
            sx={{ textAlign: 'center', py: 4 }}
          >
            {isGarmentDone
              ? 'Service management is disabled for completed garments.'
              : 'No services added yet'}
          </Typography>
        )}
      </CardContent>

      {/* Add Service Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Service</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={newService.isCustom ? 'outlined' : 'contained'}
                onClick={() =>
                  setNewService({ ...newService, isCustom: false })
                }
                size="small"
              >
                From Catalog
              </Button>
              <Button
                variant={newService.isCustom ? 'contained' : 'outlined'}
                onClick={() => setNewService({ ...newService, isCustom: true })}
                size="small"
              >
                Custom Service
              </Button>
            </Box>

            {newService.isCustom ? (
              <>
                <TextField
                  label="Service Name"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService({ ...newService, name: e.target.value })
                  }
                  fullWidth
                  required
                />
                <TextField
                  label="Description"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      description: e.target.value,
                    })
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
                <ServicePriceInput
                  price={newService.price}
                  unit={newService.unit}
                  quantity={newService.quantity}
                  onPriceChange={(price) =>
                    setNewService({ ...newService, price })
                  }
                  onUnitChange={(unit) =>
                    setNewService({
                      ...newService,
                      unit,
                      // Reset quantity to 1 when switching to flat_rate
                      quantity: unit === 'flat_rate' ? 1 : newService.quantity,
                    })
                  }
                  onQuantityChange={(quantity) =>
                    setNewService({ ...newService, quantity })
                  }
                  showTotal={true}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newService.addToCatalog}
                      onChange={(e) => {
                        setNewService({
                          ...newService,
                          addToCatalog: e.target.checked,
                          // Reset frequently used if not adding to catalog
                          markAsFrequentlyUsed: e.target.checked
                            ? newService.markAsFrequentlyUsed
                            : false,
                        });
                      }}
                    />
                  }
                  label="Add to service catalog for future use"
                />
                {newService.addToCatalog && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newService.markAsFrequentlyUsed}
                        onChange={(e) =>
                          setNewService({
                            ...newService,
                            markAsFrequentlyUsed: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Mark as frequently used service"
                    sx={{ ml: 3 }}
                  />
                )}
              </>
            ) : (
              <Autocomplete
                options={catalogServices}
                getOptionLabel={(option) =>
                  `${option.name} - $${(
                    option.default_unit_price_cents / 100
                  ).toFixed(2)}/${option.default_unit}`
                }
                loading={searchLoading}
                onInputChange={(_, value) => handleSearchServices(value)}
                onChange={(_, value) => {
                  if (value) {
                    setNewService({
                      ...newService,
                      serviceId: value.id,
                      name: value.name,
                      unit: value.default_unit as 'flat_rate' | 'hour' | 'day',
                      price: (
                        (value.default_unit_price_cents || 0) / 100
                      ).toFixed(2),
                      description: value.description || '',
                    });
                  }
                }}
                renderInput={(params) => {
                  const { InputProps, inputProps, id, ...rest } = params as any;
                  return (
                    <TextField
                      {...rest}
                      label="Search Services"
                      placeholder="Start typing to search..."
                      InputProps={{
                        ...InputProps,
                        endAdornment: (
                          <>
                            {searchLoading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {InputProps.endAdornment}
                          </>
                        ),
                      }}
                      inputProps={inputProps}
                      id={id}
                    />
                  );
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddService}
            variant="contained"
            disabled={
              loading ||
              (newService.isCustom ? !newService.name : !newService.serviceId)
            }
          >
            Add Service
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog
        open={!!editingService}
        onClose={() => setEditingService(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Service</DialogTitle>
        {editingService && (
          <DialogContent>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
            >
              <Typography variant="h6">{editingService.name}</Typography>
              <TextField
                label="Description"
                value={editingService.description || ''}
                onChange={(e) =>
                  setEditingService({
                    ...editingService,
                    description: e.target.value,
                  })
                }
                fullWidth
                multiline
                rows={2}
              />
              <ServicePriceInput
                price={editPrice}
                unit={editingService.unit as 'flat_rate' | 'hour' | 'day'}
                quantity={editingService.quantity}
                onPriceChange={(price) => {
                  setEditPrice(price);
                  const cents = Math.round(parseFloat(price || '0') * 100);
                  setEditingService({
                    ...editingService,
                    unit_price_cents: cents,
                    line_total_cents: editingService.quantity * cents,
                  });
                }}
                onUnitChange={(unit) =>
                  setEditingService({
                    ...editingService,
                    unit,
                    // Reset quantity to 1 when switching to flat_rate
                    quantity:
                      unit === 'flat_rate' ? 1 : editingService.quantity,
                  })
                }
                onQuantityChange={(quantity) =>
                  setEditingService({
                    ...editingService,
                    quantity,
                    line_total_cents:
                      quantity * editingService.unit_price_cents,
                  })
                }
                showTotal={true}
              />
            </Box>
          </DialogContent>
        )}
        <DialogActions>
          <Button
            onClick={() => {
              setEditingService(null);
              setEditPrice('0.00');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateService}
            variant="contained"
            disabled={loading}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={() =>
          setDeleteConfirmation({
            open: false,
            serviceId: null,
            serviceName: null,
          })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Service</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove &quot;
            {deleteConfirmation.serviceName}&quot; from this garment?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteConfirmation({
                open: false,
                serviceId: null,
                serviceName: null,
              })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemoveService}
            variant="contained"
            color="error"
            disabled={loading}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
