'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className = '' }: ScrollProgressProps) {
  useGSAP(() => {
    const progressBar = document.querySelector('.scroll-progress-bar') as HTMLElement;
    if (!progressBar) return;

    const ctx = ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progressBar.style.width = `${self.progress * 100}%`;
      },
    });

    return () => ctx.kill();
  }, []);

  return (
    <div className={`fixed top-0 left-0 z-[80] h-1 w-full bg-transparent ${className}`} aria-hidden="true">
      <motion.div
        className="scroll-progress-bar h-full bg-[var(--ff-accent)] origin-left"
        style={{ transformOrigin: 'left center' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  );
}