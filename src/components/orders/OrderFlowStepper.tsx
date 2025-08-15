'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import { toast } from 'react-hot-toast';
import { useOrderFlow } from '@/contexts/OrderFlowContext';
import type { GarmentDraft, ServiceLine } from '@/contexts/OrderFlowContext';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import Step1ClientSelection from './steps/Step1ClientSelection';
import Step2GarmentDetails from './steps/Step2GarmentDetails';
import Step3Summary from './steps/Step3Summary';
import { createOrder } from '@/lib/actions/orders';

const steps = ['Select Client', 'Add Garments & Services', 'Review & Confirm'];

export default function OrderFlowStepper() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentStep, setCurrentStep, orderDraft, resetOrder } =
    useOrderFlow();

  const handleNext = () => {
    if (currentStep === 0 && !orderDraft.clientId) {
      toast.error('Please select a client before proceeding');
      return;
    }
    if (currentStep === 1 && orderDraft.garments.length === 0) {
      toast.error('Please add at least one garment before proceeding');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare the order data
      const garmentsNormalized = assignDefaultGarmentNames<GarmentDraft>(
        orderDraft.garments
      );
      const orderData = {
        clientId: orderDraft.clientId,
        discountCents: orderDraft.discountCents,
        notes: orderDraft.notes,
        garments: garmentsNormalized.map((garment: GarmentDraft) => ({
          name: garment.name,
          notes: garment.notes,
          dueDate: garment.dueDate || undefined,
          specialEvent: garment.specialEvent,
          eventDate: garment.eventDate || undefined,
          // Include image data if available
          imageCloudId: garment.imageCloudId || undefined,
          imageUrl: garment.imageUrl || undefined,
          presetIconKey: garment.presetIconKey || undefined,
          presetFillColor: garment.presetFillColor || undefined,
          services: garment.services.map((service: ServiceLine) => ({
            quantity: service.quantity,
            unit: service.unit,
            unitPriceCents: service.unitPriceCents,
            serviceId: service.serviceId,
            inline: service.inline,
          })),
        })),
      };

      const result = await createOrder(orderData);

      if (result.success) {
        toast.success('Order created successfully!');
        resetOrder();
        router.push(`/orders/${result.orderId}`);
      } else {
        console.error('Order creation failed:', result.errors);
        // Show specific error message if available
        const errorMessage =
          result.errors?.root?.[0] ||
          Object.values(result.errors || {}).flat()[0] ||
          'Failed to create order. Please try again.';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1ClientSelection />;
      case 1:
        return <Step2GarmentDetails />;
      case 2:
        return <Step3Summary />;
      default:
        return 'Unknown step';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!orderDraft.clientId;
      case 1:
        // Garment name is optional now; only require at least one garment
        // and at least one service per garment.
        return (
          orderDraft.garments.length > 0 &&
          orderDraft.garments.every((g) => g.services.length > 0)
        );
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Stepper
          activeStep={currentStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card sx={{ mt: 4, mb: 4 }}>
          <CardContent>{getStepContent()}</CardContent>
        </Card>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Button
            disabled={currentStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Box sx={{ flex: '1' }} />
          {currentStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
            >
              {isSubmitting ? 'Creating Order...' : 'Create Order'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}
