import {
  showToast as utilShowToast,
  dismissToast as utilDismissToast,
  ToastType,
} from '@/lib/utils/toast';

export type { ToastType };

export const useToast = () => {
  const showToast = (
    message: string,
    type: ToastType = 'success',
    options?: {
      duration?: number;
      position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
    }
  ) => {
    return utilShowToast(message, type, options);
  };

  const dismissToast = (toastId?: string) => {
    return utilDismissToast(toastId);
  };

  return {
    showToast,
    dismissToast,
  };
};
