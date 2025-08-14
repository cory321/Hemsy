'use client';

import React from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export interface PastelColorPickerProps {
  value?: string;
  onChange: (hex: string | null) => void;
  colors?: string[];
  categories?: PastelPaletteCategory[];
  columns?: number;
  swatchSize?: number;
  includeNone?: boolean;
  ariaLabel?: string;
}

export interface PastelPaletteCategory {
  label: string;
  colors: string[];
}

export const DEFAULT_GROUPED_PASTELS: PastelPaletteCategory[] = [
  {
    label: 'Reds & Pinks',
    colors: [
      '#F28B82',
      '#FF7961',
      '#FDBFB3',
      '#F8BBD0',
      '#FFA6C9',
      '#F49AC2',
      '#C982B0',
      '#E68FAC',
    ],
  },
  {
    label: 'Oranges & Corals',
    colors: [
      '#FF9E80',
      '#FFA07A',
      '#FFD180',
      '#FFBD66',
      '#FCD35D',
      '#E6A57E',
      '#FFDAB9',
      '#FFB6A5',
    ],
  },
  {
    label: 'Yellows',
    colors: [
      '#FED85D',
      '#FFF59D',
      '#FFFF99',
      '#FFFF66',
      '#F6FF7F',
      '#FAE7B5',
      '#E6C15A',
      '#FFCC66',
    ],
  },
  {
    label: 'Greens',
    colors: [
      '#B9F6CA',
      '#B2EC5D',
      '#CCFF00',
      '#C5E1A5',
      '#C8E6C9',
      '#87A96B',
      '#9CCC65',
      '#8FC1A9',
    ],
  },
  {
    label: 'Teals & Turquoises',
    colors: ['#A5F2E9', '#66E0CC', '#9FE2BF', '#9AD4C1'],
  },
  {
    label: 'Blues',
    colors: [
      '#87CEEB',
      '#A7D8F0',
      '#AECBFA',
      '#BBDEFB',
      '#9EB3C2',
      '#6E7FA0',
      '#5C6B8A',
      '#8D99AE',
    ],
  },
  {
    label: 'Purples & Violets',
    colors: [
      '#A5B4FC',
      '#B39DDB',
      '#CE93D8',
      '#C9A0DC',
      '#DDA0DD',
      '#9F8BCB',
      '#F8A1D1',
      '#E6E6FA',
    ],
  },
  {
    label: 'Browns & Neutrals',
    colors: [
      '#E6CCB2',
      '#EDC9AF',
      '#9F8170',
      '#D1A46D',
      '#BCAAA4',
      '#EFA082',
      '#9E7C61',
      '#DA8A67',
    ],
  },
  {
    label: 'Grays, Black & White',
    colors: [
      '#DCD9D2',
      '#C0C0C0',
      '#4A4A4A',
      '#FFF8E1',
      '#FFFFFF',
      '#DCDCDC',
      '#BDBDBD',
      '#9E9E9E',
      '#757575',
      '#616161',
      '#424242',
    ],
  },
  {
    label: 'Skin / Nude Tones',
    colors: [
      '#FBE8D3',
      '#EED3B6',
      '#E6C3A5',
      '#D2A679',
      '#C79A6A',
      '#A36F4B',
      '#8D5524',
      '#704214',
    ],
  },
  {
    label: 'Earthy Textiles / Workwear',
    colors: [
      '#C3B091',
      '#6B8E23',
      '#B66A50',
      '#4E4036',
      '#708090',
      '#8F9779',
      '#7D7461',
    ],
  },
  {
    label: 'Metallics (approximate)',
    colors: ['#D4AF37', '#E6B7A9', '#F7E7CE', '#8E8E8E'],
  },
  {
    label: 'Utility / Brand-oriented',
    colors: ['#FF8C42', '#8E3B46', '#2A9D8F', '#264653'],
  },
];

