'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  CardActionArea,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { GarmentDraft } from '@/contexts/OrderFlowContext';
import { formatCurrency } from '@/lib/utils/currency';
import { getPresetIconUrl } from '@/utils/presetIcons';

interface GarmentCardProps {
  garment?: GarmentDraft;
  isAddButton?: boolean;
  onClick: () => void;
  index?: number;
}

export default function GarmentCard({
  garment,
  isAddButton,
  onClick,
  index,
}: GarmentCardProps) {
  // Calculate total for existing garment
  const calculateTotal = () => {
    if (!garment) return 0;
    return garment.services.reduce(
      (sum, service) => sum + service.quantity * service.unitPriceCents,
      0
    );
  };

  const total = garment ? calculateTotal() : 0;
  const serviceCount = garment?.services.length || 0;

  if (isAddButton) {
    return (
      <Card
        sx={{
          height: '100%',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          border: '2px dashed',
          borderColor: 'primary.main',
          backgroundColor: 'background.paper',
        }}
      >
        <CardActionArea
          onClick={onClick}
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/presets/garments/select-garment.svg"
              alt="Add garment"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </Box>
          <Typography variant="body1" color="primary" sx={{ fontWeight: 500 }}>
            ADD GARMENT
          </Typography>
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        height: '100%',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* Garment Icon/Image */}
          <Box
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {garment?.cloudinaryPublicId || garment?.imageCloudId ? (
              <img
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,h_160,w_160/${garment.cloudinaryPublicId || garment.imageCloudId}`}
                alt={garment.name || 'Garment'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            ) : garment?.presetIconKey ? (
              <InlinePresetSvg
                src={
                  getPresetIconUrl(garment.presetIconKey) ||
                  '/presets/garments/select-garment.svg'
                }
                {...(garment.presetFillColor
                  ? { fillColor: garment.presetFillColor }
                  : {})}
                style={{ width: 80, height: 80 }}
              />
            ) : (
              <img
                src="/presets/garments/select-garment.svg"
                alt="Default garment"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </Box>

          {/* Garment Name */}
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {garment?.name || `Garment ${(index || 0) + 1}`}
          </Typography>

          {/* Service Count */}
          {serviceCount > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
            </Typography>
          )}

          {/* Total Price */}
          <Typography variant="h6" color="primary">
            {formatCurrency(total / 100)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
