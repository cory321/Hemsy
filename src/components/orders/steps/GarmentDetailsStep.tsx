'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format as formatDate } from 'date-fns';
import { GarmentDraft } from '@/contexts/OrderFlowContext';
import GarmentImageOverlay from '../GarmentImageOverlay';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import PresetGarmentIconModal, {
  PresetGarmentIconModalResult,
} from '../PresetGarmentIconModal';
import { getPresetIconUrl, getPresetIconLabel } from '@/utils/presetIcons';
import SafeCldImage from '@/components/ui/SafeCldImage';

interface GarmentDetailsStepProps {
  garment: GarmentDraft;
  onGarmentUpdate: (updates: Partial<GarmentDraft>) => void;
  onValidationChange: (isValid: boolean) => void;
  index: number;
  isNew: boolean;
}

export default function GarmentDetailsStep({
  garment,
  onGarmentUpdate,
  onValidationChange,
  index,
  isNew,
}: GarmentDetailsStepProps) {
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [dateValidationError, setDateValidationError] = useState<{
    dueDate?: string;
    eventDate?: string;
  }>({});

  // Validate the step whenever garment or validation errors change
  useEffect(() => {
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

    // Check if there are any validation errors
    if (Object.keys(dateValidationError).length > 0) {
      isValid = false;
    }

    onValidationChange(isValid);
  }, [garment, dateValidationError, onValidationChange]);

  const handleImageUpload = (result: any) => {
    if (result?.info) {
      onGarmentUpdate({
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
    onGarmentUpdate({
      cloudinaryPublicId: undefined,
      imageCloudId: undefined, // Clear both fields for compatibility
      imageUrl: undefined,
    });
  };

  const handleIconSelect = (result: PresetGarmentIconModalResult) => {
    const presetLabel = getPresetIconLabel(result.presetIconKey);

    // Auto-fill name logic:
    // 1. If name is empty, auto-fill with preset label
    // 2. If name exists but isNameUserEdited is explicitly false, override with preset label
    // 3. If name exists and isNameUserEdited is undefined or true, don't change it
    const shouldAutoFillName =
      !garment.name || garment.isNameUserEdited === false;

    // Build the update object
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

    onGarmentUpdate(updateForParent);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={3}>
        {/* Left Column - Visual & Basic Info */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack spacing={2}>
            {/* Garment Image/Icon with Overlay */}
            <Box aria-label="Garment Image">
              <GarmentImageOverlay
                imageType={garment.cloudinaryPublicId ? 'cloudinary' : 'icon'}
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
                  {garment.cloudinaryPublicId ? (
                    <SafeCldImage
                      src={garment.cloudinaryPublicId}
                      alt={garment.name || 'Garment image'}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, 300px"
                      fallbackIconKey={garment.presetIconKey}
                      fallbackIconColor={garment.presetFillColor}
                    />
                  ) : garment.presetIconKey ? (
                    <InlinePresetSvg
                      src={
                        getPresetIconUrl(garment.presetIconKey) ||
                        '/presets/garments/select-garment.svg'
                      }
                      fillColor={garment.presetFillColor || '#000000'}
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
              value={garment.name}
              onChange={(e) => {
                onGarmentUpdate({
                  name: e.target.value,
                  isNameUserEdited: true,
                });
              }}
              placeholder="e.g., Blue Wedding Dress"
            />

            {/* Dates */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Due Date"
                  value={garment.dueDate ? dayjs(garment.dueDate) : null}
                  onChange={(newValue) => {
                    if (newValue) {
                      const today = dayjs().startOf('day');
                      const selectedDate = newValue.startOf('day');
                      const eventDate = garment.eventDate
                        ? dayjs(garment.eventDate).startOf('day')
                        : null;

                      // Validate due date
                      if (selectedDate.isBefore(today)) {
                        setDateValidationError({
                          dueDate: 'Due date cannot be in the past',
                        });
                      } else if (
                        garment.specialEvent &&
                        eventDate &&
                        (selectedDate.isAfter(eventDate) ||
                          selectedDate.isSame(eventDate))
                      ) {
                        setDateValidationError({
                          dueDate: 'Due date must be before the event date',
                        });
                      } else {
                        // Clear due date error if valid
                        setDateValidationError((prev) => {
                          const { dueDate, ...rest } = prev;
                          return rest;
                        });
                      }

                      onGarmentUpdate({
                        dueDate: formatDate(newValue.toDate(), 'yyyy-MM-dd'),
                      });
                    }
                  }}
                  minDate={dayjs()}
                  {...(garment.specialEvent &&
                    garment.eventDate && {
                      maxDate: dayjs(garment.eventDate).subtract(1, 'day'),
                    })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!dateValidationError.dueDate,
                      helperText: dateValidationError.dueDate,
                    },
                  }}
                />
              </Grid>
              {garment.specialEvent && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Event Date"
                    value={garment.eventDate ? dayjs(garment.eventDate) : null}
                    onChange={(newValue) => {
                      if (newValue) {
                        const today = dayjs().startOf('day');
                        const selectedDate = newValue.startOf('day');
                        const dueDate = garment.dueDate
                          ? dayjs(garment.dueDate).startOf('day')
                          : null;

                        // Validate event date
                        if (selectedDate.isBefore(today)) {
                          setDateValidationError({
                            eventDate: 'Event date cannot be in the past',
                          });
                        } else if (
                          dueDate &&
                          (selectedDate.isBefore(dueDate) ||
                            selectedDate.isSame(dueDate))
                        ) {
                          setDateValidationError({
                            eventDate: 'Event date must be after the due date',
                          });
                        } else {
                          // Clear event date error if valid, but also check if due date is now invalid
                          setDateValidationError((prev) => {
                            const { eventDate, ...rest } = prev;
                            let newErrors = rest;

                            // Check if due date is now invalid due to new event date
                            if (
                              dueDate &&
                              (dueDate.isAfter(selectedDate) ||
                                dueDate.isSame(selectedDate))
                            ) {
                              newErrors = {
                                ...newErrors,
                                dueDate:
                                  'Due date must be before the event date',
                              };
                            } else {
                              // Clear due date error if it was about event date conflict
                              const {
                                dueDate: dueDateError,
                                ...restWithoutDueDate
                              } = newErrors;
                              if (
                                dueDateError ===
                                'Due date must be before the event date'
                              ) {
                                newErrors = restWithoutDueDate;
                              } else if (dueDateError) {
                                newErrors = {
                                  ...restWithoutDueDate,
                                  dueDate: dueDateError,
                                };
                              }
                            }

                            return newErrors;
                          });
                        }
                      } else {
                        // Clear error when clearing the date, and also clear due date errors related to event date
                        setDateValidationError((prev) => {
                          const {
                            eventDate,
                            dueDate: dueDateError,
                            ...rest
                          } = prev;
                          let newErrors = rest;

                          // Clear due date error if it was about event date conflict
                          if (
                            dueDateError &&
                            dueDateError !== 'Due date cannot be in the past'
                          ) {
                            // Keep the error if it's about past date, clear if it's about event date conflict
                            if (
                              dueDateError ===
                              'Due date must be before the event date'
                            ) {
                              // Don't add it back
                            } else {
                              newErrors = {
                                ...newErrors,
                                dueDate: dueDateError,
                              };
                            }
                          }

                          return newErrors;
                        });
                      }

                      onGarmentUpdate({
                        eventDate: newValue
                          ? formatDate(newValue.toDate(), 'yyyy-MM-dd')
                          : undefined,
                      });
                    }}
                    minDate={
                      garment.dueDate
                        ? dayjs(garment.dueDate).add(1, 'day')
                        : dayjs()
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!dateValidationError.eventDate,
                        helperText: dateValidationError.eventDate,
                      },
                    }}
                  />
                </Grid>
              )}
            </Grid>

            {/* Special Event Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={garment.specialEvent}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    onGarmentUpdate({
                      specialEvent: isChecked,
                      // Clear event date when unchecking special event
                      eventDate: isChecked ? garment.eventDate : undefined,
                    });
                    // Clear any event date validation errors when unchecking
                    if (!isChecked) {
                      setDateValidationError((prev) => {
                        const { eventDate, ...rest } = prev;
                        return rest;
                      });
                    }
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
              value={garment.notes}
              onChange={(e) => {
                onGarmentUpdate({
                  notes: e.target.value,
                });
              }}
              placeholder="Any special instructions or details..."
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Icon Selection Modal */}
      <PresetGarmentIconModal
        open={iconModalOpen}
        onClose={() => setIconModalOpen(false)}
        onSave={handleIconSelect}
        initialKey={garment.presetIconKey}
        initialFill={garment.presetFillColor}
      />
    </LocalizationProvider>
  );
}
