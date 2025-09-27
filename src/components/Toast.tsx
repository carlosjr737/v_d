import { useEffect } from 'react';

export type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
};

export function Toast({ open, message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = setTimeout(onClose, duration);

    return () => {
      clearTimeout(timeout);
    };
  }, [duration, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
      {message}
    </div>
  );
}

export default Toast;
