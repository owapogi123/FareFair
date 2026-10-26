import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Tag, ChevronDown, ExternalLink, BadgePercent } from 'lucide-react';
import { useDiscountTypes } from '../hooks/useDiscountTypes';
import { CardSkeleton } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { MotionPage } from '../components/ui/MotionPage';
import type { DiscountType } from '../types';

export function DiscountsPage() {
  const { data: discounts, loading, error, retry } = useDiscountTypes();

  return (
    <MotionPage className="ff-page">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Fare benefits</p>
        <h1 className="ff-page-title mt-1">Discounts</h1>
        <p className="ff-page-subtitle">See who qualifies, what identification is required, and the verified basis for each discount.</p>
      </header>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}
      {error && <ErrorState message={error} onRetry={retry} />}

      {!loading && !error && discounts.length === 0 && (
        <EmptyState icon={<Tag size={24} />} title="No discount data available" description="Verified discount information is not yet available. Check back soon." />
      )}

      {!loading && !error && discounts.length > 0 && (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {discounts.map((discount, index) => <DiscountCard key={discount.id} discount={discount} index={index} />)}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-[rgba(138,180,255,.20)] bg-[rgba(63,112,189,.10)] p-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#A9C7FF]">Before you claim a discount</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-muted)]">Discount eligibility and rates are retrieved from verified sources. Carry the required identification and check the source details when a rule has special conditions.</p>
      </div>
    </MotionPage>
  );
}

function DiscountCard({ discount, index }: { discount: DiscountType; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' }) : '—';

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * .06, duration: .28 }}
      className="ff-card overflow-hidden"
    >
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.16)] text-[var(--ff-accent-soft)]">
            <BadgePercent size={20} aria-hidden />
          </span>
          <div className="text-right">
            <div className="text-3xl font-light text-[var(--ff-accent-soft)]">{discount.percentage}%</div>
            <div className="text-[11px] uppercase tracking-[.13em] text-[var(--ff-text-muted)]">discount</div>
          </div>
        </div>

        <h2 className="text-lg font-medium text-[var(--ff-text)]">{discount.name}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--ff-text-muted)]">{discount.description}</p>
        <div className="mt-3"><VerificationBadge status={discount.verification_status} /></div>

        <div className="mt-5 space-y-3 border-t border-[var(--ff-border)] pt-4">
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Who qualifies</span>
            <p className="mt-1 text-sm text-[var(--ff-text)]">{discount.eligibility}</p>
          </div>
          <div>
            <span className="text-[11px] font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Required ID</span>
            <p className="mt-1 text-sm text-[var(--ff-text)]">{discount.required_documents}</p>
          </div>
          {discount.applicable_transports && discount.applicable_transports.length > 0 && (
            <div>
              <span className="text-[11px] font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Applies to</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {discount.applicable_transports.map((t) => <span key={t} className="ff-badge ff-badge-unverified">{t}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="button" onClick={() => setExpanded((p) => !p)} className="flex w-full items-center justify-between gap-2 border-t border-[var(--ff-border)] px-5 py-3.5 text-sm font-medium text-[var(--ff-text-muted)] transition-colors hover:bg-[rgba(120,23,40,.12)] hover:text-[var(--ff-text)]" aria-expanded={expanded}>
        <span>Legal details</span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown size={16} aria-hidden /></motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-[var(--ff-border)] bg-[rgba(79,7,21,.22)] px-5 py-4 text-sm">
              {discount.legal_basis && <Detail label="Legal basis" value={discount.legal_basis} />}
              {discount.citizenship_restrictions && <Detail label="Citizenship" value={discount.citizenship_restrictions} />}
              {discount.effective_from && <Detail label="Effective from" value={formatDate(discount.effective_from)} />}
              {discount.source && (
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)]">Source</span>
                  <p className="mt-1 text-[var(--ff-text)]">{discount.source.organization} — {discount.source.title}</p>
                  {discount.source.url && (
                    <a href={discount.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ff-accent-soft)] hover:text-[var(--ff-text)]">
                      <ExternalLink size={12} aria-hidden /> View source
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="text-[11px] font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)]">{label}</span><p className="mt-1 text-[var(--ff-text)]">{value}</p></div>;
}
