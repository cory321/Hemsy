'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Alert } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { GarmentDraft, ServiceDraft } from '@/contexts/OrderFlowContext';
import FrequentlyUsedServices from '../FrequentlyUsedServices';
import ServiceSearchAndManager from '../ServiceSearchAndManager';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

interface GarmentServicesStepProps {
  garment: GarmentDraft;
  onServiceChange: (services: ServiceDraft[]) => void;
  onValidationChange: (isValid: boolean) => void;
  preloadedServices?: ServiceOption[];
  saveAttempted?: boolean;
}

export default function GarmentServicesStep({
  garment,
  onServiceChange,
  onValidationChange,
  preloadedServices = [],
  saveAttempted = false,
}: GarmentServicesStepProps) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Validate the step whenever services change
  useEffect(() => {
    const isValid = garment.services && garment.services.length > 0;
    onValidationChange(isValid);
  }, [garment.services, onValidationChange]);

  const hasServices = garment.services && garment.services.length > 0;

  const handleAddService = (service: ServiceOption) => {
    const newService: ServiceDraft = {
      serviceId: service.id,
      name: service.name,
      quantity: service.default_qty,
      unit: service.default_unit as ServiceDraft['unit'],
      unitPriceCents: service.default_unit_price_cents,
    };
    onServiceChange([...garment.services, newService]);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Add Services
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the services you&apos;ll provide for this garment. You can search
        for existing services or add new ones.
      </Typography>

      {/* Services Required Error - only show after save attempt */}
      {!hasServices && saveAttempted && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              You must add at least one service before saving this garment.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Single Column Layout */}
      <Box>
        {/* Search Services */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Search Services
          </Typography>
          <ServiceSearchAndManager
            services={garment.services}
            onChange={onServiceChange}
            garmentType={garment.presetIconKey || ''}
            showQuickAdd={showQuickAdd}
            onQuickAddClose={() => setShowQuickAdd(false)}
            searchOnly={true}
          />
        </Box>

        {/* Frequently Used Services */}
        <Box sx={{ mb: 3 }}>
          <FrequentlyUsedServices
            onAddService={handleAddService}
            onShowQuickAdd={() => setShowQuickAdd(true)}
            preloadedServices={preloadedServices}
          />
        </Box>

        {/* Added Services */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Added Services
          </Typography>
          <ServiceSearchAndManager
            services={garment.services}
            onChange={onServiceChange}
            garmentType={garment.presetIconKey || ''}
            showQuickAdd={showQuickAdd}
            onQuickAddClose={() => setShowQuickAdd(false)}
            addedServicesOnly={true}
          />
        </Box>
      </Box>
    </Box>
  );
}
