import { showToast } from '@/lib/utils/toast';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = (props: ToastProps) => {
    const message = `${props.title || 'Notification'}${props.description ? ': ' + props.description : ''}`;

    if (props.variant === 'destructive') {
      return showToast(message, 'error');
    } else {
      return showToast(message, 'success');
    }
  };

  return { toast };
}
