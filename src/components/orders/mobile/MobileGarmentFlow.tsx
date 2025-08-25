'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Fab,
  Slide,
  AppBar,
  Toolbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useOrderFlow, GarmentDraft } from '@/contexts/OrderFlowContext';
import { GarmentTypeGrid } from './GarmentTypeGrid';
import { QuickServiceChips } from './QuickServiceChips';
import PresetGarmentIconModal from '../PresetGarmentIconModal';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format as formatDate } from 'date-fns';

interface MobileGarmentFlowProps {
  onComplete?: () => void;
}

export const MobileGarmentFlow = ({ onComplete }: MobileGarmentFlowProps) => {
  const { orderDraft, addGarment, updateGarment, removeGarment } =
    useOrderFlow();

  const [currentGarmentIndex, setCurrentGarmentIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0: Type, 1: Details, 2: Services
  const [showIconModal, setShowIconModal] = useState(false);

  const currentGarment = orderDraft.garments[currentGarmentIndex];
  const hasGarments = orderDraft.garments.length > 0;

  const handleAddNewGarment = () => {
    const newGarment: GarmentDraft = {
      id: uuidv4(),
      name: '',
      isNameUserEdited: false,
      notes: '',
      dueDate: formatDate(new Date(), 'yyyy-MM-dd'),
      specialEvent: false,
      services: [],
    };
    addGarment(newGarment);
    setCurrentGarmentIndex(orderDraft.garments.length);
    setCurrentStep(0);
  };

  const handleGarmentTypeSelect = (type: any) => {
    if (type.key === 'more') {
      setShowIconModal(true);
    } else if (currentGarment) {
      updateGarment(currentGarment.id, {
        presetIconKey: type.key,
        name: currentGarment.isNameUserEdited
          ? currentGarment.name
          : type.label,
      });
      setCurrentStep(1);
    }
  };

  const handleNavigateGarment = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentGarmentIndex > 0) {
      setCurrentGarmentIndex(currentGarmentIndex - 1);
      setCurrentStep(2); // Go to services step of previous garment
    } else if (
      direction === 'next' &&
      currentGarmentIndex < orderDraft.garments.length - 1
    ) {
      setCurrentGarmentIndex(currentGarmentIndex + 1);
      setCurrentStep(0); // Go to type step of next garment
    } else if (
      direction === 'next' &&
      currentGarmentIndex === orderDraft.garments.length - 1
    ) {
      // Last garment, complete or add new
      onComplete?.();
    }
  };

  const handleStepNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (direction === 'next' && currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else if (direction === 'next' && currentStep === 2) {
      // Move to next garment or complete
      handleNavigateGarment('next');
    } else if (
      direction === 'prev' &&
      currentStep === 0 &&
      currentGarmentIndex > 0
    ) {
      // Move to previous garment
      handleNavigateGarment('prev');
    }
  };

  if (!hasGarments) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
        p={3}
      >
        <Typography variant="h6" gutterBottom>
          No garments added yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Start by adding your first garment
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleAddNewGarment}
        >
          Add First Garment
        </Button>
      </Box>
    );
  }

  const steps = ['Select Type', 'Add Details', 'Add Services'];

  return (
    <Box sx={{ pb: 8 }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Garment {currentGarmentIndex + 1} of {orderDraft.garments.length}
          </Typography>
          {orderDraft.garments.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              Swipe to navigate
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {/* Step Indicator */}
      <Box sx={{ px: 2, py: 1 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentGarmentIndex}-${currentStep}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {currentStep === 0 && (
            <Box>
              <Typography variant="h6" align="center" sx={{ my: 2 }}>
                What type of garment?
              </Typography>
              <GarmentTypeGrid onSelect={handleGarmentTypeSelect} />
            </Box>
          )}

          {currentStep === 1 && currentGarment && (
            <Box p={2}>
              <Card>
                <CardContent>
                  <TextField
                    fullWidth
                    label="Garment Name"
                    value={currentGarment.name}
                    onChange={(e) => {
                      updateGarment(currentGarment.id, {
                        name: e.target.value,
                        isNameUserEdited: true,
                      });
                    }}
                    placeholder="e.g., Blue Wedding Dress"
                    sx={{ mb: 2 }}
                  />

                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Due Date"
                      value={
                        currentGarment.dueDate
                          ? dayjs(currentGarment.dueDate)
                          : null
                      }
                      onChange={(newValue) => {
                        if (newValue) {
                          updateGarment(currentGarment.id, {
                            dueDate: formatDate(
                              newValue.toDate(),
                              'yyyy-MM-dd'
                            ),
                          });
                        }
                      }}
                      slotProps={{
                        textField: { fullWidth: true, sx: { mb: 2 } },
                      }}
                    />
                  </LocalizationProvider>

                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes (optional)"
                    value={currentGarment.notes || ''}
                    onChange={(e) =>
                      updateGarment(currentGarment.id, {
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any special instructions..."
                  />

                  <Box display="flex" justifyContent="center" mt={2}>
                    <Button
                      startIcon={<PhotoCameraIcon />}
                      variant="outlined"
                      size="small"
                    >
                      Add Photo
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {currentStep === 2 && currentGarment && (
            <Box>
              <QuickServiceChips
                garmentType={currentGarment.presetIconKey || ''}
                onServicesChange={(services) => {
                  updateGarment(currentGarment.id, { services });
                }}
                selectedServices={currentGarment.services}
              />

              <Box p={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ borderStyle: 'dashed' }}
                >
                  Browse All Services
                </Button>
              </Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <IconButton
          onClick={() => handleStepNavigate('prev')}
          disabled={currentStep === 0 && currentGarmentIndex === 0}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box display="flex" gap={1}>
          {currentStep === 2 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddNewGarment}
            >
              Add Another
            </Button>
          )}
        </Box>

        <IconButton onClick={() => handleStepNavigate('next')} color="primary">
          <ArrowForwardIcon />
        </IconButton>
      </Box>

      {/* Icon Modal */}
      <PresetGarmentIconModal
        open={showIconModal}
        onClose={() => setShowIconModal(false)}
        onSave={(result) => {
          if (currentGarment) {
            updateGarment(currentGarment.id, {
              presetIconKey: result.presetIconKey,
              presetFillColor: result.presetFillColor,
              name: currentGarment.isNameUserEdited
                ? currentGarment.name
                : 'Custom Garment',
            });
            setShowIconModal(false);
            setCurrentStep(1);
          }
        }}
        initialKey={currentGarment?.presetIconKey}
        initialFill={currentGarment?.presetFillColor}
      />
    </Box>
  );
};
