'use client';

import { useState, useEffect, useRef, SyntheticEvent } from 'react';
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
  console.log('[SafeCldImage] Component rendered with:', {
    src,
    fallbackIconKey,
    fallbackIconColor,
  });

  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const imageRef = useRef<HTMLImageElement | null>(null);

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

    console.log('[SafeCldImage] Built Cloudinary URL:', fullUrl);

    setImageUrl(fullUrl);
    setHasError(false);
  }, [src]);

  // Silently handle errors without logging to console
  const handleError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('[SafeCldImage] Image failed to load:', src);
    // Prevent the error from bubbling up
    e.preventDefault();
    e.stopPropagation();

    if (mountedRef.current) {
      console.log('[SafeCldImage] Setting hasError to true');
      setHasError(true);
      onError?.();
    }

    // Return false to prevent default error handling
    return false;
  };

  // Add global error suppression for this specific image
  useEffect(() => {
    if (!imageRef.current || hasError) return;

    const handleGlobalError = (event: ErrorEvent): boolean | undefined => {
      // Check if the error is related to our Cloudinary image
      if (event.message && event.message.includes(src)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      return undefined;
    };

    window.addEventListener('error', handleGlobalError, true);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
    };
  }, [src, hasError]);

  // Render fallback component
  const renderFallback = () => {
    // Try to use the fallback icon key first
    let iconUrl: string | null = null;
    if (fallbackIconKey) {
      iconUrl = getPresetIconUrl(fallbackIconKey);
      console.log(
        '[SafeCldImage] Fallback icon from key:',
        fallbackIconKey,
        '->',
        iconUrl
      );
    }

    // If no fallback icon key or it didn't resolve, use default
    if (!iconUrl) {
      iconUrl = '/presets/garments/select-garment.svg';
      console.log('[SafeCldImage] Using default fallback icon:', iconUrl);
    }

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
          border: '2px solid red', // Debug border
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
  };

  // Check for invalid src
  if (!src || !imageUrl) {
    console.log('[SafeCldImage] No src or imageUrl, showing fallback');
    return renderFallback();
  }

  // Show fallback if there's an error
  if (hasError) {
    console.log('[SafeCldImage] Rendering fallback for:', src);
    return renderFallback();
  }

  // TEMPORARY: Force fallback for debugging
  if (src.includes('s0tfhef21la9q2pmgysd')) {
    console.log('[SafeCldImage] FORCING fallback for debugging:', src);
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
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            ...style,
          }}
          onError={handleError}
          suppressHydrationWarning
        />
      </Box>
    );
  }

  // For fixed dimensions
  if (width && height) {
    return (
      <img
        ref={imageRef}
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        style={style}
        onError={handleError}
        suppressHydrationWarning
      />
    );
  }

  // If neither fill nor width/height are provided, show fallback
  return renderFallback();
}
