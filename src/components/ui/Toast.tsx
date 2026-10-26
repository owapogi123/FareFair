import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ open, message, onClose, duration = 3600 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, onClose, duration]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="fixed bottom-5 left-1/2 z-[80] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-[var(--ff-border-strong)] bg-[rgba(79,7,21,.94)] px-4 py-3 text-sm text-[var(--ff-text)] shadow-2xl backdrop-blur-xl"
        >
          <CheckCircle2 size={19} className="shrink-0 text-[var(--ff-accent-soft)]" aria-hidden />
          <span className="flex-1">{message}</span>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--ff-text-muted)] hover:bg-white/5" aria-label="Dismiss notification">
            <X size={16} aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
