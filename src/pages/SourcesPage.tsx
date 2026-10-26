import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ExternalLink, SearchCheck } from 'lucide-react';
import { useSources } from '../hooks/useSources';
import { CardSkeleton } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { VerificationBadge } from '../components/ui/VerificationBadge';
import { MotionPage } from '../components/ui/MotionPage';
import { Chip } from '../components/ui/Chip';
import type { Source } from '../types';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'government_document', label: 'Government' },
  { value: 'regulatory_order', label: 'Regulatory' },
  { value: 'law', label: 'Laws' },
  { value: 'official_website', label: 'Official Sites' },
  { value: 'news_article', label: 'News' },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  government_document: 'Government Document',
  official_website: 'Official Website',
  news_article: 'News Article',
  press_release: 'Press Release',
  regulatory_order: 'Regulatory Order',
  law: 'Law',
  other: 'Other',
};

export function SourcesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: sources, loading, error, retry } = useSources(activeFilter !== 'all' ? activeFilter : undefined);

  return (
    <MotionPage className="ff-page">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Evidence trail</p>
        <h1 className="ff-page-title mt-1">Sources &amp; Proof</h1>
        <p className="ff-page-subtitle">See what supports each FareFair record, when it was checked, and whether the source is still considered verified.</p>
      </header>

      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent-soft)]"><SearchCheck size={19} /></span>
        <p className="text-sm leading-relaxed text-[var(--ff-text-muted)]">FareFair is designed to show the evidence behind a price or fare instead of asking consumers to trust an unexplained number.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist" aria-label="Source filters">
        {FILTERS.map(({ value, label }) => {
          const active = activeFilter === value;
          return (
            <Chip key={value} selected={active} role="tab" aria-selected={active} onClick={() => setActiveFilter(value)} className="shrink-0">
              {label}
            </Chip>
          );
        })}
      </div>

      {loading && <div className="grid gap-4 md:grid-cols-2">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && sources.length === 0 && <EmptyState icon={<BookOpen size={24} />} title="No sources available" description="Source records have not yet been added to FareFair." />}

      {!loading && !error && sources.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((source, index) => <SourceCard key={source.id} source={source} index={index} />)}
        </div>
      )}
    </MotionPage>
  );
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  const formatDate = (d: string | null | undefined) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} whileHover={{ y: -4 }} className="ff-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium uppercase tracking-[.14em] text-[var(--ff-accent)]">{SOURCE_TYPE_LABELS[source.source_type] ?? source.source_type}</span>
          <h2 className="mt-2 text-base font-medium leading-snug text-[var(--ff-text)]">{source.title}</h2>
          <p className="mt-1 text-xs text-[var(--ff-text-muted)]">{source.organization}</p>
        </div>
        <VerificationBadge status={source.verification_status} />
      </div>

      {source.information_supported && <p className="mt-4 text-sm leading-relaxed text-[var(--ff-text-muted)]">{source.information_supported}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--ff-border)] pt-4 text-xs">
        {source.effective_date && <div><dt className="text-[var(--ff-text-muted)]">Effective</dt><dd className="mt-1 font-medium text-[var(--ff-text)]">{formatDate(source.effective_date)}</dd></div>}
        {source.checked_at && <div><dt className="text-[var(--ff-text-muted)]">Last checked</dt><dd className="mt-1 font-medium text-[var(--ff-text)]">{formatDate(source.checked_at)}</dd></div>}
        {source.publication_date && <div><dt className="text-[var(--ff-text-muted)]">Published</dt><dd className="mt-1 font-medium text-[var(--ff-text)]">{formatDate(source.publication_date)}</dd></div>}
      </dl>

      {source.url && (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--ff-border)] px-3 py-2 text-xs font-medium text-[var(--ff-accent-soft)] transition-colors hover:border-[var(--ff-border-strong)] hover:text-[var(--ff-text)]" aria-label={`View official source: ${source.title} (opens in new tab)`}>
          <ExternalLink size={13} aria-hidden /> View Official Source
        </a>
      )}
    </motion.article>
  );
}
