import { Link, NavLink, useLocation } from 'react-router-dom';
import { LogIn, Menu, ShieldCheck } from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import { useState } from 'react';
import { MoreMenu } from './MoreMenu';

const desktopItems = [
  { to: '/', label: 'Home', exact: true },
  { to: '/check-fare', label: 'Check My Fare', exact: false },
  { to: '/routes', label: 'Find My Route', exact: false },
  { to: '/discounts', label: 'Discounts', exact: false },
  { to: '/tourist-prices', label: 'Tourist Prices', exact: false },
  { to: '/report', label: 'Report Overcharge', exact: false },
  { to: '/sources', label: 'Sources & Proof', exact: false },
  { to: '/how-it-works', label: 'How It Works', exact: false },
];

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--ff-border)] bg-[var(--ff-nav-bg)] backdrop-blur-2xl lg:hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5" aria-label="FareFair home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ff-primary)]">
              <ShieldCheck size={19} className="text-white" aria-hidden />
            </span>
            <span>
              <span className="block text-[15px] font-semibold tracking-tight text-[var(--ff-text)]">FareFair</span>
              <span className="block text-[10px] font-medium tracking-[0.18em] text-[var(--ff-accent)]">PH</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="ff-btn-primary !min-h-0 !px-3.5 !py-2 text-[13px]"
            >
              <LogIn size={15} aria-hidden />
              Login
            </Link>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-text)] transition-colors hover:border-[var(--ff-border-strong)] hover:bg-[var(--ff-tint)]"
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
            >
              <Menu size={21} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <MoreMenu isOpen={moreOpen} onClose={() => setMoreOpen(false)} activePath={location.pathname} />
    </>
  );
}

export function DesktopNavigation() {
  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 hidden border-b border-[var(--ff-border)] bg-[var(--ff-nav-bg)] backdrop-blur-2xl lg:block"
      style={{ height: 'var(--ff-nav-height)' }}
    >
      <div className="mx-auto flex h-full w-full max-w-[1180px] items-center gap-5 px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="FareFair home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ff-primary)]">
            <ShieldCheck size={18} className="text-white" aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--ff-text)]">FareFair <span className="text-xs font-medium text-[var(--ff-accent)]">PH</span></span>
        </Link>

        <LayoutGroup id="desktop-nav">
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-0.5" aria-label="Main navigation">
            {desktopItems.map(({ to, label, exact }) => (
              <NavLink key={to} to={to} end={exact} className="group relative rounded-xl px-2.5 py-2 text-[13px] font-medium whitespace-nowrap">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="desktop-active-pill"
                        className="absolute inset-0 -z-10 rounded-xl bg-[var(--ff-tint)]"
                        transition={{ type: 'spring', stiffness: 430, damping: 34 }}
                      />
                    )}
                    <span className={`relative transition-colors ${isActive ? 'text-[var(--ff-text)]' : 'text-[var(--ff-text-muted)] hover:text-[var(--ff-text)]'}`}>
                      {label}
                      <span className={`absolute -bottom-1 left-1/2 h-px -translate-x-1/2 bg-[var(--ff-accent)] transition-all ${isActive ? 'w-4 opacity-100' : 'w-0 opacity-0 group-hover:w-4'}`} />
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </LayoutGroup>

        <Link
          to="/login"
          className="ff-btn-primary !min-h-0 !px-4 !py-2 text-[13px]"
        >
          <LogIn size={15} aria-hidden />
          Login
        </Link>
      </div>
    </header>
  );
}