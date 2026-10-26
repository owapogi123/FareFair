import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface MotionPageProps {
  children: ReactNode;
  className?: string;
}

export function MotionPage({ children, className = '' }: MotionPageProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
