import * as React from 'react';

// This is a simplified toast hook for our Connect components
// You can replace this with your preferred toast implementation

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const toast = React.useCallback((props: ToastProps) => {
    // Simple alert-based toast for now
    // Replace with your preferred toast implementation (e.g., react-hot-toast, sonner, etc.)
    const message = `${props.title || 'Notification'}${props.description ? ': ' + props.description : ''}`;

    if (props.variant === 'destructive') {
      alert(`Error: ${message}`);
    } else {
      alert(message);
    }
  }, []);

  return { toast };
}
