import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type MotionCompatibleButtonAttributes = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
>;

interface ChipProps extends MotionCompatibleButtonAttributes {
  selected?: boolean;
  icon?: ReactNode;
}

export function Chip({ selected = false, icon, className = '', children, ...props }: ChipProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      className={`relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-[var(--ff-accent)] bg-[rgba(120,23,40,.42)] text-[var(--ff-text)] shadow-[0_0_24px_rgba(224,101,90,.15)]'
          : 'border-[var(--ff-border)] bg-[rgba(120,23,40,.10)] text-[var(--ff-text-muted)] hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text)]'
      } ${className}`}
      aria-pressed={selected}
      {...props}
    >
      {selected && (
        <motion.span
          layoutId="ff-chip-selection"
          className="absolute inset-0 -z-10 rounded-full bg-[rgba(224,101,90,.08)]"
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        />
      )}
      {icon}
      <span>{children}</span>
    </motion.button>
  );
}
