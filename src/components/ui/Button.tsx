import type { ButtonHTMLAttributes, ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';
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
  asChild?: boolean;
}

export function Button({
  variant = 'primary',
  icon,
  className = '',
  children,
  type = 'button',
  asChild = false,
  ...props
}: ButtonProps) {
  const variantClass = variant === 'secondary' ? 'ff-btn-secondary' : variant === 'ghost' ? 'ff-btn-ghost' : 'ff-btn-primary';

  if (asChild && typeof children === 'object' && children !== null && 'props' in children) {
    const child = children as React.ReactElement<any>;
    const childType = child.type as ElementType;
    const childProps = child.props as ComponentPropsWithoutRef<typeof childType>;
    return React.cloneElement(child, {
      ...childProps,
      className: `${variantClass} ${className} ${childProps.className || ''}`,
      whileTap: { scale: 0.97 },
    } as any);
  }

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

import React from 'react';
