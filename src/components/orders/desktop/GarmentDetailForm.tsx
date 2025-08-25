'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Stack,
  Tooltip,
  Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { format as formatDate } from 'date-fns';
import type { GarmentDraft } from '@/contexts/OrderFlowContext';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl, presetCatalog } from '@/utils/presetIcons';
import ServiceSelector from '../ServiceSelector';
import GarmentImageUpload from '../GarmentImageUpload';
import PresetGarmentIconModal from '../PresetGarmentIconModal';

interface GarmentDetailFormProps {
  garment: GarmentDraft;
  onUpdate: (updates: Partial<GarmentDraft>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export const GarmentDetailForm = ({
  garment,
  onUpdate,
  onDuplicate,
  onDelete,
}: GarmentDetailFormProps) => {
  const [showIconModal, setShowIconModal] = useState(false);

  const handleDateChange = (field: 'dueDate' | 'eventDate', value: any) => {
    if (!value) {
      onUpdate({ [field]: undefined });
      return;
    }
    const date = dayjs.isDayjs(value) ? value.toDate() : new Date(value);
    onUpdate({ [field]: formatDate(date, 'yyyy-MM-dd') });
  };

  const iconUrl = garment.presetIconKey
    ? getPresetIconUrl(garment.presetIconKey)
    : null;

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Typography variant="h5">Garment Details</Typography>
        <Box display="flex" gap={1}>
          {onDuplicate && (
            <Tooltip title="Duplicate Garment">
              <IconButton onClick={onDuplicate} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete Garment">
              <IconButton onClick={onDelete} color="error" size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Icon and Basic Info */}
      <Box display="flex" gap={3} mb={3}>
        {/* Icon */}
        <Paper
          onClick={() => setShowIconModal(true)}
          sx={{
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
        >
          {iconUrl ? (
            <InlinePresetSvg
              src={iconUrl}
              {...(garment.presetOutlineColor
                ? { outlineColor: garment.presetOutlineColor }
                : {})}
              {...(garment.presetFillColor
                ? { fillColor: garment.presetFillColor }
                : {})}
            />
          ) : (
            <img
              src="/presets/garments/select-garment.svg"
              alt="Select garment icon"
              style={{ width: 60, height: 60, objectFit: 'contain' }}
            />
          )}
        </Paper>

        {/* Basic Fields */}
        <Box flex={1}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Garment Name"
              value={garment.name}
              onChange={(e) =>
                onUpdate({
                  name: e.target.value,
                  isNameUserEdited: true,
                })
              }
              placeholder="e.g., Blue Wedding Dress"
            />

            <Box display="flex" gap={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Due Date"
                  value={garment.dueDate ? dayjs(garment.dueDate) : null}
                  onChange={(value) => handleDateChange('dueDate', value)}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                />
              </LocalizationProvider>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={garment.specialEvent || false}
                    onChange={(e) =>
                      onUpdate({
                        specialEvent: e.target.checked,
                        eventDate: e.target.checked
                          ? garment.eventDate
                          : undefined,
                      })
                    }
                  />
                }
                label="Special Event"
              />

              {garment.specialEvent && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Event Date"
                    value={garment.eventDate ? dayjs(garment.eventDate) : null}
                    onChange={(value) => handleDateChange('eventDate', value)}
                    {...(garment.dueDate
                      ? { minDate: dayjs(garment.dueDate) }
                      : {})}
                    slotProps={{
                      textField: { fullWidth: true },
                    }}
                  />
                </LocalizationProvider>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Image Upload */}
      <Box mb={3}>
        <GarmentImageUpload
          imageUrl={garment.imageUrl}
          publicId={garment.imageCloudId}
          garmentName={garment.name}
          onUpload={(result) =>
            onUpdate({
              imageCloudId: result.publicId,
              imageUrl: result.url,
              imageThumbnailUrl: result.thumbnailUrl,
            })
          }
          onRemove={() =>
            onUpdate({
              imageCloudId: undefined,
              imageUrl: undefined,
              imageThumbnailUrl: undefined,
            })
          }
          variant="card"
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Services */}
      <Typography variant="h6" gutterBottom>
        Services
      </Typography>
      <ServiceSelector garmentId={garment.id} />

      <Divider sx={{ my: 3 }} />

      {/* Notes */}
      <TextField
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={garment.notes || ''}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        placeholder="Any special instructions or notes about this garment"
      />

      {/* Icon Modal */}
      <PresetGarmentIconModal
        open={showIconModal}
        onClose={() => setShowIconModal(false)}
        onSave={(result) => {
          const label = result.presetIconKey
            ? (() => {
                for (const category of presetCatalog) {
                  const found = category.items.find(
                    (i) => i.key === result.presetIconKey
                  );
                  if (found) return found.label;
                }
                return undefined;
              })()
            : undefined;

          onUpdate({
            presetIconKey: result.presetIconKey,
            presetFillColor: result.presetFillColor,
            name:
              garment.isNameUserEdited || garment.name
                ? garment.name
                : label || '',
          });
          setShowIconModal(false);
        }}
        initialKey={garment.presetIconKey}
        initialFill={garment.presetFillColor}
      />
    </Box>
  );
};
