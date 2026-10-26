import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 px-4 text-center ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full border border-[rgba(255,129,119,.25)] bg-[rgba(202,48,61,.15)] flex items-center justify-center">
        <AlertCircle size={24} className="text-[#FFAAA3]" aria-hidden />
      </div>
      <div>
        <p className="font-semibold text-[var(--ff-onyx)] mb-1">Unable to load</p>
        <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ff-btn-secondary flex items-center gap-2 text-sm px-4 py-2"
          aria-label="Try again"
        >
          <RefreshCw size={16} aria-hidden />
          Try Again
        </button>
      )}
    </div>
  );
}
