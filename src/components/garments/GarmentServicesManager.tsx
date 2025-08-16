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
  Alert,
  Divider,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import {
  addServiceToGarment,
  removeServiceFromGarment,
  updateGarmentService,
} from '@/lib/actions/garments';
import { searchServices } from '@/lib/actions/services';
import { useRouter } from 'next/navigation';
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
}

interface GarmentServicesManagerProps {
  garmentId: string;
  services: Service[];
  onServiceChange?: () => void;
}

export default function GarmentServicesManager({
  garmentId,
  services,
  onServiceChange,
}: GarmentServicesManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editPrice, setEditPrice] = useState('0.00');
  const [catalogServices, setCatalogServices] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [newService, setNewService] = useState({
    isCustom: false,
    serviceId: '',
    name: '',
    unit: 'item' as 'item' | 'hour' | 'day',
    price: '0.00',
    description: '',
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
    setError(null);

    try {
      const unitPriceCents = Math.round(
        parseFloatFromCurrency(newService.price) * 100
      );

      const input = newService.isCustom
        ? {
            garmentId,
            customService: {
              name: newService.name,
              description: newService.description || undefined,
              unit: newService.unit,
              unitPriceCents: unitPriceCents,
              quantity: 1,
            },
          }
        : {
            garmentId,
            serviceId: newService.serviceId,
          };

      const result = await addServiceToGarment(input);

      if (result.success) {
        setShowAddDialog(false);
        setNewService({
          isCustom: false,
          serviceId: '',
          name: '',
          unit: 'item' as 'item' | 'hour' | 'day',
          price: '0.00',
          description: '',
        });
        router.refresh();
        onServiceChange?.();
      } else {
        setError(result.error || 'Failed to add service');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to remove this service?')) return;

    setLoading(true);
    setError(null);

    try {
      const result = await removeServiceFromGarment({
        garmentId,
        garmentServiceId: serviceId,
      });

      if (result.success) {
        router.refresh();
        onServiceChange?.();
      } else {
        setError(result.error || 'Failed to remove service');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setLoading(true);
    setError(null);

    try {
      const result = await updateGarmentService({
        garmentServiceId: editingService.id,
        updates: {
          quantity: 1, // Always set quantity to 1 for garment services
          unitPriceCents: editingService.unit_price_cents,
          unit: editingService.unit as 'item' | 'hour' | 'day',
          description: editingService.description || undefined,
        },
      });

      if (result.success) {
        setEditingService(null);
        router.refresh();
        onServiceChange?.();
      } else {
        setError(result.error || 'Failed to update service');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = services.reduce(
    (sum, service) => sum + service.line_total_cents,
    0
  );

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
          >
            Add Service
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {services.length > 0 ? (
          <>
            <List>
              {services.map((service, index) => (
                <ListItem
                  key={service.id}
                  divider={index < services.length - 1}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setEditingService(service);
                          setEditPrice(
                            (service.unit_price_cents / 100).toFixed(2)
                          );
                        }}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveService(service.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={service.name}
                    secondary={
                      <>
                        {service.quantity} {service.unit}
                        {service.quantity > 1 ? 's' : ''} @ $
                        {(service.unit_price_cents / 100).toFixed(2)}/
                        {service.unit}
                        {service.description && ` • ${service.description}`}
                      </>
                    }
                  />
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    ${(service.line_total_cents / 100).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ textAlign: 'right' }}>
              Total: ${(totalPrice / 100).toFixed(2)}
            </Typography>
          </>
        ) : (
          <Typography color="text.secondary">No services added</Typography>
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={!newService.isCustom ? 'contained' : 'outlined'}
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
                <TextField
                  label="Description (optional)"
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
              </>
            ) : (
              <Autocomplete
                options={catalogServices}
                getOptionLabel={(option) => option.name}
                loading={searchLoading}
                onInputChange={(_, value) => handleSearchServices(value)}
                onChange={(_, value) => {
                  if (value) {
                    setNewService({ ...newService, serviceId: value.id });
                  }
                }}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Search Services"
                    placeholder="Start typing to search..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {searchLoading ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
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
            {loading ? <CircularProgress size={20} /> : 'Add'}
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
        <DialogContent>
          {editingService && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
            >
              <Typography variant="h6">{editingService.name}</Typography>
              <ServicePriceInput
                price={editPrice}
                unit={editingService.unit as 'item' | 'hour' | 'day'}
                onPriceChange={(price) => {
                  setEditPrice(price);
                  const cents = Math.round(parseFloat(price || '0') * 100);
                  setEditingService({
                    ...editingService,
                    unit_price_cents: cents,
                  });
                }}
                onUnitChange={(unit) =>
                  setEditingService({
                    ...editingService,
                    unit,
                  })
                }
              />
              <TextField
                label="Description (optional)"
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
            </Box>
          )}
        </DialogContent>
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
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
