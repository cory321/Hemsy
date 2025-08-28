'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { GarmentDraft, ServiceDraft } from '@/contexts/OrderFlowContext';
import { v4 as uuidv4 } from 'uuid';
import { format as formatDate } from 'date-fns';
import GarmentDetailsStepImproved from './steps/GarmentDetailsStepImproved';
import GarmentServicesStep from './steps/GarmentServicesStep';
import dayjs from 'dayjs';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

interface MultiStepGarmentModalProps {
  open: boolean;
  onClose: () => void;
  garment: GarmentDraft | null;
  onSave: (garment: GarmentDraft) => void;
  onDelete?: (garmentId: string) => void;
  isNew?: boolean;
  index?: number;
  preloadedServices?: ServiceOption[];
  onGarmentChange?: (garmentId: string, updates: Partial<GarmentDraft>) => void;
}

const steps = ['Garment Details', 'Services'];

export default function MultiStepGarmentModal({
  open,
  onClose,
  garment,
  onSave,
  onDelete,
  isNew = false,
  index = 0,
  preloadedServices = [],
  onGarmentChange,
}: MultiStepGarmentModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [localGarment, setLocalGarment] = useState<GarmentDraft | null>(null);
  const [step1Valid, setStep1Valid] = useState(false);
  const [step2Valid, setStep2Valid] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  // Initialize local garment state
  useEffect(() => {
    if (garment) {
      setLocalGarment({ ...garment });
    } else if (isNew) {
      // Create new garment
      setLocalGarment({
        id: uuidv4(),
        name: '',
        isNameUserEdited: false,
        notes: '',
        dueDate: formatDate(new Date(), 'yyyy-MM-dd'),
        eventDate: undefined,
        specialEvent: false,
        services: [],
      });
    }
  }, [garment, isNew]);

  // Reset step when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSaveAttempted(false);
    }
  }, [open]);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking to previous steps or current step
    // For next steps, require validation
    if (stepIndex <= activeStep) {
      setActiveStep(stepIndex);
    } else if (stepIndex === 1 && step1Valid) {
      // Allow going to step 2 if step 1 is valid
      setActiveStep(stepIndex);
    }
  };

  const handleSave = () => {
    setSaveAttempted(true);
    if (localGarment && step1Valid && step2Valid) {
      onSave(localGarment);
      onClose();
    }
  };

  const handleGarmentUpdate = (updates: Partial<GarmentDraft>) => {
    if (localGarment) {
      const updatedGarment = { ...localGarment, ...updates };
      setLocalGarment(updatedGarment);

      // Immediately notify parent of the change for existing garments
      if (!isNew && onGarmentChange) {
        onGarmentChange(localGarment.id, updates);
      }
    }
  };

  const handleServiceChange = (services: ServiceDraft[]) => {
    handleGarmentUpdate({ services });
  };

  const validateStep1 = (garment: GarmentDraft) => {
    // Validate dates
    const today = dayjs().startOf('day');
    let isValid = true;

    // Check due date
    if (garment.dueDate) {
      const dueDate = dayjs(garment.dueDate);
      if (dueDate.isBefore(today)) {
        isValid = false;
      }
    }

    // Check event date if special event is enabled
    if (garment.specialEvent && garment.eventDate && garment.dueDate) {
      const eventDate = dayjs(garment.eventDate);
      const dueDate = dayjs(garment.dueDate);

      if (
        eventDate.isBefore(today) ||
        eventDate.isBefore(dueDate) ||
        eventDate.isSame(dueDate)
      ) {
        isValid = false;
      }
    }

    setStep1Valid(isValid);
    return isValid;
  };

  const validateStep2 = (garment: GarmentDraft) => {
    const isValid = garment.services && garment.services.length > 0;
    setStep2Valid(isValid);
    return isValid;
  };

  // Validate steps when garment changes
  useEffect(() => {
    if (localGarment) {
      validateStep1(localGarment);
      validateStep2(localGarment);
    }
  }, [localGarment]);

  if (!localGarment) return null;

  const displayName = localGarment.name || `Garment ${index + 1}`;
  const canGoNext = activeStep === 0 ? step1Valid : false;
  const canSave = step1Valid && step2Valid;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          minHeight: isMobile ? '100vh' : '70vh',
          ...(isMobile && {
            margin: 0,
            borderRadius: 0,
          }),
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && activeStep > 0 && (
            <IconButton onClick={handleBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h6">
            {isNew ? 'Add New Garment' : `Edit ${displayName}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 3,
        }}
      >
        {activeStep === 0 && (
          <GarmentDetailsStepImproved
            garment={localGarment}
            onGarmentUpdate={handleGarmentUpdate}
            onValidationChange={setStep1Valid}
            index={index}
            isNew={isNew}
          />
        )}
        {activeStep === 1 && (
          <GarmentServicesStep
            garment={localGarment}
            onServiceChange={handleServiceChange}
            onValidationChange={setStep2Valid}
            preloadedServices={preloadedServices}
            saveAttempted={saveAttempted}
          />
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: isMobile ? 2 : 3,
          py: isMobile ? 2 : 3,
          gap: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left side: Step dots and delete button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Step dots navigation */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {steps.map((_, index) => {
              const isActive = index === activeStep;
              const isCompleted =
                index < activeStep ||
                (index === 0 && step1Valid) ||
                (index === 1 && step2Valid);
              const isClickable =
                index <= activeStep || (index === 1 && step1Valid);

              return (
                <Box
                  key={index}
                  onClick={() => isClickable && handleStepClick(index)}
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: 'all 0.2s ease-in-out',
                    bgcolor: isActive
                      ? 'primary.main'
                      : isCompleted
                        ? 'primary.light'
                        : 'grey.300',
                    border: isActive
                      ? `2px solid ${theme.palette.primary.main}`
                      : 'none',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    '&:hover': isClickable
                      ? {
                          transform: 'scale(1.1)',
                          bgcolor: isActive
                            ? 'primary.main'
                            : isCompleted
                              ? 'primary.main'
                              : 'grey.400',
                        }
                      : {},
                  }}
                />
              );
            })}
          </Box>

          {/* Delete button for existing garments */}
          {!isNew && onDelete && (
            <Button
              onClick={() => onDelete(localGarment.id)}
              color="error"
              size="small"
            >
              Remove Garment
            </Button>
          )}
        </Box>

        {/* Right side: Navigation buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>Cancel</Button>

          {!isMobile && activeStep > 0 && (
            <Button onClick={handleBack} startIcon={<ArrowBackIcon />}>
              Back
            </Button>
          )}

          {activeStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canGoNext}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={!canSave}
            >
              {isNew ? 'Add Garment' : 'Save Changes'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
