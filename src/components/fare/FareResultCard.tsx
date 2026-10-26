import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  DatabaseZap,
  ExternalLink,
} from 'lucide-react';
import type { FareCalculationResult, FareStatus } from '../../types';
import { formatPeso, formatDifference } from '../../services/fareService';
import { VerificationBadge } from '../ui/VerificationBadge';
import { InfoAccordion } from '../ui/InfoAccordion';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface FareResultCardProps {
  result: FareCalculationResult;
}

const statusConfig: Record<FareStatus, {
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean; className?: string }>;
  title: string;
  description: string;
  className: string;
}> = {
  fare_matches: {
    icon: CheckCircle2,
    title: '✓ Fare Matches',
    description: 'The amount you were charged matches the verified fare.',
    className: 'ff-fare-matches',
  },
  possible_overcharge: {
    icon: AlertTriangle,
    title: '⚠ Possible Overcharge',
    description: 'You may have been charged more than the expected fare. Route-specific conditions may apply.',
    className: 'ff-fare-overcharge',
  },
  estimated_only: {
    icon: Clock,
    title: '~ Estimated Only',
    description: 'FareFair couldn\'t find an official fare for this route. This is an estimate using standard fare rules.',
    className: 'ff-fare-estimated',
  },
  data_not_available: {
    icon: DatabaseZap,
    title: 'Data Not Available',
    description: 'FareFair doesn\'t have verified fare data for this transportation type yet.',
    className: 'ff-fare-unavailable',
  },
};

export function FareResultCard({ result }: FareResultCardProps) {
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}> 
      {/* Status banner */}
      <div className={`rounded-xl p-4 ${config.className}`}>
        <div className="flex items-start gap-3">
          <StatusIcon size={22} aria-hidden className="mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-base">{config.title}</p>
            <p className="text-sm mt-0.5 opacity-90">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Fare comparison */}
      {result.status !== 'data_not_available' && (
        <div className="ff-card overflow-hidden shadow-[0_18px_50px_rgba(79,7,21,.2)]">
          <div className="grid grid-cols-1 divide-y divide-[var(--ff-border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)] mb-1.5">Expected</p>
              <p className="text-2xl font-medium text-[var(--ff-text)]">
                <AnimatedNumber value={result.expected_fare} formatter={formatPeso} />
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)] mb-1.5">You Paid</p>
              <p className="text-2xl font-medium text-[var(--ff-text)]">
                <AnimatedNumber value={result.charged_fare} formatter={formatPeso} />
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs font-medium uppercase tracking-[.12em] text-[var(--ff-text-muted)] mb-1.5">Difference</p>
              <p className={`text-base font-bold ${
                (result.difference ?? 0) > 0.01
                  ? 'text-red-600'
                  : 'text-[var(--ff-green)]'
              }`}>
                <AnimatedNumber value={result.difference} formatter={formatDifference} />
              </p>
            </div>
          </div>

          {/* Verification badge */}
          <div className="px-4 py-2.5 bg-[var(--ff-white-smoke)] border-t border-[var(--ff-platinum)] flex items-center justify-between gap-2">
            <VerificationBadge status={result.verification_status} />
            {result.effective_from && (
              <span className="text-xs text-gray-400">
                Effective {formatDate(result.effective_from)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Data not available card */}
      {result.status === 'data_not_available' && (
        <div className="ff-card p-4 text-center">
          <p className="text-sm text-gray-500">
            FareFair doesn't have verified fare data for this transportation type yet.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            We are actively working to add more verified data.
          </p>
        </div>
      )}

      {/* Calculation details */}
      {result.fare_rule && (
        <InfoAccordion title="How was this calculated?">
          <div className="space-y-2 pt-2">
            {result.base_fare != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Base fare</span>
                <span className="font-medium">{formatPeso(result.base_fare)}</span>
              </div>
            )}
            {result.fare_rule.included_distance_km != null && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Covers first</span>
                <span className="font-medium">{result.fare_rule.included_distance_km} km</span>
              </div>
            )}
            {result.additional_distance != null && result.additional_distance > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Additional distance</span>
                  <span className="font-medium">{result.additional_distance.toFixed(2)} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rate</span>
                  <span className="font-medium">{formatPeso(result.fare_rule.additional_rate_per_km)}/km</span>
                </div>
                {result.additional_amount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Additional fare</span>
                    <span className="font-medium">{formatPeso(result.additional_amount)}</span>
                  </div>
                )}
              </>
            )}
            {result.discount_applied && (
              <>
                <div className="border-t border-[var(--ff-platinum)] my-1" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-medium text-green-600">{result.discount_applied.name} ({result.discount_applied.percentage}%)</span>
                </div>
                {result.discount_amount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount saved</span>
                    <span className="font-medium text-green-600">−{formatPeso(result.discount_amount)}</span>
                  </div>
                )}
              </>
            )}
            {result.rounding_rule && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rounding</span>
                <span className="font-medium capitalize">{result.rounding_rule.replace('_', ' ')}</span>
              </div>
            )}
            <div className="border-t border-[var(--ff-platinum)] my-1" />
            <div className="flex justify-between text-sm font-semibold">
              <span>Expected fare</span>
              <span>{formatPeso(result.expected_fare)}</span>
            </div>
            {result.effective_until && (
              <p className="text-xs text-gray-400 pt-1">
                Fare effective until {formatDate(result.effective_until)}
              </p>
            )}
          </div>
        </InfoAccordion>
      )}

      {/* Source information */}
      {result.source && (
        <InfoAccordion title="Source Information">
          <div className="space-y-2 pt-2">
            <div className="text-sm space-y-1">
              <p><span className="text-gray-400">Organization:</span> <span className="font-medium">{result.source.organization}</span></p>
              <p><span className="text-gray-400">Document:</span> <span className="font-medium">{result.source.title}</span></p>
              {result.source.effective_date && (
                <p><span className="text-gray-400">Effective:</span> <span className="font-medium">{formatDate(result.source.effective_date)}</span></p>
              )}
              {result.source.checked_at && (
                <p><span className="text-gray-400">Last checked:</span> <span className="font-medium">{formatDate(result.source.checked_at)}</span></p>
              )}
            </div>
            {result.source.url && (
              <a
                href={result.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ff-btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 w-fit mt-2"
                aria-label="View official source (opens in new tab)"
              >
                <ExternalLink size={14} aria-hidden />
                View Official Source
              </a>
            )}
          </div>
        </InfoAccordion>
      )}

      {/* Overcharge notice */}
      {result.status === 'possible_overcharge' && (
        <div className="ff-card p-4 bg-red-50 border-red-100">
          <p className="text-sm font-semibold text-red-700 mb-1">What can you do?</p>
          <p className="text-sm text-red-600">
            You can prepare a fare report with the details of this trip. FareFair does not automatically file
            government complaints, but your report helps document the issue.
          </p>
          <a
            href="/report"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-red-700 hover:underline"
          >
            Prepare Fare Report →
          </a>
        </div>
      )}
    </motion.div>
  );
}
