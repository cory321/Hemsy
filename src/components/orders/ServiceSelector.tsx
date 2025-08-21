'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Chip,
  Stack,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Select,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useOrderFlow, ServiceLine } from '@/contexts/OrderFlowContext';
import {
  formatCurrency,
  dollarsToCents,
  parseFloatFromCurrency,
  formatAsCurrency,
} from '@/lib/utils/currency';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';
import {
  getFrequentlyUsedServices,
  searchServices,
  addService,
} from '@/lib/actions/services';
import { useDebounce } from '@/hooks/useDebounce';
import ServicePriceInput from '@/components/common/ServicePriceInput';

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
  const [searchLoading, setSearchLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('0.00');
  const [quickAddPriceFocused, setQuickAddPriceFocused] = useState(false);
  const [quickAddUnit, setQuickAddUnit] = useState<
    'flat_rate' | 'hour' | 'day'
  >('flat_rate');
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [quickAddToCatalog, setQuickAddToCatalog] = useState(true);
  const [quickAddFrequentlyUsed, setQuickAddFrequentlyUsed] = useState(false);

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
    let isActive = true;
    const searchDebounced = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      try {
        const results = await searchServices(searchQuery);
        if (isActive) {
          setSearchResults(results);
        }
      } catch (error) {
        if (isActive) {
          console.error('Failed to search services:', error);
          setSearchResults([]);
        }
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    };

    const timer = setTimeout(searchDebounced, 300);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
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
          default_qty: quickAddQuantity,
          default_unit: quickAddUnit,
          default_unit_price_cents: priceCents,
          frequently_used: quickAddFrequentlyUsed,
        });
        const newService: ServiceLine = {
          serviceId: created.id,
          name: quickAddName,
          quantity: quickAddQuantity,
          unit: quickAddUnit,
          unitPriceCents: priceCents,
        };
        addServiceToGarment(garmentId, newService);
        toast.success('Service added to catalog');

        // Reload frequently used services if the new service is marked as frequently used
        if (quickAddFrequentlyUsed) {
          try {
            const services = await getFrequentlyUsedServices();
            setFrequentServices(services);
          } catch (error) {
            console.error('Failed to reload frequent services:', error);
          }
        }
      } catch (error) {
        console.error('Failed to add service:', error);
        toast.error('Failed to add service');
      }
    } else {
      // Add as inline service
      const newService: ServiceLine = {
        name: quickAddName,
        quantity: quickAddQuantity,
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
    setQuickAddPriceFocused(false);
    setQuickAddUnit('flat_rate');
    setQuickAddQuantity(1);
    setQuickAddFrequentlyUsed(false);
    setShowQuickAdd(false);
  };

  return (
    <Box>
      {/* Frequently Used Services */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          {frequentServices.length > 0
            ? 'Frequently Used Services'
            : 'Services'}
        </Typography>
        <Grid container spacing={1}>
          {frequentServices.map((service) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={service.id}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => handleAddService(service)}
                sx={{
                  p: 1.5,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  height: '100%',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(service.default_unit_price_cents / 100)} /{' '}
                    {service.default_unit}
                  </Typography>
                </Box>
              </Button>
            </Grid>
          ))}
          {/* Quick Add Service Button */}
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowQuickAdd(true)}
              sx={{
                p: 1.5,
                justifyContent: 'center',
                height: '100%',
                borderStyle: 'dashed',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <AddIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Quick Add Service
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Add custom service
                </Typography>
              </Box>
            </Button>
          </Grid>
        </Grid>
      </Box>

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
            endAdornment: (
              <>
                {searchLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
              </>
            ),
          }}
        />
        {(searchLoading || searchQuery.length > 0) && (
          <Paper sx={{ mt: 1, p: 1, maxHeight: 200, overflow: 'auto' }}>
            {searchQuery.length < 2 && !searchLoading ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                Type at least 2 characters to search
              </Typography>
            ) : searchLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  Searching...
                </Typography>
              </Box>
            ) : searchResults.length > 0 ? (
              searchResults.map((service) => (
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
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                No services found
              </Typography>
            )}
          </Paper>
        )}
      </Box>

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
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2">{service.name}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <TextField
                        size="small"
                        type="number"
                        label={
                          service.unit === 'hour'
                            ? 'Hours'
                            : service.unit === 'day'
                              ? 'Days'
                              : 'Qty'
                        }
                        value={service.quantity}
                        onChange={(e) =>
                          updateServiceInGarment(garmentId, index, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            ),
                          })
                        }
                        disabled={service.unit === 'flat_rate'}
                        placeholder={service.unit === 'flat_rate' ? 'N/A' : ''}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 4, sm: 2 }}>
                      <Select
                        size="small"
                        value={service.unit}
                        onChange={(e) => {
                          const newUnit = e.target.value as any;
                          updateServiceInGarment(garmentId, index, {
                            unit: newUnit,
                            // Reset quantity to 1 when switching to flat_rate
                            ...(newUnit === 'flat_rate' && { quantity: 1 }),
                          });
                        }}
                        fullWidth
                      >
                        <MenuItem value="flat_rate">flat rate</MenuItem>
                        <MenuItem value="hour">hour</MenuItem>
                        <MenuItem value="day">day</MenuItem>
                      </Select>
                    </Grid>
                    <Grid size={{ xs: 4, sm: 3 }}>
                      <ServicePriceField
                        key={`price-${garmentId}-${index}`}
                        unitPriceCents={service.unitPriceCents}
                        onPriceChange={(cents: number) => {
                          updateServiceInGarment(garmentId, index, {
                            unitPriceCents: cents,
                          });
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 1 }}>
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

      {/* Quick Add Dialog */}
      <Dialog
        open={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false);
          // Reset form state
          setQuickAddName('');
          setQuickAddPrice('0.00');
          setQuickAddPriceFocused(false);
          setQuickAddUnit('flat_rate');
          setQuickAddQuantity(1);
          setQuickAddFrequentlyUsed(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Quick Add Service
          <IconButton
            aria-label="close"
            onClick={() => setShowQuickAdd(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Service Name"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              autoFocus
            />
            <ServicePriceInput
              price={quickAddPrice}
              unit={quickAddUnit}
              quantity={quickAddQuantity}
              onPriceChange={(price) => setQuickAddPrice(price)}
              onUnitChange={(unit) => setQuickAddUnit(unit)}
              onQuantityChange={(quantity) => setQuickAddQuantity(quantity)}
              showTotal={true}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={quickAddToCatalog}
                  onChange={(e) => {
                    setQuickAddToCatalog(e.target.checked);
                    // Reset frequently used if not adding to catalog
                    if (!e.target.checked) {
                      setQuickAddFrequentlyUsed(false);
                    }
                  }}
                />
              }
              label="Add to service catalog for future use"
            />
            {quickAddToCatalog && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={quickAddFrequentlyUsed}
                    onChange={(e) =>
                      setQuickAddFrequentlyUsed(e.target.checked)
                    }
                  />
                }
                label="Mark as frequently used service"
                sx={{ ml: 3 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowQuickAdd(false);
              // Reset form state
              setQuickAddName('');
              setQuickAddPrice('0.00');
              setQuickAddPriceFocused(false);
              setQuickAddUnit('flat_rate');
              setQuickAddQuantity(1);
              setQuickAddFrequentlyUsed(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleQuickAdd}
            variant="contained"
            disabled={!quickAddName.trim()}
            startIcon={<AddIcon />}
          >
            Add Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Optimized Price Field Component - Isolated to prevent re-renders of parent
const ServicePriceField = React.memo(
  function ServicePriceField({
    unitPriceCents,
    onPriceChange,
  }: {
    unitPriceCents: number;
    onPriceChange: (cents: number) => void;
  }) {
    // Local state for immediate UI updates
    const [localValue, setLocalValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Debounced value for actual updates
    const debouncedValue = useDebounce(localValue, 300);

    // Update parent only when debounced value changes
    useEffect(() => {
      if (isFocused && debouncedValue !== '') {
        const cents = dollarsToCents(parseFloatFromCurrency(debouncedValue));
        onPriceChange(cents);
      }
    }, [debouncedValue, isFocused, onPriceChange]);

    // Display value - local when focused, formatted from props when not
    const displayValue = isFocused
      ? localValue
      : formatAsCurrency((unitPriceCents / 100).toFixed(2));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      // Only format locally, don't update parent yet
      setLocalValue(formatAsCurrency(rawValue));
    };

    const handleFocus = () => {
      const currentValue = (unitPriceCents / 100).toFixed(2);
      setLocalValue(currentValue === '0.00' ? '' : currentValue);
      setIsFocused(true);
    };

    const handleBlur = () => {
      const numericValue = parseFloatFromCurrency(localValue || '0');
      const formatted = numericValue.toFixed(2);
      setLocalValue(formatted);
      setIsFocused(false);

      // Update immediately on blur
      const cents = dollarsToCents(numericValue);
      onPriceChange(cents);
    };

    return (
      <TextField
        size="small"
        label="Price"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
      />
    );
  },
  // Custom comparison - only re-render if unitPriceCents changes
  (prevProps, nextProps) =>
    prevProps.unitPriceCents === nextProps.unitPriceCents
);
