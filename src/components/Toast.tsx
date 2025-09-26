import { useEffect } from 'react';

type ToastVariant = 'error' | 'info';

type ToastProps = {
  open: boolean;
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
  duration?: number;
};

export function Toast({
  open,
  message,
  onClose,
  variant = 'error',
  duration = 2200,
}: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const scheduler =
      typeof window !== 'undefined' && typeof window.setTimeout === 'function'
        ? window.setTimeout
        : setTimeout;
    const clear =
      typeof window !== 'undefined' && typeof window.clearTimeout === 'function'
        ? window.clearTimeout
        : clearTimeout;
    const timeout = scheduler(onClose, duration) as ReturnType<typeof setTimeout>;
    return () => clear(timeout);
  }, [duration, onClose, open]);

  if (!open) {
    return null;
  }

  const baseClasses =
    variant === 'error'
      ? 'from-rose-500/80 to-pink-500/70 border-rose-400/40'
      : 'from-amber-500/70 to-violet-500/60 border-amber-300/30';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur bg-gradient-to-r ${baseClasses}`}
    >
      {message}
    </div>
  );
}
