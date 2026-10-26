import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPinned, ExternalLink, Sparkles } from 'lucide-react';
import { useTourismPrices } from '../hooks/useTourismPrices';
import { CardSkeleton } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { MotionPage } from '../components/ui/MotionPage';
import { Chip } from '../components/ui/Chip';
import { formatPeso } from '../services/fareService';
import type { TourismPrice } from '../types';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'Attractions', label: 'Attractions' },
  { value: 'Food', label: 'Food' },
  { value: 'Souvenirs', label: 'Souvenirs' },
  { value: 'Transportation', label: 'Transportation' },
  { value: 'Establishments', label: 'Establishments' },
];

const PRICE_TYPE_LABELS: Record<string, string> = {
  official: 'Official',
  establishment_published: 'Published',
  estimated: 'Estimated',
  user_reported: 'User-reported',
  unverified: 'Unverified',
};

export function TouristPricesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { data: prices, loading, error, retry } = useTourismPrices(activeCategory !== 'all' ? activeCategory : undefined);

  return (
    <MotionPage className="ff-page">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Visitor guide</p>
        <h1 className="ff-page-title mt-1">Tourist Prices</h1>
        <p className="ff-page-subtitle">Check common prices before you visit and see whether a listing is official, published, estimated or still unverified.</p>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Price categories">
        {CATEGORIES.map(({ value, label }) => {
          const active = activeCategory === value;
          return (
            <Chip key={value} selected={active} role="tab" aria-selected={active} onClick={() => setActiveCategory(value)} className="shrink-0">
              {label}
            </Chip>
          );
        })}
      </div>

      {loading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}</div>}
      {error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && prices.length === 0 && (
        <EmptyState icon={<MapPinned size={24} />} title="No price data available" description="Verified tourist price data is not yet available for this category." />
      )}

      {!loading && !error && prices.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {prices.map((price, index) => <TouristPriceCard key={price.id} price={price} index={index} />)}
        </div>
      )}

      <div className="mx-auto mt-7 flex max-w-2xl items-start gap-2 rounded-2xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] px-4 py-3 text-xs leading-relaxed text-[var(--ff-text-muted)]">
        <Sparkles size={14} className="mt-0.5 shrink-0 text-[var(--ff-accent)]" />
        <p>FareFair keeps official and establishment-published prices separate from estimates and user-reported prices so visitors can judge the evidence before paying.</p>
      </div>
    </MotionPage>
  );
}

function TouristPriceCard({ price, index }: { price: TourismPrice; index: number }) {
  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' }) : '—';

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .045, duration: .25 }} whileHover={{ y: -4 }} className="ff-card p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent-soft)]"><MapPinned size={18} /></span>
        <div className="text-right">
          {price.price != null ? <p className="text-2xl font-light text-[var(--ff-accent-soft)]">{formatPeso(price.price)}</p> : <p className="text-sm italic text-[var(--ff-text-muted)]">Price not available</p>}
          {price.discounted_price != null && <p className="mt-1 text-xs font-medium text-[#9CE6B9]">{formatPeso(price.discounted_price)} with discount</p>}
        </div>
      </div>

      <div className="mt-5">
        <p className="font-medium text-[var(--ff-text)]">{price.item_name}</p>
        <p className="mt-1 text-sm text-[var(--ff-text-muted)]">{price.establishment_name}</p>
        {price.location && <p className="mt-1 text-xs text-[var(--ff-text-muted)]">{price.location.name}{price.location.city ? `, ${price.location.city}` : ''}</p>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--ff-border)] pt-4">
        <VerificationBadge status={price.verification_status} />
        <span className="ff-badge ff-badge-unverified">{PRICE_TYPE_LABELS[price.price_type] ?? price.price_type}</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--ff-text-muted)]">
        {price.checked_at ? <span>Checked {formatDate(price.checked_at)}</span> : <span>Check date unavailable</span>}
        {price.source?.url && <a href={price.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[var(--ff-accent-soft)] hover:text-[var(--ff-text)]"><ExternalLink size={11} /> Source</a>}
      </div>
    </motion.article>
  );
}
