'use client';

import React from 'react';
import { Box, ButtonBase, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

export interface PastelColorPickerProps {
  value?: string;
  onChange: (hex: string | null) => void;
  colors?: string[];
  columns?: number;
  swatchSize?: number;
  includeNone?: boolean;
  ariaLabel?: string;
}

const DEFAULT_PASTELS: string[] = [
  // Pinks & Reds
  '#F8BBD0',
  '#F48FB1',
  '#FFCDD2',
  '#EF9A9A',
  // Oranges & Yellows
  '#FFE0B2',
  '#FFCC80',
  '#FFF9C4',
  '#FFF59D',
  // Greens
  '#DCEDC8',
  '#C5E1A5',
  '#B2DFDB',
  '#A5D6A7',
  // Blues
  '#BBDEFB',
  '#90CAF9',
  '#B3E5FC',
  '#81D4FA',
  // Purples
  '#E1BEE7',
  '#CE93D8',
  '#D1C4E9',
  '#B39DDB',
  // Neutrals
  '#F5F5F5',
  '#E0E0E0',
  '#D7CCC8',
  '#CFD8DC',
];

export function PastelColorPicker({
  value,
  onChange,
  colors = DEFAULT_PASTELS,
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

  return (
    <Box role="group" aria-label={ariaLabel} sx={{ display: 'inline-block' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${swatchSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {includeNone && (
          <Tooltip title="No color">
            <ButtonBase
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
          </Tooltip>
        )}

        {colors.map((hex) => {
          const isSelected = value?.toLowerCase() === hex.toLowerCase();
          return (
            <Tooltip title={hex} key={hex}>
              <ButtonBase
                aria-label={`select color ${hex}`}
                onClick={() => handleSelect(hex)}
                sx={{
                  width: swatchSize,
                  height: swatchSize,
                  borderRadius: 1,
                  position: 'relative',
                  backgroundColor: hex,
                  border: isSelected
                    ? '2px solid'
                    : '2px solid rgba(0,0,0,0.08)',
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
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

export const pastelPalette = DEFAULT_PASTELS;

export default PastelColorPicker;