const DEFAULT_PASTELS: string[] = [
  // Reds & Pinks
  '#F28B82', // Pastel Red
  '#FF7961', // Pastel Scarlet
  '#FDBFB3', // Pastel Melon
  '#F8BBD0', // Pastel Pink Flamingo
  '#FFA6C9', // Pastel Carnation Pink
  '#F49AC2', // Pastel Magenta
  '#C982B0', // Pastel Red Violet
  '#E68FAC', // Pastel Cerise

  // Oranges & Corals
  '#FF9E80', // Pastel Red Orange
  '#FFA07A', // Pastel Sunset Orange
  '#FFD180', // Pastel Orange
  '#FFBD66', // Pastel Macaroni & Cheese
  '#FCD35D', // Pastel Goldenrod
  '#E6A57E', // Pastel Burnt Orange
  '#FFDAB9', // Pastel Peach
  '#FFB6A5', // Pastel Salmon

  // Yellows
  '#FED85D', // Pastel Dandelion
  '#FFF59D', // Pastel Yellow
  '#FFFF99', // Pastel Canary
  '#FFFF66', // Pastel Unmellow Yellow
  '#F6FF7F', // Pastel Laser Lemon
  '#FAE7B5', // Pastel Banana Mania
  '#E6C15A', // Pastel Gold
  '#FFCC66', // Pastel Sunglow

  // Greens
  '#B9F6CA', // Pastel Spring Green
  '#B2EC5D', // Pastel Inchworm
  '#CCFF00', // Pastel Electric Lime
  '#C5E1A5', // Pastel Yellow Green
  '#C8E6C9', // Pastel Green
  '#87A96B', // Pastel Asparagus
  '#9CCC65', // Pastel Forest Green
  '#8FC1A9', // Pastel Pine Green

  // Teals & Turquoises
  '#A5F2E9', // Pastel Aquamarine
  '#66E0CC', // Pastel Caribbean Green
  '#9FE2BF', // Pastel Sea Green
  '#9AD4C1', // Pastel Jungle Green

  // Blues
  '#87CEEB', // Pastel Sky Blue
  '#A7D8F0', // Pastel Cerulean
  '#AECBFA', // Pastel Cornflower
  '#BBDEFB', // Pastel Blue
  '#9EB3C2', // Pastel Denim
  '#6E7FA0', // Pastel Navy
  '#5C6B8A', // Pastel Midnight Blue
  '#8D99AE', // Pastel Manatee

  // Purples & Violets
  '#A5B4FC', // Pastel Blue Violet
  '#B39DDB', // Pastel Purple Heart
  '#CE93D8', // Pastel Violet
  '#C9A0DC', // Pastel Wisteria
  '#DDA0DD', // Pastel Plum
  '#9F8BCB', // Pastel Royal Purple
  '#F8A1D1', // Pastel Fuchsia
  '#E6E6FA', // Pastel Lavender

  // Browns & Neutrals
  '#E6CCB2', // Pastel Tan
  '#EDC9AF', // Pastel Desert Sand
  '#9F8170', // Pastel Beaver
  '#D1A46D', // Pastel Raw Sienna
  '#BCAAA4', // Pastel Brown
  '#EFA082', // Pastel Burnt Sienna
  '#9E7C61', // Pastel Sepia
  '#DA8A67', // Pastel Copper

  // Grays, Black & White
  '#DCD9D2', // Pastel Timberwolf
  '#C0C0C0', // Pastel Silver
  '#4A4A4A', // Pastel Black
  '#FFF8E1', // Off-white cream
  '#FFFFFF', // Pure White

  // Skin / Nude Tones (light to deep)
  '#FBE8D3', // Light Almond
  '#EED3B6', // Warm Beige
  '#E6C3A5', // Sand
  '#D2A679', // Tan
  '#C79A6A', // Honey
  '#A36F4B', // Toffee
  '#8D5524', // Cocoa
  '#704214', // Espresso

  // Earthy Textiles / Workwear
  '#C3B091', // Khaki
  '#6B8E23', // Olive Drab
  '#B66A50', // Clay
  '#4E4036', // Charcoal Brown
  '#708090', // Slate
  '#8F9779', // Sage Olive
  '#7D7461', // Taupe Olive

  // Metallics (approximate, non-metallic)
  '#D4AF37', // Gold
  '#E6B7A9', // Rose Gold
  '#F7E7CE', // Champagne
  '#8E8E8E', // Pewter

  // Utility / Brand-oriented
  '#FF8C42', // Safety Orange (muted)
  '#8E3B46', // Pastel Maroon
  '#2A9D8F', // Teal Utility
  '#264653', // Deep Teal/Navy

  // Additional Grays (steps)
  '#DCDCDC',
  '#BDBDBD',
  '#9E9E9E',
  '#757575',
  '#616161',
  '#424242',
];

export function PastelColorPicker({
  value,
  onChange,
  colors = DEFAULT_PASTELS,
  categories,
  columns = 8,
  swatchSize = 32,
  includeNone = false,
  ariaLabel = 'pastel color picker',
}: PastelColorPickerProps) {
  const handleSelect = (hex: string) => {
    onChange(hex);
  };

  const handleClear = () => {
    onChange(null);
  };

  const gap = 8;

  const renderSwatches = (swatches: string[]) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, ${swatchSize}px)`,
        gap: `${gap}px`,
      }}
    >
      {includeNone && (
        <ButtonBase
          key="pastel-swatch-none"
          aria-label="no color"
          onClick={handleClear}
          sx={{
            width: swatchSize,
            height: swatchSize,
            borderRadius: 1,
            border: '2px dashed',
            borderColor: 'divider',
            position: 'relative',
            backgroundColor: 'transparent',
          }}
          data-testid="pastel-swatch-none"
        />
      )}
      {swatches.map((hex, index) => {
        const isSelected = value?.toLowerCase() === hex.toLowerCase();
        return (
          <ButtonBase
            key={`${hex}-${index}`}
            aria-label={`select color ${hex}`}
            onClick={() => handleSelect(hex)}
            sx={{
              width: swatchSize,
              height: swatchSize,
              borderRadius: 1,
              position: 'relative',
              backgroundColor: hex,
              border: isSelected ? '2px solid' : '2px solid rgba(0,0,0,0.08)',
              borderColor: isSelected ? 'primary.main' : 'rgba(0,0,0,0.08)',
              boxShadow: isSelected ? 2 : 0,
            }}
            data-testid={`pastel-swatch-${hex}`}
          >
            {isSelected && (
              <Box
                sx={{
                  position: 'absolute',
                  right: 4,
                  bottom: 4,
                  color: 'primary.main',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-hidden
              >
                <CheckIcon sx={{ fontSize: 14 }} />
              </Box>
            )}
          </ButtonBase>
        );
      })}
    </Box>
  );

  return (
    <Box role="group" aria-label={ariaLabel} sx={{ display: 'inline-block' }}>
      {categories && categories.length > 0 ? (
        <Stack spacing={2}>
          {categories.map((cat) => (
            <Box key={cat.label}>
              <Typography variant="overline" color="text.secondary">
                {cat.label}
              </Typography>
              {renderSwatches(cat.colors)}
            </Box>
          ))}
        </Stack>
      ) : (
        renderSwatches(colors)
      )}
    </Box>
  );
}

export const pastelPalette = DEFAULT_PASTELS;

export default PastelColorPicker;
