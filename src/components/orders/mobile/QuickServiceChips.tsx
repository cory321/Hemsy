'use client';

import { Chip, Box, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFrequentlyUsedServices } from '@/lib/actions/services';
import { formatCurrency } from '@/lib/utils/currency';
import type { ServiceLine } from '@/contexts/OrderFlowContext';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: 'flat_rate' | 'hour' | 'day';
  default_qty: number;
  default_unit_price_cents: number;
}

interface QuickServiceChipsProps {
  garmentType?: string;
  onServicesChange: (services: ServiceLine[]) => void;
  selectedServices?: ServiceLine[];
}

export const QuickServiceChips = ({
  garmentType,
  onServicesChange,
  selectedServices = [],
}: QuickServiceChipsProps) => {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(selectedServices.map((s) => s.serviceId || '').filter(Boolean))
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    // Update selected IDs when selectedServices prop changes
    setSelectedServiceIds(
      new Set(selectedServices.map((s) => s.serviceId || '').filter(Boolean))
    );
  }, [selectedServices]);

  const loadServices = async () => {
    try {
      const frequentServices = await getFrequentlyUsedServices();
      // In the future, we could filter by garment type
      setServices(
        frequentServices.slice(0, 6).map((service) => ({
          ...service,
          default_unit: service.default_unit as 'flat_rate' | 'hour' | 'day',
        }))
      ); // Show top 6
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (service: ServiceOption) => {
    const newSelected = new Set(selectedServiceIds);
    let newServiceLines: ServiceLine[];

    if (newSelected.has(service.id)) {
      // Remove service
      newSelected.delete(service.id);
      newServiceLines = selectedServices.filter(
        (s) => s.serviceId !== service.id
      );
    } else {
      // Add service
      newSelected.add(service.id);
      const newService: ServiceLine = {
        serviceId: service.id,
        name: service.name,
        quantity: service.default_qty,
        unit: service.default_unit,
        unitPriceCents: service.default_unit_price_cents,
      };
      newServiceLines = [...selectedServices, newService];
    }

    setSelectedServiceIds(newSelected);
    onServicesChange(newServiceLines);

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  if (isLoading) {
    return (
      <Box p={2}>
        <Typography variant="subtitle2" gutterBottom>
          Loading services...
        </Typography>
      </Box>
    );
  }

  if (services.length === 0) {
    return null;
  }

  return (
    <Box p={2}>
      <Typography variant="subtitle2" gutterBottom>
        Quick Add Services
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        <AnimatePresence>
          {services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Chip
                label={
                  <Box>
                    <Typography variant="body2" component="span">
                      {service.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="span"
                      sx={{ ml: 1, opacity: 0.8 }}
                    >
                      {formatCurrency(service.default_unit_price_cents / 100)}
                    </Typography>
                  </Box>
                }
                onClick={() => toggleService(service)}
                color={
                  selectedServiceIds.has(service.id) ? 'primary' : 'default'
                }
                variant={
                  selectedServiceIds.has(service.id) ? 'filled' : 'outlined'
                }
                sx={{
                  transition: 'all 0.2s ease',
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};
