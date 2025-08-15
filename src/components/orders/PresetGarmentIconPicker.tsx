'use client';

import { useMemo } from 'react';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl, presetCatalog } from '@/utils/presetIcons';

export type PresetIconKey = string; // use shared key format from utils

export function usePresetCatalog() {
  return useMemo(() => presetCatalog, []);
}

export default function PresetGarmentIconPicker({
  value,
  onChange,
}: {
  value?: PresetIconKey;
  onChange: (key: PresetIconKey | undefined) => void;
}) {
  const categories = usePresetCatalog();

  return (
    <Stack spacing={2}>
      {categories.map((cat) => (
        <Box key={cat.id}>
          <Typography variant="overline" color="text.secondary">
            {cat.label}
          </Typography>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {cat.items.map((item) => {
              const isSelected = value === item.key;
              return (
                <Grid item xs={6} sm={4} md={3} key={item.key}>
                  <Card
                    variant="outlined"
                    sx={(theme) => ({
                      borderColor: isSelected ? 'primary.main' : undefined,
                      bgcolor: isSelected ? 'action.selected' : undefined,
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
                      '@media (prefers-reduced-motion: reduce)': {
                        transition:
                          'border-color 160ms ease-out, background-color 160ms ease-out',
                        '&:hover': { transform: 'none', boxShadow: 2 },
                      },
                    })}
                  >
                    <CardActionArea
                      onClick={() => onChange(item.key)}
                      sx={(theme) => ({
                        '&:focus-visible': {
                          outline: `3px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        },
                      })}
                    >
                      <CardContent>
                        <Stack spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 72,
                              height: 72,
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 1,
                              bgcolor: 'background.default',
                              p: 1,
                              position: 'relative',
                            }}
                          >
                            {(() => {
                              const url = getPresetIconUrl(item.key);
                              return url ? <InlinePresetSvg src={url} /> : null;
                            })()}
                          </Box>
                          <Typography variant="body2" textAlign="center">
                            {item.label}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </Stack>
  );
}
