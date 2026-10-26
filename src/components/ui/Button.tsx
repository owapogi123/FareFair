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

interface ButtonProps extends MotionCompatibleButtonAttributes {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: ReactNode;
}

export function Button({ variant = 'primary', icon, className = '', children, type = 'button', ...props }: ButtonProps) {
  const variantClass = variant === 'secondary' ? 'ff-btn-secondary' : variant === 'ghost' ? 'ff-btn-ghost' : 'ff-btn-primary';
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      className={`${variantClass} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}
