'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useOrderFlow, GarmentDraft } from '@/contexts/OrderFlowContext';
import GarmentCard from '../GarmentCard';
import MultiStepGarmentModal from '../MultiStepGarmentModal';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { getFrequentlyUsedServices } from '@/lib/actions/services';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

export default function Step2GarmentDetailsCards() {
  const { orderDraft, addGarment, updateGarment, removeGarment } =
    useOrderFlow();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<GarmentDraft | null>(
    null
  );
  const [isNewGarment, setIsNewGarment] = useState(false);
  const [preloadedServices, setPreloadedServices] = useState<ServiceOption[]>(
    []
  );

  // Preload frequently used services to prevent pop-in effect
  useEffect(() => {
    const loadServices = async () => {
      try {
        const result = await getFrequentlyUsedServices();
        if (result.success) {
          setPreloadedServices(result.data);
        } else {
          console.error('Failed to preload services:', result.error);
        }
      } catch (error) {
        console.error('Unexpected error preloading services:', error);
      }
    };
    loadServices();
  }, []);

  // Auto-open modal for first garment if it exists (for testing only)
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'test' &&
      orderDraft.garments.length > 0 &&
      !modalOpen
    ) {
      const firstGarment = orderDraft.garments[0];
      if (firstGarment) {
        setSelectedGarment(firstGarment);
        setIsNewGarment(false);
        setModalOpen(true);
      }
    }
  }, [orderDraft.garments, modalOpen]);

  const handleOpenModal = (garment?: GarmentDraft) => {
    if (garment) {
      setSelectedGarment(garment);
      setIsNewGarment(false);
    } else {
      setSelectedGarment(null);
      setIsNewGarment(true);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedGarment(null);
    setIsNewGarment(false);
  };

  const handleSaveGarment = (garment: GarmentDraft) => {
    if (isNewGarment) {
      addGarment(garment);
    } else {
      updateGarment(garment.id, garment);
    }
    handleCloseModal();
  };

  const handleGarmentChange = (
    garmentId: string,
    updates: Partial<GarmentDraft>
  ) => {
    // Immediately update the garment in the context when changes are made
    updateGarment(garmentId, updates);
  };

  const handleDeleteGarment = (garmentId: string) => {
    removeGarment(garmentId);
    handleCloseModal();
  };

  // Get normalized names for display
  const normalizedGarments = assignDefaultGarmentNames(orderDraft.garments);

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center">
        Add Garments for {orderDraft.client?.first_name || 'Client'}
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 'none' }}>
          <Grid
            container
            spacing={3}
            sx={{
              justifyContent: 'center',
            }}
          >
            {/* Existing Garment Cards */}
            {normalizedGarments.map((garment, index) => (
              <Grid key={garment.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <GarmentCard
                  garment={garment}
                  onClick={() => handleOpenModal(garment)}
                  index={index}
                />
              </Grid>
            ))}

            {/* Add Garment Button */}
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
              <GarmentCard isAddButton onClick={() => handleOpenModal()} />
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Multi-Step Garment Modal */}
      <MultiStepGarmentModal
        open={modalOpen}
        onClose={handleCloseModal}
        garment={selectedGarment}
        onSave={handleSaveGarment}
        {...(!isNewGarment && { onDelete: handleDeleteGarment })}
        isNew={isNewGarment}
        index={
          selectedGarment
            ? orderDraft.garments.findIndex((g) => g.id === selectedGarment.id)
            : orderDraft.garments.length
        }
        preloadedServices={preloadedServices}
        onGarmentChange={handleGarmentChange}
      />
    </Box>
  );
}
