// ============================================================================
// LCP OPTIMIZATION UTILITIES
// ============================================================================
//
// Based on web.dev LCP guide: https://web.dev/articles/lcp
// Target: Reduce LCP from 2.69s to under 2.5s
//
// Key strategies:
// 1. Preload critical resources
// 2. Optimize images and fonts
// 3. Reduce render-blocking resources
// 4. Improve server response times
// ============================================================================

/**
 * Critical resource preloading for LCP optimization
 * Call this in the document head for maximum impact
 */
export function generateCriticalResourcePreloads() {
  return [
    // Preload critical fonts
    {
      rel: 'preload',
      href: '/fonts/roboto-v30-latin-regular.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/fonts/roboto-v30-latin-500.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    // Preload critical CSS (Material-UI)
    {
      rel: 'preload',
      href: '/_next/static/css/app/layout.css',
      as: 'style',
    },
  ];
}

/**
 * Optimized image loading props for LCP candidates
 */
export const LCP_IMAGE_PROPS = {
  // For hero images or above-the-fold content
  priority: true,
  loading: 'eager' as const,
  fetchPriority: 'high' as const,
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
};

/**
 * Non-critical image loading props
 */
export const STANDARD_IMAGE_PROPS = {
  priority: false,
  loading: 'lazy' as const,
  fetchPriority: 'auto' as const,
  sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
};

/**
 * Check if element is likely to be LCP candidate
 */
export function isLikelyLCPCandidate(
  elementType: 'image' | 'text-block' | 'video',
  position: 'above-fold' | 'below-fold'
) {
  return elementType === 'image' && position === 'above-fold';
}
