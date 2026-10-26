import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Map, ArrowRight, ChevronDown, Route as RouteIcon } from 'lucide-react';
import type { Location, Route } from '../types';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { SearchLocationInput } from '../components/ui/SearchLocationInput';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { MotionPage } from '../components/ui/MotionPage';
import { Button } from '../components/ui/Button';
import { searchRoutes } from '../api/fareApi';

export function RoutesPage() {
  const [origin, setOrigin] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const originSearch = useLocationSearch();
  const destinationSearch = useLocationSearch();

  const handleSearch = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const results = await searchRoutes(origin.id, destination.id);
      setRoutes(results);
    } catch {
      setError('We couldn\'t load route information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotionPage className="ff-page">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Route finder</p>
        <h1 className="ff-page-title mt-1">Find My Route</h1>
        <p className="ff-page-subtitle">Compare available route records from your starting point to your destination.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="ff-card h-fit p-4 sm:p-5" aria-label="Route search">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent-soft)]"><RouteIcon size={18} /></span>
            <div>
              <h2 className="font-medium text-[var(--ff-text)]">Where are you going?</h2>
              <p className="text-xs text-[var(--ff-text-muted)]">Choose both locations to search verified route records.</p>
            </div>
          </div>
          <div className="space-y-4">
            <SearchLocationInput
              label="From"
              value={origin}
              onSelect={setOrigin}
              onSearch={originSearch.search}
              results={originSearch.results}
              loading={originSearch.loading}
              placeholder="Search starting point..."
            />
            <SearchLocationInput
              label="To"
              value={destination}
              onSelect={setDestination}
              onSearch={destinationSearch.search}
              results={destinationSearch.results}
              loading={destinationSearch.loading}
              placeholder="Search destination..."
            />
            <Button
              onClick={handleSearch}
              disabled={!origin || !destination || loading}
              className={`w-full ${(!origin || !destination) ? 'cursor-not-allowed opacity-45' : ''}`}
              icon={<Map size={18} aria-hidden />}
            >
              Find Routes
            </Button>
          </div>
        </section>

        <section aria-live="polite" className="min-w-0">
          {loading && <LoadingState message="Finding routes..." />}
          {error && <ErrorState message={error} onRetry={handleSearch} />}

          {!loading && !error && searched && routes.length === 0 && (
            <EmptyState
              icon={<Map size={24} />}
              title="Route not yet verified"
              description="FareFair doesn't have verified route data between these locations yet."
            />
          )}

          {!loading && !error && routes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--ff-text)]">{routes.length} route{routes.length !== 1 ? 's' : ''} found</p>
                <span className="text-xs text-[var(--ff-text-muted)]">Tap a card for details</span>
              </div>
              {routes.map((route, index) => <RouteCard key={route.id} route={route} index={index} />)}
            </div>
          )}

          {!searched && (
            <div className="ff-card flex min-h-[260px] flex-col items-center justify-center p-7 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.13)] text-[var(--ff-accent-soft)]"><Map size={25} aria-hidden /></span>
              <p className="font-medium text-[var(--ff-text)]">Your route options will appear here</p>
              <p className="mt-2 max-w-sm text-sm text-[var(--ff-text-muted)]">Search two locations to compare the route records FareFair has verified.</p>
            </div>
          )}
        </section>
      </div>
    </MotionPage>
  );
}

function RouteCard({ route, index }: { route: Route; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .06, duration: .25 }}
      className="ff-card ff-card-hover"
    >
      <button type="button" onClick={() => setExpanded((v) => !v)} className="w-full p-4 text-left" aria-expanded={expanded}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <VerificationBadge status={route.verification_status} />
              {route.transport_type && <span className="text-xs text-[var(--ff-text-muted)]">{route.transport_type.name}</span>}
            </div>
            <h2 className="text-base font-medium text-[var(--ff-text)]">{route.route_name}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--ff-text-muted)]">
              <span className="max-w-[42%] truncate">{route.origin_location?.name ?? '—'}</span>
              <ArrowRight size={14} className="shrink-0 text-[var(--ff-accent)]" aria-hidden />
              <span className="max-w-[42%] truncate">{route.destination_location?.name ?? '—'}</span>
            </div>
          </div>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-text-muted)]">
            <ChevronDown size={17} aria-hidden />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: .24 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 border-t border-[var(--ff-border)] px-4 py-4 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] p-3">
                <span className="text-[11px] uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Distance</span>
                <p className="mt-1 text-sm font-medium text-[var(--ff-text)]">{route.distance_km != null ? `${route.distance_km} km` : 'Not available'}</p>
              </div>
              <div className="rounded-xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] p-3">
                <span className="text-[11px] uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Verified</span>
                <p className="mt-1 text-sm font-medium text-[var(--ff-text)]">{route.verified_at ? formatDate(route.verified_at) : 'Not available'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
