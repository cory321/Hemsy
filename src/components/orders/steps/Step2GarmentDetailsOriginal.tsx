'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Chip,
  Stack,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { v4 as uuidv4 } from 'uuid';
import { useOrderFlow, GarmentDraft } from '@/contexts/OrderFlowContext';
import ServiceSelector from '../ServiceSelector';
import GarmentImageUpload from '../GarmentImageUpload';
import { formatCurrency } from '@/lib/utils/currency';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { format as formatDate } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import PresetGarmentIconModal from '../PresetGarmentIconModal';
import { getPresetIconUrl, presetCatalog } from '@/utils/presetIcons';

export default function Step2GarmentDetails() {
  const {
    orderDraft,
    addGarment,
    updateGarment,
    removeGarment,
    updateGarmentImage,
    removeGarmentImage,
  } = useOrderFlow();
  const [expandedGarment, setExpandedGarment] = useState<string | false>(false);
  const [iconModalGarmentId, setIconModalGarmentId] = useState<string | null>(
    null
  );
  const [dateValidationErrors, setDateValidationErrors] = useState<
    Record<string, { dueDate?: string; eventDate?: string }>
  >({});

  const handleAddGarment = () => {
    const newGarment: GarmentDraft = {
      id: uuidv4(),
      // Name is optional; user can leave blank
      name: '',
      isNameUserEdited: false,
      notes: '',
      dueDate: formatDate(new Date(), 'yyyy-MM-dd'),
      eventDate: undefined,
      specialEvent: false,
      services: [],
    };
    addGarment(newGarment);
    setExpandedGarment(newGarment.id);
  };

  const calculateGarmentTotal = (garment: GarmentDraft) => {
    return garment.services.reduce(
      (sum, service) => sum + service.quantity * service.unitPriceCents,
      0
    );
  };

  // Show defaulted display name in summary if user leaves it blank
  const getDisplayName = (index: number, name: string) => {
    const normalized = assignDefaultGarmentNames(
      orderDraft.garments.map((g, i) => ({ name: i === index ? name : g.name }))
    );
    return normalized[index]?.name ?? `Garment ${index + 1}`;
  };

  const handleAccordionChange =
    (garmentId: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedGarment(isExpanded ? garmentId : false);
    };

  const handleRemoveGarment = (garmentId: string) => {
    // Clean up validation errors for this garment
    setDateValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[garmentId];
      return newErrors;
    });
    removeGarment(garmentId);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Add Garments & Services
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add garments and specify the services needed for each one.
      </Typography>

      {orderDraft.garments.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <CheckroomIcon
            sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No garments added yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click the button below to add your first garment
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGarment}
          >
            Add First Garment
          </Button>
        </Card>
      ) : (
        <>
          {orderDraft.garments.map((garment, index) => (
            <Accordion
              key={garment.id}
              expanded={expandedGarment === garment.id}
              onChange={handleAccordionChange(garment.id)}
              sx={{ mb: 2 }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Typography variant="h6">
                    {garment.name?.trim()
                      ? garment.name.trim()
                      : `Garment ${index + 1}`}
                  </Typography>
                  {garment.services.length > 0 && (
                    <Chip
                      label={`${garment.services.length} service${garment.services.length !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  {garment.services.length > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      Total:{' '}
                      {formatCurrency(calculateGarmentTotal(garment) / 100)}
                    </Typography>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {/* Date Validation Alert */}
                  {(dateValidationErrors[garment.id]?.dueDate ||
                    dateValidationErrors[garment.id]?.eventDate) && (
                    <Grid size={12}>
                      <Alert severity="warning" icon={<WarningAmberIcon />}>
                        {dateValidationErrors[garment.id]?.dueDate ||
                          dateValidationErrors[garment.id]?.eventDate}
                      </Alert>
                    </Grid>
                  )}

                  {/* Visual + Basics layout */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Stack spacing={1} alignItems="stretch">
                      {/* Square icon picker */}
                      <Box
                        role="button"
                        tabIndex={0}
                        aria-label="Choose Garment Icon"
                        onClick={() => setIconModalGarmentId(garment.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIconModalGarmentId(garment.id);
                          }
                        }}
                        sx={(theme) => ({
                          width: { xs: 140, sm: 160 },
                          maxWidth: '100%',
                          mx: 'auto',
                          aspectRatio: '1 / 1',
                          borderRadius: 1,
                          display: 'grid',
                          placeItems: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          border: '2px',
                          borderStyle: garment.presetIconKey
                            ? 'solid'
                            : 'dashed',
                          borderColor: 'primary.main',
                          bgcolor: 'background.paper',
                          p: 1,
                          transition: theme.transitions.create(
                            [
                              'transform',
                              'box-shadow',
                              'background-color',
                              'border-color',
                            ],
                            {
                              duration: 160,
                              easing: theme.transitions.easing.easeOut,
                            }
                          ),
                          '&:hover': {
                            transform: 'translateY(-1px) scale(1.02)',
                            boxShadow: 3,
                            borderColor: 'primary.main',
                            bgcolor: theme.palette.action.hover,
                          },
                          '&:focus-visible': {
                            outline: `3px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                            borderColor: 'primary.main',
                          },
                          '@media (prefers-reduced-motion: reduce)': {
                            transition:
                              'border-color 160ms ease-out, background-color 160ms ease-out',
                            '&:hover': { transform: 'none', boxShadow: 2 },
                          },
                        })}
                      >
                        {garment.presetIconKey ? (
                          (() => {
                            const url = getPresetIconUrl(
                              garment.presetIconKey!
                            );
                            return url ? (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  position: 'relative',
                                }}
                              >
                                <InlinePresetSvg
                                  src={url}
                                  {...(garment.presetOutlineColor
                                    ? {
                                        outlineColor:
                                          garment.presetOutlineColor,
                                      }
                                    : {})}
                                  {...(garment.presetFillColor
                                    ? { fillColor: garment.presetFillColor }
                                    : {})}
                                />
                              </Box>
                            ) : null;
                          })()
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              position: 'relative',
                            }}
                          >
                            <InlinePresetSvg src="/presets/garments/select-garment.svg" />
                          </Box>
                        )}
                      </Box>

                      {/* Upload photo link */}
                      <Box>
                        <GarmentImageUpload
                          imageUrl={garment.imageUrl}
                          publicId={garment.imageCloudId}
                          garmentName={garment.name}
                          onUpload={(result) =>
                            updateGarmentImage(garment.id, result)
                          }
                          onRemove={() => removeGarmentImage(garment.id)}
                          variant="link"
                        />
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Stack spacing={1}>
                      <TextField
                        fullWidth
                        label="Garment Name (Optional)"
                        value={garment.name}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          const trimmed = nextName.trim();
                          updateGarment(garment.id, {
                            name: nextName,
                            // Mark as user edited when non-empty; reset when cleared
                            isNameUserEdited: trimmed.length > 0,
                          });
                        }}
                        placeholder="e.g., Wedding Dress, Suit Jacket"
                      />
                      {/* Due date */}
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Due Date"
                          value={
                            garment.dueDate ? dayjs(garment.dueDate) : null
                          }
                          format="dddd, MMMM D, YYYY"
                          onChange={(newValue) => {
                            if (!newValue) {
                              updateGarment(garment.id, { dueDate: undefined });
                              // Clear any validation errors
                              setDateValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                const errorEntry = newErrors[garment.id];
                                if (errorEntry) {
                                  const { dueDate, ...rest } = errorEntry;
                                  if (Object.keys(rest).length === 0) {
                                    delete newErrors[garment.id];
                                  } else {
                                    newErrors[garment.id] = rest;
                                  }
                                }
                                return newErrors;
                              });
                              return;
                            }
                            const asDate = dayjs.isDayjs(newValue)
                              ? newValue.toDate()
                              : new Date(newValue as any);

                            // Validate that due date is not after event date
                            if (garment.eventDate) {
                              const eventDate = new Date(garment.eventDate);
                              if (asDate > eventDate) {
                                // Set error state
                                setDateValidationErrors((prev) => ({
                                  ...prev,
                                  [garment.id]: {
                                    ...prev[garment.id],
                                    dueDate:
                                      'Due date cannot be after the event date',
                                  },
                                }));
                                return; // Don't update the date
                              }
                            }

                            // Clear any validation errors
                            setDateValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              const errorEntry = newErrors[garment.id];
                              if (errorEntry) {
                                const { dueDate, ...rest } = errorEntry;
                                if (Object.keys(rest).length === 0) {
                                  delete newErrors[garment.id];
                                } else {
                                  newErrors[garment.id] = rest;
                                }
                              }
                              return newErrors;
                            });

                            updateGarment(garment.id, {
                              dueDate: formatDate(asDate, 'yyyy-MM-dd'),
                            });
                          }}
                          minDate={dayjs()}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error:
                                !!dateValidationErrors[garment.id]?.dueDate,
                              helperText:
                                dateValidationErrors[garment.id]?.dueDate,
                              onClick: (e: any) => {
                                // Find and click the calendar button to open picker
                                const button =
                                  e.currentTarget.querySelector('button');
                                if (button) button.click();
                              },
                              InputProps: {
                                readOnly: true,
                              },
                              inputProps: {
                                style: {
                                  cursor: 'pointer',
                                  caretColor: 'transparent',
                                },
                                onKeyDown: (e: any) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                },
                                onPaste: (e: any) => e.preventDefault(),
                                onCut: (e: any) => e.preventDefault(),
                                onDrop: (e: any) => e.preventDefault(),
                                onMouseDown: (e: any) => e.preventDefault(),
                                onSelect: (e: any) => {
                                  if (
                                    e.target.selectionStart !==
                                    e.target.selectionEnd
                                  ) {
                                    e.target.setSelectionRange(0, 0);
                                  }
                                },
                              },
                              sx: {
                                '& input': {
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  MozUserSelect: 'none',
                                  msUserSelect: 'none',
                                  pointerEvents: 'none',
                                },
                                '& .MuiInputBase-root': {
                                  cursor: 'pointer',
                                },
                                '& fieldset': { cursor: 'pointer' },
                                '& .MuiInputBase-root.MuiOutlinedInput-root': {
                                  pointerEvents: 'auto',
                                },
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={garment.specialEvent || false}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (!isChecked) {
                                // When unchecking, clear event date
                                updateGarment(garment.id, {
                                  eventDate: undefined,
                                  specialEvent: false,
                                });
                                // Clear any validation errors
                                setDateValidationErrors((prev) => {
                                  const newErrors = { ...prev };
                                  const errorEntry = newErrors[garment.id];
                                  if (errorEntry) {
                                    const { eventDate, ...rest } = errorEntry;
                                    if (Object.keys(rest).length === 0) {
                                      delete newErrors[garment.id];
                                    } else {
                                      newErrors[garment.id] = rest;
                                    }
                                  }
                                  return newErrors;
                                });
                              } else {
                                // When checking, just set specialEvent to true
                                updateGarment(garment.id, {
                                  specialEvent: true,
                                });
                              }
                            }}
                          />
                        }
                        label="Garment is for a special event"
                      />

                      {/* Event Date Picker - Only show when specialEvent is checked */}
                      {garment.specialEvent && (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Event Date"
                            value={
                              garment.eventDate
                                ? dayjs(garment.eventDate)
                                : null
                            }
                            format="dddd, MMMM D, YYYY"
                            onChange={(newValue) => {
                              if (!newValue) {
                                updateGarment(garment.id, {
                                  eventDate: undefined,
                                });
                                // Clear any validation errors
                                setDateValidationErrors((prev) => {
                                  const newErrors = { ...prev };
                                  const errorEntry = newErrors[garment.id];
                                  if (errorEntry) {
                                    const { eventDate, ...rest } = errorEntry;
                                    if (Object.keys(rest).length === 0) {
                                      delete newErrors[garment.id];
                                    } else {
                                      newErrors[garment.id] = rest;
                                    }
                                  }
                                  return newErrors;
                                });
                                return;
                              }
                              const asDate = dayjs.isDayjs(newValue)
                                ? newValue.toDate()
                                : new Date(newValue as any);

                              // Validate that event date is not before due date
                              if (garment.dueDate) {
                                const dueDate = new Date(garment.dueDate);
                                if (asDate < dueDate) {
                                  // Set error state
                                  setDateValidationErrors((prev) => ({
                                    ...prev,
                                    [garment.id]: {
                                      ...prev[garment.id],
                                      eventDate:
                                        'Event date cannot be before the due date',
                                    },
                                  }));
                                  return; // Don't update the date
                                }
                              }

                              // Clear any validation errors
                              setDateValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                const errorEntry = newErrors[garment.id];
                                if (errorEntry) {
                                  const { eventDate, ...rest } = errorEntry;
                                  if (Object.keys(rest).length === 0) {
                                    delete newErrors[garment.id];
                                  } else {
                                    newErrors[garment.id] = rest;
                                  }
                                }
                                return newErrors;
                              });

                              updateGarment(garment.id, {
                                eventDate: formatDate(asDate, 'yyyy-MM-dd'),
                              });
                            }}
                            minDate={
                              garment.dueDate ? dayjs(garment.dueDate) : dayjs()
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error:
                                  !!dateValidationErrors[garment.id]?.eventDate,
                                helperText:
                                  dateValidationErrors[garment.id]?.eventDate,
                                onClick: (e: any) => {
                                  // Find and click the calendar button to open picker
                                  const button =
                                    e.currentTarget.querySelector('button');
                                  if (button) button.click();
                                },
                                InputProps: {
                                  readOnly: true,
                                },
                                inputProps: {
                                  style: {
                                    cursor: 'pointer',
                                    caretColor: 'transparent',
                                  },
                                  onKeyDown: (e: any) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  },
                                  onPaste: (e: any) => e.preventDefault(),
                                  onCut: (e: any) => e.preventDefault(),
                                  onDrop: (e: any) => e.preventDefault(),
                                  onMouseDown: (e: any) => e.preventDefault(),
                                  onSelect: (e: any) => {
                                    if (
                                      e.target.selectionStart !==
                                      e.target.selectionEnd
                                    ) {
                                      e.target.setSelectionRange(0, 0);
                                    }
                                  },
                                },
                                sx: {
                                  '& input': {
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    MozUserSelect: 'none',
                                    msUserSelect: 'none',
                                    pointerEvents: 'none',
                                  },
                                  '& .MuiInputBase-root': {
                                    cursor: 'pointer',
                                  },
                                  '& fieldset': { cursor: 'pointer' },
                                  '& .MuiInputBase-root.MuiOutlinedInput-root':
                                    {
                                      pointerEvents: 'auto',
                                    },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      )}
                    </Stack>
                  </Grid>

                  {/* Services Section */}
                  <Grid size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Services
                    </Typography>
                    <ServiceSelector garmentId={garment.id} />
                  </Grid>

                  {/* Notes moved below Services */}
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Notes"
                      value={garment.notes || ''}
                      onChange={(e) =>
                        updateGarment(garment.id, { notes: e.target.value })
                      }
                      placeholder="Any special instructions or notes about this garment"
                    />
                  </Grid>

                  {/* Delete Garment */}
                  <Grid size={12}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        mt: 2,
                      }}
                    >
                      <Button
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleRemoveGarment(garment.id)}
                      >
                        Remove Garment
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddGarment}
            fullWidth
            sx={{ mt: 2 }}
          >
            Add Another Garment
          </Button>
        </>
      )}
      <PresetGarmentIconModal
        open={!!iconModalGarmentId}
        onClose={() => setIconModalGarmentId(null)}
        onSave={(res) => {
          if (!iconModalGarmentId) return;
          const garment = orderDraft.garments.find(
            (g) => g.id === iconModalGarmentId
          );
          // Determine if we can overwrite the garment name based on user edits.
          // Backwards-compatible behavior:
          // - If isNameUserEdited === true -> never overwrite
          // - If isNameUserEdited === false -> always overwrite with preset label
          // - If isNameUserEdited is undefined -> overwrite when name is empty
          //   OR when the current name matches the previous preset label (implies auto-filled earlier)
          const previousLabel = garment?.presetIconKey
            ? (() => {
                for (const category of presetCatalog) {
                  const found = category.items.find(
                    (i) => i.key === garment.presetIconKey
                  );
                  if (found) return found.label;
                }
                return undefined;
              })()
            : undefined;

          const canOverwriteName =
            garment?.isNameUserEdited === true
              ? false
              : garment?.isNameUserEdited === false
                ? true
                : !garment?.name ||
                  !garment.name.trim() ||
                  (previousLabel && garment?.name?.trim() === previousLabel);
          const label = res.presetIconKey
            ? (() => {
                for (const category of presetCatalog) {
                  const found = category.items.find(
                    (i) => i.key === res.presetIconKey
                  );
                  if (found) return found.label;
                }
                return undefined;
              })()
            : undefined;

          updateGarment(iconModalGarmentId, {
            presetIconKey: res.presetIconKey,
            presetFillColor: res.presetFillColor,
            ...(canOverwriteName && label ? { name: label } : {}),
          });
        }}
        initialKey={((): string | undefined => {
          const g = orderDraft.garments.find(
            (x) => x.id === iconModalGarmentId
          );
          return g?.presetIconKey;
        })()}
        initialFill={((): string | undefined => {
          const g = orderDraft.garments.find(
            (x) => x.id === iconModalGarmentId
          );
          return g?.presetFillColor;
        })()}
      />
    </Box>
  );
}

// We need to install uuid for generating unique IDs
// npm install uuid @types/uuid
