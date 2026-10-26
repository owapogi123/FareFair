import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="ff-footer">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-sm text-[var(--ff-text-muted)]">
          <ShieldCheck size={17} className="text-[var(--ff-accent)]" aria-hidden />
          <span><strong className="font-medium text-[var(--ff-text)]">FareFair PH</strong> · Know the fare. Pay what&apos;s fair.</span>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--ff-text-muted)]" aria-label="Footer navigation">
          <Link to="/sources" className="hover:text-[var(--ff-accent-soft)]">Sources &amp; Proof</Link>
          <Link to="/how-it-works" className="hover:text-[var(--ff-accent-soft)]">How It Works</Link>
          <Link to="/report" className="hover:text-[var(--ff-accent-soft)]">Report Overcharge</Link>
        </nav>
      </div>
    </footer>
  );
}
