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
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.warn(`[SafeCldImage] Failed to load Cloudinary image: ${src}`);
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Check if the image exists by attempting to fetch it
  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Construct the Cloudinary URL to check if image exists
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error('[SafeCldImage] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set');
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Use a small transformation to check if image exists
    const checkUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_1,h_1,f_auto/${src}`;
    
    fetch(checkUrl, { method: 'HEAD' })
      .then((response) => {
        if (!response.ok) {
          handleError();
        }
      })
      .catch(() => {
        handleError();
      });
  }, [src]);

    // Show fallback if there's an error
  if (hasError) {
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
  }

  // Show the CldImage component with error handling
  return (
    <>
      {!hasError && fill && (
        <CldImage
          src={src}
          alt={alt}
          fill={true}
          style={style}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
      {!hasError && !fill && width && height && (
        <CldImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={style}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </>
  );
}
