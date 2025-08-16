'use client';

import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Grid,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { getStageColor } from '@/constants/garmentStages';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { resolveGarmentDisplayImage } from '@/utils/displayImage';
import ChangeGarmentIconButtonOptimistic from './ChangeGarmentIconButtonOptimistic';
import { useGarment } from '@/contexts/GarmentContext';

interface GarmentImageSectionProps {
  clientName: string;
}

export default function GarmentImageSection({
  clientName,
}: GarmentImageSectionProps) {
  const { garment } = useGarment();

  // Resolve display image with fallbacks
  const resolved = resolveGarmentDisplayImage({
    photoUrl: garment.photo_url || undefined,
    cloudPublicId: garment.image_cloud_id || undefined,
    presetIconKey: garment.preset_icon_key || undefined,
  });

  return (
    <>
      {/* Stage Label */}
      <Box
        sx={{
          width: '100%',
          mb: 2,
          p: 2,
          borderRadius: 1,
          backgroundColor: getStageColor(garment.stage),
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {garment.stage}
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        {resolved.kind === 'photo' || resolved.kind === 'cloud' ? (
          <CardMedia
            component="img"
            image={resolved.src as string}
            alt={garment.name}
            sx={{ height: 400, objectFit: 'cover' }}
          />
        ) : resolved.kind === 'preset' && resolved.src ? (
          <Box
            sx={{
              height: 400,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'grey.100',
              position: 'relative',
              aspectRatio: '1 / 1',
              maxWidth: 400,
              mx: 'auto',
              overflow: 'hidden',
              p: 3,
            }}
          >
            {typeof resolved.src === 'string' ? (
              <InlinePresetSvg
                src={resolved.src}
                outlineColor={garment.preset_outline_color || undefined}
                fillColor={garment.preset_fill_color || undefined}
                style={{
                  height: '88%',
                  width: 'auto',
                  maxWidth: '100%',
                }}
              />
            ) : null}
          </Box>
        ) : (
          <Box
            sx={{
              height: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <InlinePresetSvg
              src={'/presets/garments/select-garment.svg'}
              style={{ height: '88%', width: 'auto', maxWidth: '100%' }}
            />
            <Typography color="text.secondary">Preset selected</Typography>
          </Box>
        )}
        <Box sx={{ p: 2 }}>
          <ChangeGarmentIconButtonOptimistic />
          <Box sx={{ mt: 1 }}>
            <Button variant="outlined" fullWidth startIcon={<CameraAltIcon />}>
              {resolved.kind === 'photo' || resolved.kind === 'cloud'
                ? 'Update Photo'
                : 'Add Photo'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Client Information */}
      {garment.order?.client && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Client Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{clientName}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {garment.order.client.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {garment.order.client.phone_number}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </>
  );
}
