import { useState, useId, useRef, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import type { Location } from '../../types';

interface SearchLocationInputProps {
  label: string;
  value: Location | null;
  onSelect: (location: Location | null) => void;
  onSearch: (query: string) => void;
  results: Location[];
  loading: boolean;
  error?: string | null;
  placeholder?: string;
  className?: string;
}

export function SearchLocationInput({
  label,
  value,
  onSelect,
  onSearch,
  results,
  loading,
  error,
  placeholder = 'Search location...',
  className = '',
}: SearchLocationInputProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInputValue(q);
    onSearch(q);
    setIsOpen(true);
    if (!q) onSelect(null);
  };

  const handleSelect = (location: Location) => {
    onSelect(location);
    setInputValue('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setInputValue('');
    setIsOpen(false);
  };

  const showDropdown = isOpen && (loading || results.length > 0 || (inputValue.length > 0 && !loading));

  return (
    <div className={`space-y-1.5 relative ${className}`} ref={containerRef}>
      <label htmlFor={id} className="ff-label">{label}</label>

      {value ? (
        /* Selected state */
        <div className="flex items-center gap-2 ff-input bg-[var(--ff-white-smoke)] cursor-default">
          <MapPin size={16} className="text-[var(--ff-onyx)] shrink-0" aria-hidden />
          <span className="flex-1 font-medium text-[var(--ff-onyx)] truncate">
            {value.name}
            {value.city && ` · ${value.city}`}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded hover:bg-[var(--ff-platinum)] transition-colors"
            aria-label={`Clear ${label}`}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => inputValue && setIsOpen(true)}
            placeholder={placeholder}
            className="ff-input pl-9 pr-9"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={!!error}
          />
          {loading && (
            <Loader2
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              aria-hidden
            />
          )}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} results`}
          className="absolute left-0 right-0 top-full mt-1 z-50 ff-card shadow-lg max-h-52 overflow-y-auto"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" aria-hidden />
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && inputValue.length > 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">
              No locations found for "{inputValue}"
            </div>
          )}
          {!loading && results.map((loc) => (
            <button
              key={loc.id}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-4 py-3 flex items-start gap-2.5 hover:bg-[var(--ff-white-smoke)] transition-colors border-b border-[var(--ff-platinum)] last:border-0"
            >
              <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-[var(--ff-onyx)]">{loc.name}</p>
                {loc.city && (
                  <p className="text-xs text-gray-500">{loc.city}{loc.province ? `, ${loc.province}` : ''}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
}
