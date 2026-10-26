import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface InfoAccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function InfoAccordion({ title, children, defaultOpen = false, className = '' }: InfoAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] ${className}`}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-[var(--ff-text)] transition-colors hover:bg-[rgba(120,23,40,.14)]"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium">{title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: .2 }} className="text-[var(--ff-text-muted)]">
          <ChevronDown size={18} aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} className="overflow-hidden">
            <div className="border-t border-[var(--ff-border)] px-4 pb-4 pt-3 text-[var(--ff-text)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
