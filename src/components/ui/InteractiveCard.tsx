import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function InteractiveCard({ children, className = '', delay = 0 }: InteractiveCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`ff-card ff-card-hover ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.24, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
