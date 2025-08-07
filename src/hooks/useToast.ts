import { toast } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'loading' | 'custom';

export const useToast = () => {
  const showToast = (
    message: string,
    type: ToastType = 'success',
    options?: {
      duration?: number;
      position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
    }
  ) => {
    const toastOptions = {
      duration: options?.duration || 4000,
      position: options?.position || ('top-right' as const),
    };

    switch (type) {
      case 'success':
        return toast.success(message, toastOptions);
      case 'error':
        return toast.error(message, toastOptions);
      case 'loading':
        return toast.loading(message, toastOptions);
      default:
        return toast(message, toastOptions);
    }
  };

  const dismissToast = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  return {
    showToast,
    dismissToast,
  };
};
