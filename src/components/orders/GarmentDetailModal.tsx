'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  FormControlLabel,
  Checkbox,
  Stack,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { alpha } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format as formatDate } from 'date-fns';
import { GarmentDraft, ServiceDraft } from '@/contexts/OrderFlowContext';
import ServiceSelectorModal from './ServiceSelectorModal';
import GarmentImageUpload from './GarmentImageUpload';
import GarmentImageOverlay from './GarmentImageOverlay';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import PresetGarmentIconModal, {
  PresetGarmentIconModalResult,
} from './PresetGarmentIconModal';
import { getPresetIconUrl, getPresetIconLabel } from '@/utils/presetIcons';
import { v4 as uuidv4 } from 'uuid';
import { CldImage } from 'next-cloudinary';

interface ServiceOption {
  id: string;
  name: string;
  default_unit: string;
  default_qty: number;
  default_unit_price_cents: number;
}

interface GarmentDetailModalProps {
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

export default function GarmentDetailModal({
  open,
  onClose,
  garment,
  onSave,
  onDelete,
  isNew = false,
  index = 0,
  preloadedServices = [],
  onGarmentChange,
}: GarmentDetailModalProps) {
  const [localGarment, setLocalGarment] = useState<GarmentDraft | null>(null);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [showServicesError, setShowServicesError] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<{
    dueDate?: string;
    eventDate?: string;
  }>({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  const handleSave = () => {
    if (localGarment) {
      // Clear any previous errors
      setShowServicesError(false);

      // Validate dates
      if (localGarment.eventDate && localGarment.dueDate) {
        const eventDate = new Date(localGarment.eventDate);
        const dueDate = new Date(localGarment.dueDate);
        if (eventDate <= dueDate) {
          setDateValidationError({
            eventDate: 'Event date must be after the due date',
          });
          return;
        }
      }

      // Check if no services are attached
      if (!localGarment.services || localGarment.services.length === 0) {
        setShowServicesError(true);
        return;
      }

      onSave(localGarment);
      onClose();
    }
  };

  const handleServiceChange = (services: ServiceDraft[]) => {
    if (localGarment) {
      setLocalGarment({ ...localGarment, services });
      // Clear services error when services are added
      if (services.length > 0 && showServicesError) {
        setShowServicesError(false);
      }
    }
  };

  const handleImageUpload = (result: any) => {
    if (localGarment && result?.info) {
      setLocalGarment({
        ...localGarment,
        cloudinaryPublicId: result.info.public_id,
        imageCloudId: result.info.public_id, // Set both fields for compatibility
        imageUrl: result.info.secure_url,
        // Clear preset icon when image is uploaded
        presetIconKey: undefined,
        presetFillColor: undefined,
      });
    }
  };

  const handleImageRemove = () => {
    if (localGarment) {
      setLocalGarment({
        ...localGarment,
        cloudinaryPublicId: undefined,
        imageCloudId: undefined, // Clear both fields for compatibility
        imageUrl: undefined,
      });
    }
  };

  const handleIconSelect = (result: PresetGarmentIconModalResult) => {
    if (localGarment) {
      const presetLabel = getPresetIconLabel(result.presetIconKey);

      // Auto-fill name logic:
      // 1. If name is empty, auto-fill with preset label
      // 2. If name exists but isNameUserEdited is explicitly false, override with preset label
      // 3. If name exists and isNameUserEdited is undefined or true, don't change it
      const shouldAutoFillName =
        !localGarment.name || localGarment.isNameUserEdited === false;

      // Build the full updated garment for local state
      const updatedGarment = {
        ...localGarment,
        presetIconKey: result.presetIconKey,
        presetFillColor: result.presetFillColor,
        // Auto-fill name if conditions are met
        ...(shouldAutoFillName && presetLabel ? { name: presetLabel } : {}),
        // Clear cloudinary image when icon is selected
        cloudinaryPublicId: undefined,
        imageCloudId: undefined, // Clear both fields for compatibility
        imageUrl: undefined,
      };

      setLocalGarment(updatedGarment);

      // Build the update object for the parent - only include changed properties
      const updateForParent: Partial<GarmentDraft> = {
        presetIconKey: result.presetIconKey,
        presetFillColor: result.presetFillColor,
        // Clear cloudinary image when icon is selected
        cloudinaryPublicId: undefined,
        imageCloudId: undefined, // Clear both fields for compatibility
        imageUrl: undefined,
      };

      // Only include name in update if we're auto-filling it
      if (shouldAutoFillName && presetLabel) {
        updateForParent.name = presetLabel;
      }

      // Immediately notify parent of the change for existing garments
      if (!isNew && onGarmentChange) {
        onGarmentChange(localGarment.id, updateForParent);
      }
    }
  };

  if (!localGarment) return null;

  const displayName = localGarment.name || `Garment ${index + 1}`;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {isNew ? 'Add New Garment' : `Edit ${displayName}`}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
              {/* Date Validation Alert */}
              {(dateValidationError.dueDate ||
                dateValidationError.eventDate) && (
                <Grid size={12}>
                  <Alert severity="warning">
                    {dateValidationError.dueDate ||
                      dateValidationError.eventDate}
                  </Alert>
                </Grid>
              )}

              {/* Left Column - Visual & Basic Info */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack spacing={2}>
                  {/* Garment Image/Icon with Overlay */}
                  <Box aria-label="Garment Image">
                    <GarmentImageOverlay
                      imageType={
                        localGarment.cloudinaryPublicId ? 'cloudinary' : 'icon'
                      }
                      onUploadSuccess={handleImageUpload}
                      onIconChange={() => setIconModalOpen(true)}
                      onImageRemove={handleImageRemove}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '1',
                          border: '2px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          bgcolor: 'grey.100',
                          position: 'relative',
                        }}
                      >
                        {localGarment.cloudinaryPublicId ? (
                          <CldImage
                            src={localGarment.cloudinaryPublicId}
                            alt={localGarment.name || 'Garment image'}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 100vw, 300px"
                          />
                        ) : localGarment.presetIconKey ? (
                          <InlinePresetSvg
                            src={
                              getPresetIconUrl(localGarment.presetIconKey) ||
                              '/presets/garments/select-garment.svg'
                            }
                            fillColor={
                              localGarment.presetFillColor || '#000000'
                            }
                            style={{
                              width: '80%',
                              height: '80%',
                              maxWidth: '80%',
                              maxHeight: '80%',
                            }}
                          />
                        ) : (
                          <InlinePresetSvg
                            src="/presets/garments/select-garment.svg"
                            style={{
                              width: '80%',
                              height: '80%',
                              maxWidth: '80%',
                              maxHeight: '80%',
                            }}
                          />
                        )}
                      </Box>
                    </GarmentImageOverlay>
                  </Box>
                </Stack>
              </Grid>

              {/* Right Column - Details */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <Stack spacing={2}>
                  {/* Garment Name */}
                  <TextField
                    fullWidth
                    label="Garment Name"
                    value={localGarment.name}
                    onChange={(e) => {
                      const updatedGarment = {
                        ...localGarment,
                        name: e.target.value,
                        isNameUserEdited: true,
                      };
                      setLocalGarment(updatedGarment);

                      // Immediately notify parent of the change for existing garments
                      if (!isNew && onGarmentChange) {
                        onGarmentChange(localGarment.id, {
                          name: e.target.value,
                          isNameUserEdited: true,
                        });
                      }
                    }}
                    placeholder="e.g., Blue Wedding Dress"
                  />

                  {/* Dates */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Due Date"
                        value={
                          localGarment.dueDate
                            ? dayjs(localGarment.dueDate)
                            : null
                        }
                        onChange={(newValue) => {
                          if (newValue) {
                            setLocalGarment({
                              ...localGarment,
                              dueDate: formatDate(
                                newValue.toDate(),
                                'yyyy-MM-dd'
                              ),
                            });
                            setDateValidationError({});
                          }
                        }}
                        slotProps={{
                          textField: { fullWidth: true },
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DatePicker
                        label="Event Date (Optional)"
                        value={
                          localGarment.eventDate
                            ? dayjs(localGarment.eventDate)
                            : null
                        }
                        onChange={(newValue) => {
                          setLocalGarment({
                            ...localGarment,
                            eventDate: newValue
                              ? formatDate(newValue.toDate(), 'yyyy-MM-dd')
                              : undefined,
                          });
                          setDateValidationError({});
                        }}
                        slotProps={{
                          textField: { fullWidth: true },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Special Event Checkbox */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={localGarment.specialEvent}
                        onChange={(e) => {
                          setLocalGarment({
                            ...localGarment,
                            specialEvent: e.target.checked,
                          });
                        }}
                      />
                    }
                    label="Special Event (Wedding, Prom, etc.)"
                  />

                  {/* Notes */}
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes (Optional)"
                    value={localGarment.notes}
                    onChange={(e) => {
                      setLocalGarment({
                        ...localGarment,
                        notes: e.target.value,
                      });
                    }}
                    placeholder="Any special instructions or details..."
                  />
                </Stack>
              </Grid>
            </Grid>

            {/* Services Section - Full Width Row */}
            <Grid size={12}>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Services
                </Typography>

                {/* Services Required Error */}
                {showServicesError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        You must add at least one service before saving this
                        garment.
                      </Typography>
                    </Box>
                  </Alert>
                )}

                <ServiceSelectorModal
                  services={localGarment.services}
                  onChange={handleServiceChange}
                  garmentType={localGarment.presetIconKey || ''}
                  preloadedServices={preloadedServices}
                />
              </Box>
            </Grid>
          </LocalizationProvider>
        </DialogContent>

        <DialogActions>
          {!isNew && onDelete && (
            <Button
              onClick={() => setConfirmDeleteOpen(true)}
              color="error"
              sx={{ mr: 'auto' }}
            >
              Remove Garment
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {isNew ? 'Add Garment' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {!isNew && onDelete && (
        <Dialog
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          role="alertdialog"
          aria-labelledby="confirm-delete-garment-title"
          aria-describedby="confirm-delete-garment-description"
          PaperProps={{ sx: { borderRadius: 3, minWidth: 420 } }}
        >
          <DialogContent
            sx={{
              display: 'grid',
              gridTemplateColumns: '88px 1fr',
              columnGap: 2,
              alignItems: 'flex-start',
              pt: 3,
              pb: 1,
            }}
          >
            <Box
              sx={(theme) => ({
                gridRow: '1 / span 2',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.error.main, 0.08),
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                mt: 0.25,
              })}
            >
              <WarningAmberRoundedIcon color="error" sx={{ fontSize: 48 }} />
            </Box>
            <Typography
              id="confirm-delete-garment-title"
              variant="h6"
              sx={{
                mb: 0.5,
                fontWeight: 600,
                lineHeight: 1.3,
                mt: 0.25,
              }}
            >
              Remove {displayName}?
            </Typography>
            <Typography
              id="confirm-delete-garment-description"
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.5 }}
            >
              All unsaved changes to this garment will be lost. This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{ px: 3, pb: 3, pt: 1, gap: 1.5, justifyContent: 'flex-end' }}
          >
            <Button onClick={() => setConfirmDeleteOpen(false)} autoFocus>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                onDelete(localGarment.id);
                setConfirmDeleteOpen(false);
              }}
            >
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Icon Selection Modal */}
      <PresetGarmentIconModal
        open={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        onSave={handleIconSelect}
        initialKey={localGarment.presetIconKey}
        initialFill={localGarment.presetFillColor}
      />
    </>
  );
}
