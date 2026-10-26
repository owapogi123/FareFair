import type { VerificationStatus } from '../../types';
import { CheckCircle, Clock, AlertTriangle, XCircle, HelpCircle, AlertCircle } from 'lucide-react';

interface VerificationBadgeProps {
  status: VerificationStatus;
  showIcon?: boolean;
  className?: string;
}

const config: Record<VerificationStatus, {
  label: string;
  icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>;
  className: string;
}> = {
  verified: {
    label: 'Verified',
    icon: CheckCircle,
    className: 'ff-badge ff-badge-verified',
  },
  calculated: {
    label: 'Calculated',
    icon: Clock,
    className: 'ff-badge ff-badge-calculated',
  },
  check_source: {
    label: 'Check Source',
    icon: AlertTriangle,
    className: 'ff-badge ff-badge-calculated',
  },
  conflicting_data: {
    label: 'Conflicting Data',
    icon: AlertCircle,
    className: 'ff-badge ff-badge-conflicting',
  },
  expired: {
    label: 'Expired',
    icon: XCircle,
    className: 'ff-badge ff-badge-expired',
  },
  unverified: {
    label: 'Not Verified',
    icon: HelpCircle,
    className: 'ff-badge ff-badge-unverified',
  },
};

export function VerificationBadge({ status, showIcon = true, className = '' }: VerificationBadgeProps) {
  const { label, icon: Icon, className: baseClass } = config[status] ?? config.unverified;
  return (
    <span className={`${baseClass} ${className}`} role="status" aria-label={`Verification status: ${label}`}>
      {showIcon && <Icon size={12} aria-hidden />}
      {label}
    </span>
  );
}
