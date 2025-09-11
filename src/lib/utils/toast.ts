/**
 * Consolidated toast utility using react-hot-toast
 * All toast notifications in the app should use this utility for consistency
 */

import { toast as hotToast } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

export interface ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast (success, error, loading, info)
 * @param options - Additional options for positioning and duration
 */
export const showToast = (
  message: string,
  type: ToastType = 'success',
  options: ToastOptions = {}
) => {
  const toastOptions = {
    duration: options.duration || 4000,
    position: options.position || ('top-center' as const),
  };

  switch (type) {
    case 'success':
      return hotToast.success(message, toastOptions);
    case 'error':
      return hotToast.error(message, toastOptions);
    case 'loading':
      return hotToast.loading(message, toastOptions);
    case 'info':
      return hotToast(message, toastOptions);
    default:
      return hotToast(message, toastOptions);
  }
};

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss specific toast
 */
export const dismissToast = (toastId?: string) => {
  if (toastId) {
    hotToast.dismiss(toastId);
  } else {
    hotToast.dismiss();
  }
};

/**
 * Show a success toast
 */
export const showSuccessToast = (message: string, options?: ToastOptions) =>
  showToast(message, 'success', options);

/**
 * Show an error toast
 */
export const showErrorToast = (message: string, options?: ToastOptions) =>
  showToast(message, 'error', options);

/**
 * Show a loading toast
 */
export const showLoadingToast = (message: string, options?: ToastOptions) =>
  showToast(message, 'loading', options);

/**
 * Show an info toast
 */
export const showInfoToast = (message: string, options?: ToastOptions) =>
  showToast(message, 'info', options);

// Re-export the original toast for direct usage if needed
export { hotToast as toast };
