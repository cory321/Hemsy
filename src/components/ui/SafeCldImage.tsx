'use client';

import { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
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
 * A safe Cloudinary image component that handles errors gracefully
 * Uses Next.js Image component directly with Cloudinary URLs to avoid console errors
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Build Cloudinary URL
  useEffect(() => {
    if (!src) {
      setHasError(true);
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error(
        '[SafeCldImage] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set'
      );
      setHasError(true);
      return;
    }

    // Build the Cloudinary URL with auto format and quality
    const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;
    const transformations = 'f_auto,q_auto';
    const fullUrl = `${baseUrl}/${transformations}/${src}`;

    setImageUrl(fullUrl);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (mountedRef.current) {
      setHasError(true);
      onError?.();
    }
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

  // Show fallback if there's an error or no URL
  if (hasError || !imageUrl) {
    return renderFallback();
  }

  // For fill mode
  if (fill) {
    return (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          style={{ objectFit: 'cover', ...style }}
          sizes={sizes || '100vw'}
          onError={handleError}
          unoptimized // Use Cloudinary's optimization instead of Next.js
        />
      </Box>
    );
  }

  // For fixed dimensions
  if (width && height) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        style={style}
        sizes={sizes}
        onError={handleError}
        unoptimized // Use Cloudinary's optimization instead of Next.js
      />
    );
  }

  // If neither fill nor width/height are provided, show fallback
  return renderFallback();
}
