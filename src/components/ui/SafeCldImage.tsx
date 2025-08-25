'use client';

import { useState, useEffect } from 'react';
import { CldImage } from 'next-cloudinary';
import { Box } from '@mui/material';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { getPresetIconUrl } from '@/utils/presetIcons';

interface SafeCldImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  sizes?: string;
  fallbackIconKey?: string | null | undefined;
  fallbackIconColor?: string | null | undefined;
  onError?: () => void;
}

/**
 * A wrapper around CldImage that handles errors gracefully
 * Falls back to preset icon when Cloudinary image fails to load
 */
export default function SafeCldImage({
  src,
  alt,
  fill,
  width,
  height,
  style,
  sizes,
  fallbackIconKey,
  fallbackIconColor,
  onError,
}: SafeCldImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const handleError = () => {
    console.warn(`[SafeCldImage] Failed to load Cloudinary image: ${src}`);
    setHasError(true);
    onError?.();
  };

  // Render fallback component
  const renderFallback = () => {
    // If we have a fallback icon, show it
    if (fallbackIconKey) {
      const iconUrl = getPresetIconUrl(fallbackIconKey);
      if (iconUrl) {
        return (
          <Box
            sx={{
              width: fill ? '100%' : width,
              height: fill ? '100%' : height,
              position: fill ? 'absolute' : 'relative',
              inset: fill ? 0 : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
            }}
            style={style}
          >
            <InlinePresetSvg
              src={iconUrl}
              fillColor={fallbackIconColor || '#9e9e9e'}
              style={{
                width: '60%',
                height: '60%',
                maxWidth: 200,
                maxHeight: 200,
              }}
            />
          </Box>
        );
      }
    }

    // Default fallback
    return (
      <Box
        sx={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          position: fill ? 'absolute' : 'relative',
          inset: fill ? 0 : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
        }}
        style={style}
      >
        <InlinePresetSvg
          src="/presets/garments/tops/shirt.svg"
          fillColor="#9e9e9e"
          style={{
            width: '60%',
            height: '60%',
            maxWidth: 200,
            maxHeight: 200,
          }}
        />
      </Box>
    );
  };

  // Check for invalid src
  if (!src) {
    return renderFallback();
  }

  // Show fallback if there's an error
  if (hasError) {
    return renderFallback();
  }

  // Show the CldImage component with error handling
  if (fill) {
    return (
      <CldImage
        src={src}
        alt={alt}
        fill={true}
        style={style}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  // Width and height variant
  if (width && height) {
    return (
      <CldImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={style}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  // If neither fill nor width/height are provided, show fallback
  return renderFallback();
}
