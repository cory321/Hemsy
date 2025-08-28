'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
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
  Stack,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { ServiceDraft } from '@/contexts/OrderFlowContext';
import {
  formatCurrency,
  dollarsToCents,
  parseFloatFromCurrency,
  formatAsCurrency,
} from '@/lib/utils/currency';
import { toast } from 'react-hot-toast';
import { searchServices, addService } from '@/lib/actions/services';

import ServicePriceInput from '@/components/common/ServicePriceInput';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

interface ServiceSearchAndManagerProps {
  services: ServiceDraft[];
  onChange: (services: ServiceDraft[]) => void;
  garmentType?: string;
  showQuickAdd?: boolean;
  onQuickAddClose?: () => void;
  searchOnly?: boolean;
  addedServicesOnly?: boolean;
}

export default function ServiceSearchAndManager({
  services,
  onChange,
  garmentType,
  showQuickAdd: externalShowQuickAdd = false,
  onQuickAddClose,
  searchOnly = false,
  addedServicesOnly = false,
}: ServiceSearchAndManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceOption[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(externalShowQuickAdd);
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddPrice, setQuickAddPrice] = useState('0.00');
  const [quickAddUnit, setQuickAddUnit] = useState<
    'flat_rate' | 'hour' | 'day'
  >('flat_rate');
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [quickAddToCatalog, setQuickAddToCatalog] = useState(true);
  const [quickAddFrequentlyUsed, setQuickAddFrequentlyUsed] = useState(false);
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Handle external showQuickAdd changes
  useEffect(() => {
    setShowQuickAdd(externalShowQuickAdd);
  }, [externalShowQuickAdd]);

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

  const handleAddService = (service: ServiceOption) => {
    const newService: ServiceDraft = {
      serviceId: service.id,
      name: service.name,
      quantity: service.default_qty,
      unit: service.default_unit as ServiceDraft['unit'],
      unitPriceCents: service.default_unit_price_cents,
    };
    onChange([...services, newService]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleUpdateService = (
    index: number,
    updates: Partial<ServiceDraft>
  ) => {
    const updatedServices = services.map((service, i) =>
      i === index ? { ...service, ...updates } : service
    );
    onChange(updatedServices);
  };

  const handleRemoveService = (index: number) => {
    const updatedServices = services.filter((_, i) => i !== index);
    onChange(updatedServices);
  };

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) {
      toast.error('Please enter a service name');
      return;
    }

    setQuickAddLoading(true);
    const priceCents = dollarsToCents(parseFloatFromCurrency(quickAddPrice));

    try {
      if (quickAddToCatalog) {
        try {
          const created = await addService({
            name: quickAddName,
            default_qty: quickAddQuantity,
            default_unit: quickAddUnit,
            default_unit_price_cents: priceCents,
            frequently_used: quickAddFrequentlyUsed,
          });
          const newService: ServiceDraft = {
            serviceId: created.id,
            name: quickAddName,
            quantity: quickAddQuantity,
            unit: quickAddUnit,
            unitPriceCents: priceCents,
          };
          onChange([...services, newService]);
          toast.success('Service added to catalog');
        } catch (error) {
          console.error('Failed to add service:', error);
          toast.error('Failed to add service');
          return;
        }
      } else {
        // Add as inline service
        const newService: ServiceDraft = {
          name: quickAddName,
          quantity: quickAddQuantity,
          unit: quickAddUnit,
          unitPriceCents: priceCents,
          inline: {
            name: quickAddName,
          },
        };
        onChange([...services, newService]);
      }

      // Reset quick add form
      setQuickAddName('');
      setQuickAddPrice('0.00');
      setQuickAddUnit('flat_rate');
      setQuickAddQuantity(1);
      setQuickAddFrequentlyUsed(false);
      setShowQuickAdd(false);
      onQuickAddClose?.();
    } finally {
      setQuickAddLoading(false);
    }
  };

  return (
    <Box>
      {/* Search Services - only show if not addedServicesOnly */}
      {!addedServicesOnly && (
        <Box sx={{ mb: searchOnly ? 0 : 3 }}>
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
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 1 }}
                >
                  Type at least 2 characters to search
                </Typography>
              ) : searchLoading ? (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}
                >
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
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {service.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(service.default_unit_price_cents / 100)} /{' '}
                      {service.default_unit === 'flat_rate'
                        ? 'Flat Rate'
                        : service.default_unit}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ p: 1 }}
                >
                  No services found
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Added Services - only show if not searchOnly */}
      {!searchOnly && (
        <Box>
          {services.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No services added yet
            </Typography>
          ) : (
            <Stack spacing={1}>
              {services.map((service, index) => (
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
                            handleUpdateService(index, {
                              quantity: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            })
                          }
                          disabled={service.unit === 'flat_rate'}
                          placeholder={
                            service.unit === 'flat_rate' ? 'N/A' : ''
                          }
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 4, sm: 2 }}>
                        <Select
                          size="small"
                          value={service.unit}
                          onChange={(e) => {
                            const newUnit = e.target.value as any;
                            handleUpdateService(index, {
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
                        <TextField
                          size="small"
                          label="Price"
                          value={formatAsCurrency(
                            (service.unitPriceCents / 100).toFixed(2)
                          )}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            const numericValue =
                              parseFloatFromCurrency(rawValue);
                            const cents = dollarsToCents(numericValue);
                            handleUpdateService(index, {
                              unitPriceCents: cents,
                            });
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                $
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 1 }}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveService(index)}
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
      )}

      {/* Quick Add Dialog */}
      <Dialog
        open={showQuickAdd}
        onClose={() => {
          setShowQuickAdd(false);
          onQuickAddClose?.();
          // Reset form state
          setQuickAddName('');
          setQuickAddPrice('0.00');
          setQuickAddUnit('flat_rate');
          setQuickAddQuantity(1);
          setQuickAddFrequentlyUsed(false);
          setQuickAddLoading(false);
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
              onQuickAddClose?.();
              // Reset form state
              setQuickAddName('');
              setQuickAddPrice('0.00');
              setQuickAddUnit('flat_rate');
              setQuickAddQuantity(1);
              setQuickAddFrequentlyUsed(false);
              setQuickAddLoading(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleQuickAdd}
            variant="contained"
            disabled={!quickAddName.trim() || quickAddLoading}
            startIcon={
              quickAddLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <AddIcon />
              )
            }
          >
            {quickAddLoading ? 'Adding...' : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
