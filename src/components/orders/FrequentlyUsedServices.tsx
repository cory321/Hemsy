'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';

import { ServiceDraft } from '@/contexts/OrderFlowContext';
import { formatCurrency } from '@/lib/utils/currency';
import {
  getFrequentlyUsedServices,
  fetchAllServices,
} from '@/lib/actions/services';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

interface FrequentlyUsedServicesProps {
  onAddService: (service: ServiceOption) => void;
  onShowQuickAdd: () => void;
  preloadedServices?: ServiceOption[];
}

export default function FrequentlyUsedServices({
  onAddService,
  onShowQuickAdd,
  preloadedServices = [],
}: FrequentlyUsedServicesProps) {
  const [frequentServices, setFrequentServices] = useState<ServiceOption[]>([]);

  // Load frequently used services on mount
  useEffect(() => {
    const loadFrequentServices = async () => {
      // If we have preloaded services, use them immediately
      if (preloadedServices.length > 0) {
        setFrequentServices(preloadedServices);
        return;
      }

      // Otherwise, load from API (fallback for components that don't preload)
      try {
        const serviceOptions = await getFrequentlyUsedServices();
        console.log('Loaded frequent services:', serviceOptions);

        // If no frequently used services, try to load all services and show first few
        if (serviceOptions.length === 0) {
          try {
            const allServices = await fetchAllServices();
            console.log(
              'No frequent services found, loaded all services:',
              allServices
            );
            // Show first 6 services as fallback
            setFrequentServices(allServices.slice(0, 6));
          } catch (searchError) {
            console.error('Failed to load fallback services:', searchError);
          }
        } else {
          setFrequentServices(serviceOptions);
        }
      } catch (error) {
        console.error('Failed to load frequent services:', error);
      }
    };
    loadFrequentServices();
  }, [preloadedServices]);

  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
        {frequentServices.length > 0 ? 'Frequently Used' : 'Services'}
      </Typography>

      <Grid container spacing={2}>
        {frequentServices.map((service) => (
          <Grid key={service.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: (theme) => theme.shadows[4],
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.main',
                },
              }}
              onClick={() => onAddService(service)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header: Service Name + Price */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 0.5,
                  }}
                >
                  {/* Left: Service Name */}
                  <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1.5 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.2,
                        color: 'text.primary',
                        wordBreak: 'break-word',
                      }}
                    >
                      {service.name}
                    </Typography>
                  </Box>

                  {/* Right: Price + Unit */}
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography
                      variant="body1"
                      color="primary.main"
                      sx={{
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      {formatCurrency(service.default_unit_price_cents / 100)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        display: 'block',
                        mt: 0.25,
                      }}
                    >
                      {service.default_unit === 'flat_rate'
                        ? 'Flat Rate'
                        : `Per ${service.default_unit}`}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Quick Add Service Button */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderColor: 'primary.main',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => theme.shadows[2],
                transform: 'translateY(-1px)',
                backgroundColor: 'primary.50',
              },
            }}
            onClick={onShowQuickAdd}
          >
            <CardContent
              sx={{
                p: 2,
                '&:last-child': { pb: 2 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                height: '100%',
              }}
            >
              <Typography
                variant="body2"
                color="primary.main"
                sx={{ fontWeight: 500 }}
              >
                Add New Service
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
