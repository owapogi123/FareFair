import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 px-4 text-center ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full border border-[var(--ff-border)] bg-[rgba(120,23,40,.12)] flex items-center justify-center text-[var(--ff-accent-soft)] mb-1">
          {icon}
        </div>
      )}
      <p className="font-semibold text-[var(--ff-onyx)] text-base">{title}</p>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
