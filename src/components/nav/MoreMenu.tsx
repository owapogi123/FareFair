import { NavLink } from 'react-router-dom';
import { X, Home, Info, Calculator, Map, Tag, MapPinned, AlertOctagon, BookOpen, HelpCircle } from 'lucide-react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activePath?: string;
}

const items = [
  { to: '/', label: 'Home', description: 'FareFair overview', icon: Home },
  { to: '/about', label: 'About', description: 'Our mission & team', icon: Info },
  { to: '/check-fare', label: 'Check My Fare', description: 'Compare what you paid', icon: Calculator },
  { to: '/routes', label: 'Find My Route', description: 'Search verified routes', icon: Map },
  { to: '/discounts', label: 'Discounts', description: 'Student, Senior, PWD', icon: Tag },
  { to: '/tourist-prices', label: 'Tourist Prices', description: 'Check prices before visiting', icon: MapPinned },
  { to: '/report', label: 'Report Overcharge', description: 'Save fare problem details', icon: AlertOctagon },
  { to: '/sources', label: 'Sources & Proof', description: 'See where data comes from', icon: BookOpen },
  { to: '/how-it-works', label: 'How It Works', description: 'Understand FareFair', icon: HelpCircle },
];

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = oldOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 36 }}
            className="fixed bottom-0 right-0 top-0 z-[70] w-[min(88vw,390px)] border-l border-[var(--ff-border)] bg-[var(--ff-popover)] shadow-2xl lg:hidden"
          >
            <div className="flex h-full flex-col" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
              <div className="flex items-center justify-between border-b border-[var(--ff-border)] px-5 py-4">
                <div>
                  <p className="font-semibold text-[var(--ff-text)]">Explore FareFair</p>
                  <p className="mt-0.5 text-xs text-[var(--ff-text-muted)]">Everything is one tap away.</p>
                </div>
                <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-text-muted)] hover:text-[var(--ff-text)]" aria-label="Close menu">
                  <X size={19} aria-hidden />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile navigation">
                {items.map(({ to, label, description, icon: Icon }, index) => (
                  <motion.div key={to} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.035 * index }}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      onClick={onClose}
                      className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                        isActive
                          ? 'border-[var(--ff-border-strong)] bg-[var(--ff-tint)]'
                          : 'border-transparent hover:border-[var(--ff-border)] hover:bg-[var(--ff-tint-soft)]'
                      }`}
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isActive ? 'border-[var(--ff-accent)] bg-[var(--ff-glow)] text-[var(--ff-accent)]' : 'border-[var(--ff-border)] text-[var(--ff-text-muted)]'}`}>
                            <Icon size={18} aria-hidden />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-[var(--ff-text)]">{label}</span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--ff-text-muted)]">{description}</span>
                          </span>
                        </>
                      )}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}