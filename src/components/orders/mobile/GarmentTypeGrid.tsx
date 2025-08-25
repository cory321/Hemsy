'use client';

import { Box, Card, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { presetCatalog } from '@/utils/presetIcons';

interface GarmentType {
  key: string;
  label: string;
  svgPath: string;
}

interface GarmentTypeGridProps {
  onSelect: (type: GarmentType) => void;
}

export const GarmentTypeGrid = ({ onSelect }: GarmentTypeGridProps) => {
  // Get popular garment types from the preset catalog
  const popularTypes: GarmentType[] = [
    {
      key: 'tops.shirt',
      label: 'Shirt',
      svgPath: '/presets/garments/tops/shirt.svg',
    },
    {
      key: 'dresses_and_formal.dress_casual',
      label: 'Dress',
      svgPath: '/presets/garments/dresses and formal/dress-casual.svg',
    },
    {
      key: 'bottoms.pants',
      label: 'Pants',
      svgPath: '/presets/garments/bottoms/pants.svg',
    },
    {
      key: 'outerwear.jacket',
      label: 'Jacket',
      svgPath: '/presets/garments/outerwear/jacket.svg',
    },
    {
      key: 'tops.blouse',
      label: 'Blouse',
      svgPath: '/presets/garments/tops/blouse.svg',
    },
    {
      key: 'bottoms.skirt',
      label: 'Skirt',
      svgPath: '/presets/garments/bottoms/skirt.svg',
    },
    {
      key: 'outerwear.coat',
      label: 'Coat',
      svgPath: '/presets/garments/outerwear/coat.svg',
    },
    {
      key: 'more',
      label: 'More...',
      svgPath: '/presets/garments/select-garment.svg',
    },
  ];

  const handleSelect = (type: GarmentType) => {
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSelect(type);
  };

  return (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} p={2}>
      {popularTypes.map((type) => (
        <motion.div
          key={type.key}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Card
            onClick={() => handleSelect(type)}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              aspectRatio: '1',
              transition: 'all 0.2s ease',
              '&:active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& svg': {
                  fill: 'currentColor',
                },
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <InlinePresetSvg src={type.svgPath} />
            </Box>
            <Typography variant="body2" align="center">
              {type.label}
            </Typography>
          </Card>
        </motion.div>
      ))}
    </Box>
  );
};
