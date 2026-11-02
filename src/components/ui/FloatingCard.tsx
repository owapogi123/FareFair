'use client';

import { motion, useReducedMotion, useMotionValue, useSpring } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { useState } from 'react';

interface FloatingCardAProps {
  title: string;
  metric: string;
  detail: string;
  isMobile: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

export function FloatingCardA({ title, metric, detail, isMobile, anchorRef }: FloatingCardAProps) {
  const reduceMotion = useReducedMotion();
  const y = useMotionValue(0);
  const springY = useSpring(y, { stiffness: 300, damping: 30, mass: 0.5 });

  if (isMobile) {
    return (
      <motion.div
        className="w-full max-w-[360px] mx-auto px-4"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="ff-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-[var(--ff-text-muted)] uppercase tracking-wide">Minimum Fare</p>
              <p className="mt-1 text-2xl font-bold text-[var(--ff-text)] tabular-nums">{title}</p>
              <p className="mt-1 text-sm text-[var(--ff-text-muted)]">{detail}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ff-primary)] text-white">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={anchorRef}
      className="fixed z-20 w-[220px] pointer-events-auto"
      style={{ willChange: 'transform', y: springY }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="ff-card p-4 ff-card-hover">
        <p className="text-xs font-medium text-[var(--ff-text-muted)] uppercase tracking-wide">{metric}</p>
        <p className="mt-1 text-xl font-bold text-[var(--ff-text)] tabular-nums">{title}</p>
        <p className="mt-1.5 text-sm text-[var(--ff-text-muted)]">{detail}</p>
      </div>
    </motion.div>
  );
}

interface FloatingCardBProps {
  title: string;
  rating: number;
  metric1: string;
  metric2: string;
  detail: string;
  isMobile: boolean;
  anchorRef?: React.RefObject<HTMLDivElement | null>;
}

export function FloatingCardB({ title, rating, metric1, metric2, detail, isMobile, anchorRef }: FloatingCardBProps) {
  const reduceMotion = useReducedMotion();
  const y = useMotionValue(0);
  const springY = useSpring(y, { stiffness: 300, damping: 30, mass: 0.5 });

  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  if (isMobile) {
    return (
      <motion.div
        className="w-full max-w-[360px] mx-auto px-4"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="ff-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--ff-text-muted)] uppercase tracking-wide">{title}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {stars.map((n) => (
                    <Star key={n} size={14} className={n <= Math.round(rating) ? 'fill-current text-amber-500' : 'text-[var(--ff-border)]'} />
                  ))}
                </div>
                <span className="text-sm font-medium text-[var(--ff-text)]">{rating.toFixed(1)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-lg font-bold text-[var(--ff-text)] tabular-nums">{metric1}</p>
                  <p className="text-xs text-[var(--ff-text-muted)]">Accuracy</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[var(--ff-text)] tabular-nums">{metric2}</p>
                  <p className="text-xs text-[var(--ff-text-muted)]">Verified routes</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[var(--ff-text-muted)]">{detail}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={anchorRef}
      className="fixed z-20 w-[290px] pointer-events-auto"
      style={{ willChange: 'transform', y: springY }}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="ff-card p-4 ff-card-hover">
        <p className="text-xs font-medium text-[var(--ff-text-muted)] uppercase tracking-wide">{title}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-0.5">
            {stars.map((n) => (
              <Star key={n} size={14} className={n <= Math.round(rating) ? 'fill-current text-amber-500' : 'text-[var(--ff-border)]'} />
            ))}
          </div>
          <span className="text-sm font-medium text-[var(--ff-text)]">{rating.toFixed(1)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-lg font-bold text-[var(--ff-text)] tabular-nums">{metric1}</p>
            <p className="text-xs text-[var(--ff-text-muted)]">Accuracy</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--ff-text)] tabular-nums">{metric2}</p>
            <p className="text-xs text-[var(--ff-text-muted)]">Verified</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--ff-text-muted)]">{detail}</p>
      </div>
    </motion.div>
  );
}

/* ---------- Connector Line (Desktop only) ---------- */
interface ConnectorLineProps {
  fromRef: React.RefObject<HTMLDivElement | null>;
  toRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
}

export function ConnectorLine({ fromRef, toRef, isVisible }: ConnectorLineProps) {
  const reduceMotion = useReducedMotion();
  const [path, setPath] = useState('');

  useGSAP(() => {
    if (reduceMotion || !isVisible) return;

    const updatePath = () => {
      if (!fromRef.current || !toRef.current) return;
      const fromRect = fromRef.current.getBoundingClientRect();
      const toRect = toRef.current.getBoundingClientRect();

      const fromX = fromRect.left + fromRect.width / 2;
      const fromY = fromRect.top + fromRect.height / 2;
      const toX = toRect.left + toRect.width / 2;
      const toY = toRect.top + toRect.height / 2;

      const midX = (fromX + toX) / 2;
      const midY = Math.min(fromY, toY) - 30;

      setPath(`M${fromX},${fromY} Q${midX},${midY} ${toX},${toY}`);
    };

    updatePath();
    const ro = new ResizeObserver(updatePath);
    ro.observe(document.body);
    window.addEventListener('scroll', updatePath, { passive: true });
    window.addEventListener('resize', updatePath);

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', updatePath);
      window.removeEventListener('resize', updatePath);
    };
  }, [isVisible, reduceMotion]);

  if (!isVisible || reduceMotion || !path) return null;

  return (
    <svg className="fixed inset-0 z-10 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      <path
        d={path}
        stroke="var(--ff-accent)"
        strokeWidth={2}
        fill="none"
        strokeDasharray="8 4"
        opacity={0.6}
        style={{ filter: 'drop-shadow(0 2px 4px rgba(179,32,58,0.2))' }}
      />
    </svg>
  );
}