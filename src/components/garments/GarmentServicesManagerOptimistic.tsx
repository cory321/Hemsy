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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
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
}

export default function GarmentServicesManagerOptimistic() {
  const {
    garment,
    addService,
    removeService,
    updateService,
    toggleServiceComplete,
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
    unit: 'item' as 'item' | 'hour' | 'day',
    price: '0.00',
    description: '',
    addToCatalog: false,
    markAsFrequentlyUsed: false,
  });

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
            quantity: 1,
          },
        }
      : {
          serviceId: newService.serviceId,
          customService: {
            name: newService.name,
            description: newService.description || undefined,
            unit: newService.unit,
            unitPriceCents: unitPriceCents,
            quantity: 1,
          },
        };

    // Optimistic update happens inside addService
    await addService(input);

    // Reset form
    setNewService({
      isCustom: false,
      serviceId: '',
      name: '',
      unit: 'item' as 'item' | 'hour' | 'day',
      price: '0.00',
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

  const handleUpdateService = async () => {
    if (!editingService) return;

    setLoading(true);

    // Close dialog immediately for better UX
    setEditingService(null);

    // Optimistic update happens inside updateService
    await updateService(editingService.id, {
      quantity: 1, // Always set quantity to 1 for garment services
      unit_price_cents: editingService.unit_price_cents,
      unit: editingService.unit,
      description: editingService.description || null,
    });

    setLoading(false);
  };

  const garmentServices = garment?.garment_services || [];

  const totalPrice = garmentServices.reduce(
    (sum: number, service: Service) => sum + service.line_total_cents,
    0
  );

  const completedCount = garmentServices.filter(
    (s: Service) => s.is_done
  ).length;
  const totalCount = garmentServices.length;
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
              {garmentServices.map((service: Service, index: number) => (
                <ListItem
                  key={service.id}
                  divider={index < garmentServices.length - 1}
                  sx={{
                    opacity: service.is_done ? 0.6 : 1,
                    transition: 'opacity 0.3s ease',
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                        variant={service.is_done ? 'outlined' : 'contained'}
                        onClick={() =>
                          toggleServiceComplete(service.id, !service.is_done)
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
                        {service.is_done ? 'Mark Incomplete' : 'Mark Complete'}
                      </Button>
                      <IconButton
                        edge="end"
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
                      <IconButton
                        edge="end"
                        onClick={() => openDeleteConfirmation(service)}
                        disabled={loading || isGarmentDone}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {service.is_done && <CheckCircleIcon color="success" />}
                    <ListItemText
                      primary={service.name}
                      secondary={
                        <>
                          {service.quantity} {service.unit} × $
                          {(service.unit_price_cents / 100).toFixed(2)} = $
                          {(service.line_total_cents / 100).toFixed(2)}
                          {service.description && (
                            <Box
                              component="span"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {service.description}
                            </Box>
                          )}
                        </>
                      }
                    />
                  </Box>
                </ListItem>
              ))}
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
                  onPriceChange={(price) =>
                    setNewService({ ...newService, price })
                  }
                  onUnitChange={(unit) =>
                    setNewService({ ...newService, unit })
                  }
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
                      unit: value.default_unit as 'item' | 'hour' | 'day',
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
                unit={editingService.unit as 'item' | 'hour' | 'day'}
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
                  })
                }
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
