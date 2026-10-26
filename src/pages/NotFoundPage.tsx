import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { MotionPage } from '../components/ui/MotionPage';

export function NotFoundPage() {
  return (
    <MotionPage className="ff-page flex min-h-[62vh] flex-col items-center justify-center text-center">
      <p className="ff-gradient-text text-7xl font-light tracking-[-.06em]">404</p>
      <h1 className="mt-4 text-2xl font-medium text-[var(--ff-text)]">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--ff-text-muted)]">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="ff-btn-primary mt-6"><Home size={18} aria-hidden />Go to Home</Link>
    </MotionPage>
  );
}
