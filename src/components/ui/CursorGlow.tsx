import { useEffect, useRef } from 'react';

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!media.matches) return;

    const node = ref.current;
    if (!node) return;

    const move = (event: PointerEvent) => {
      node.style.left = `${event.clientX}px`;
      node.style.top = `${event.clientY}px`;
      node.style.opacity = '1';
    };
    const leave = () => { node.style.opacity = '0'; };

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);

  return <div ref={ref} className="ff-cursor-glow" aria-hidden />;
}
