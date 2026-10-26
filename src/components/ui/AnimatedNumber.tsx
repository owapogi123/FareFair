import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number | null | undefined;
  formatter: (value: number | null | undefined) => string;
  duration?: number;
}

export function AnimatedNumber({ value, formatter, duration = 650 }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value ?? 0);
  const previous = useRef(0);

  useEffect(() => {
    if (value == null || reduceMotion) {
      setDisplay(value ?? 0);
      previous.current = value ?? 0;
      return;
    }

    const start = previous.current;
    const end = value;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else previous.current = end;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduceMotion]);

  return <>{formatter(value == null ? value : display)}</>;
}
