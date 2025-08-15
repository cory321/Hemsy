'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  Stack,
  Typography,
  Button,
  Grid,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Select,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useOrderFlow, ServiceLine } from '@/contexts/OrderFlowContext';
import {
  formatCurrency,
  dollarsToCents,
  parseFloatFromCurrency,
} from '@/lib/utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import {
  getFrequentlyUsedServices,
  searchServices,
  addService,
} from '@/lib/actions/services';

interface ServiceSelectorProps {
  garmentId: string;
}

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

export default function ServiceSelector({ garmentId }: ServiceSelectorProps) {
  const {
    orderDraft,
    addServiceToGarment,
    updateServiceInGarment,
    removeServiceFromGarment,
  } = useOrderFlow();
  const [frequentServices, setFrequentServices] = useState<ServiceOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceOption[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('0.00');
  const [quickAddUnit, setQuickAddUnit] = useState<
    'item' | 'hour' | 'day' | 'week'
  >('item');
  const [quickAddToCatalog, setQuickAddToCatalog] = useState(true);

  // Load frequently used services on mount
  useEffect(() => {
    const loadFrequentServices = async () => {
      try {
        const services = await getFrequentlyUsedServices();
        setFrequentServices(services);
      } catch (error) {
        console.error('Failed to load frequent services:', error);
      }
    };
    loadFrequentServices();
  }, []);

  // Search services
  useEffect(() => {
    const searchDebounced = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const results = await searchServices(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search services:', error);
      }
    };

    const timer = setTimeout(searchDebounced, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const garment = orderDraft.garments.find((g) => g.id === garmentId);
  if (!garment) return null;

  const handleAddService = (service: ServiceOption) => {
    const newService: ServiceLine = {
      serviceId: service.id,
      name: service.name,
      quantity: service.default_qty,
      unit: service.default_unit as ServiceLine['unit'],
      unitPriceCents: service.default_unit_price_cents,
    };
    addServiceToGarment(garmentId, newService);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) {
      toast.error('Please enter a service name');
      return;
    }

    const priceCents = dollarsToCents(parseFloatFromCurrency(quickAddPrice));

    if (quickAddToCatalog) {
      try {
        const created = await addService({
          name: quickAddName,
          default_qty: 1,
          default_unit: quickAddUnit,
          default_unit_price_cents: priceCents,
        });
        const newService: ServiceLine = {
          serviceId: created.id,
          name: quickAddName,
          quantity: 1,
          unit: quickAddUnit,
          unitPriceCents: priceCents,
        };
        addServiceToGarment(garmentId, newService);
        toast.success('Service added to catalog');
      } catch (error) {
        console.error('Failed to add service:', error);
        toast.error('Failed to add service');
      }
    } else {
      // Add as inline service
      const newService: ServiceLine = {
        name: quickAddName,
        quantity: 1,
        unit: quickAddUnit,
        unitPriceCents: priceCents,
        inline: {
          name: quickAddName,
        },
      };
      addServiceToGarment(garmentId, newService);
    }

    // Reset quick add form
    setQuickAddName('');
    setQuickAddPrice('0.00');
    setQuickAddUnit('item');
    setShowQuickAdd(false);
  };

  return (
    <Box>
      {/* Frequently Used Services */}
      {frequentServices.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Frequently Used Services
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {frequentServices.map((service) => (
              <Chip
                key={service.id}
                label={service.name}
                onClick={() => handleAddService(service)}
                clickable
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Search Services */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {searchResults.length > 0 && (
          <Paper sx={{ mt: 1, p: 1, maxHeight: 200, overflow: 'auto' }}>
            {searchResults.map((service) => (
              <Box
                key={service.id}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => handleAddService(service)}
              >
                <Typography variant="body2">{service.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(service.default_unit_price_cents / 100)} per{' '}
                  {service.default_unit}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>

      {/* Quick Add */}
      {!showQuickAdd ? (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowQuickAdd(true)}
          fullWidth
          sx={{ mb: 3 }}
        >
          Quick Add Service
        </Button>
      ) : (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Quick Add Service
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Service Name"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Price"
                  value={quickAddPrice}
                  onChange={(e) => setQuickAddPrice(e.target.value)}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Select
                  fullWidth
                  size="small"
                  value={quickAddUnit}
                  onChange={(e) => setQuickAddUnit(e.target.value as any)}
                >
                  <MenuItem value="item">per item</MenuItem>
                  <MenuItem value="hour">per hour</MenuItem>
                  <MenuItem value="day">per day</MenuItem>
                  <MenuItem value="week">per week</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={quickAddToCatalog}
                      onChange={(e) => setQuickAddToCatalog(e.target.checked)}
                    />
                  }
                  label="Add to service catalog for future use"
                />
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowQuickAdd(false)}
                  fullWidth
                >
                  Cancel
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleQuickAdd}
                  fullWidth
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Service Lines */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Added Services
        </Typography>
        {garment.services.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No services added yet
          </Typography>
        ) : (
          <Stack spacing={1}>
            {garment.services.map((service, index) => (
              <Card key={index} variant="outlined">
                <CardContent sx={{ py: 1 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2">{service.name}</Typography>
                    </Grid>
                    <Grid item xs={4} sm={2}>
                      <TextField
                        size="small"
                        type="number"
                        label="Qty"
                        value={service.quantity}
                        onChange={(e) =>
                          updateServiceInGarment(garmentId, index, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            ),
                          })
                        }
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={4} sm={2}>
                      <Select
                        size="small"
                        value={service.unit}
                        onChange={(e) =>
                          updateServiceInGarment(garmentId, index, {
                            unit: e.target.value as any,
                          })
                        }
                        fullWidth
                      >
                        <MenuItem value="item">item</MenuItem>
                        <MenuItem value="hour">hour</MenuItem>
                        <MenuItem value="day">day</MenuItem>
                        <MenuItem value="week">week</MenuItem>
                      </Select>
                    </Grid>
                    <Grid item xs={4} sm={3}>
                      <TextField
                        size="small"
                        label="Price"
                        value={(service.unitPriceCents / 100).toFixed(2)}
                        onChange={(e) => {
                          const cents = dollarsToCents(
                            parseFloat(e.target.value) || 0
                          );
                          updateServiceInGarment(garmentId, index, {
                            unitPriceCents: cents,
                          });
                        }}
                        InputProps={{
                          startAdornment: '$',
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        color="error"
                        onClick={() =>
                          removeServiceFromGarment(garmentId, index)
                        }
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
