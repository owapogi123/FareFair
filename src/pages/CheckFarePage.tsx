import { FareChecker } from '../components/fare/FareChecker';
import { MotionPage } from '../components/ui/MotionPage';

export function CheckFarePage() {
  return (
    <MotionPage className="ff-page ff-page-narrow">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Fare checker</p>
        <h1 className="ff-page-title mt-1">Check My Fare</h1>
        <p className="ff-page-subtitle">Answer a few simple questions and compare what you paid with the best verified fare data available.</p>
      </header>
      <FareChecker />
    </MotionPage>
  );
}
