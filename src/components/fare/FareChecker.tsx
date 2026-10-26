import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bus, ChevronRight, ChevronLeft } from 'lucide-react';
import type { TransportType, Location, DiscountType } from '../../types';
import { useTransportTypes } from '../../hooks/useTransportTypes';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { useDiscountTypes } from '../../hooks/useDiscountTypes';
import { LoadingState, CardSkeleton } from '../ui/LoadingState';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import { SearchLocationInput } from '../ui/SearchLocationInput';
import { PesoInput } from '../ui/PesoInput';
import { FareResultCard } from './FareResultCard';
import { fetchFareRuleForTransport, searchRoutes, fetchFareMatrixForRoute, fetchDiscountById } from '../../api/fareApi';
import { calculateFare, calculateFareFromMatrix } from '../../services/fareService';
import type { FareCalculationResult } from '../../types';

type Step = 1 | 2 | 3 | 4 | 5;

export function FareChecker() {
  const [step, setStep] = useState<Step>(1);
  const [selectedTransport, setSelectedTransport] = useState<TransportType | null>(null);
  const [originLocation, setOriginLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountType | null>(null);
  const [noDiscount, setNoDiscount] = useState(false);
  const [chargedFare, setChargedFare] = useState('');
  const [fareError, setFareError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState<FareCalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  const {
    data: transportTypes,
    loading: transportLoading,
    error: transportError,
    retry: retryTransport,
  } = useTransportTypes();

  const {
    data: discountTypes,
    loading: discountLoading,
    error: discountError,
    retry: retryDiscounts,
  } = useDiscountTypes();

  const originSearch = useLocationSearch();
  const destinationSearch = useLocationSearch();

  const canGoNext = (): boolean => {
    if (step === 1) return !!selectedTransport;
    if (step === 2) return !!originLocation;
    if (step === 3) return !!destinationLocation;
    if (step === 4) return noDiscount || !!selectedDiscount;
    if (step === 5) return !!chargedFare && parseFloat(chargedFare) >= 0;
    return false;
  };

  const goNext = () => {
    if (step < 5) setStep((s) => (s + 1) as Step);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    if (step === 5) {
      setResult(null);
      setCalcError(null);
    }
  };

  const handleCalculate = async () => {
    const amount = parseFloat(chargedFare);
    if (isNaN(amount) || amount < 0) {
      setFareError('Please enter a valid amount.');
      return;
    }
    setFareError('');
    setCalculating(true);
    setCalcError(null);
    setResult(null);

    try {
      if (!selectedTransport) throw new Error('No transport type selected.');

      // Try route-specific fare first
      if (originLocation && destinationLocation) {
        const routes = await searchRoutes(
          originLocation.id,
          destinationLocation.id,
          selectedTransport.id
        );

        if (routes.length > 0) {
          const routeMatrix = await fetchFareMatrixForRoute(routes[0].id);
          if (routeMatrix) {
            const discount = noDiscount ? null : selectedDiscount;
            const partial = calculateFareFromMatrix({
              matrixFare: routeMatrix.fare_amount,
              discountedMatrixFare: routeMatrix.discounted_fare_amount,
              discount,
              chargedFare: amount,
              verificationStatus: routeMatrix.verification_status,
              effectiveFrom: routeMatrix.effective_from,
              effectiveUntil: routeMatrix.effective_until,
            });

            setResult({
              ...partial,
              transport_type: selectedTransport,
              fare_rule: null,
              discount_applied: discount,
              discount_amount: null,
              base_fare: routeMatrix.fare_amount,
              distance_km: routes[0].distance_km ?? null,
              additional_distance: null,
              additional_amount: null,
              rounding_rule: null,
              source: routeMatrix.source ?? null,
            } as FareCalculationResult);
            return;
          }
        }
      }

      // Fall back to fare rule calculation
      const fareRule = await fetchFareRuleForTransport(selectedTransport.id);
      if (!fareRule) {
        setResult({
          expected_fare: null,
          charged_fare: amount,
          difference: null,
          status: 'data_not_available',
          transport_type: selectedTransport,
          fare_rule: null,
          discount_applied: null,
          discount_amount: null,
          base_fare: null,
          distance_km: null,
          additional_distance: null,
          additional_amount: null,
          rounding_rule: null,
          verification_status: 'unverified',
          effective_from: null,
          effective_until: null,
          source: null,
        });
        return;
      }

      // Get full discount object if needed
      let discount: DiscountType | null = null;
      if (!noDiscount && selectedDiscount) {
        discount = await fetchDiscountById(selectedDiscount.id) ?? selectedDiscount;
      }

      const distanceKm = (originLocation && destinationLocation)
        ? null // route not found in DB, distance unknown
        : null;

      const calcResult = calculateFare({
        fareRule,
        distanceKm,
        discount,
        chargedFare: amount,
      });

      setResult(calcResult);
    } catch {
      setCalcError('We couldn\'t calculate the fare. Please check your connection and try again.');
    } finally {
      setCalculating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setSelectedTransport(null);
    setOriginLocation(null);
    setDestinationLocation(null);
    setSelectedDiscount(null);
    setNoDiscount(false);
    setChargedFare('');
    setResult(null);
    setCalcError(null);
  };

  // Show result
  if (result || calcError) {
    return (
      <motion.div
        className="space-y-4"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .28 }}
      >
        {calcError ? (
          <ErrorState message={calcError} onRetry={handleCalculate} />
        ) : result ? (
          <FareResultCard result={result} />
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="ff-btn-secondary w-full"
        >
          Check Another Fare
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 rounded-[22px] border border-[var(--ff-border)] bg-[rgba(120,23,40,.08)] p-4 sm:p-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2" aria-label={`Step ${step} of 5`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`ff-step-dot ${s === step ? 'active' : s < step ? 'completed' : ''}`}
            aria-hidden
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
      {/* Step 1: Transport type */}
      {step === 1 && (
        <motion.div key="step-1" className="space-y-4" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div>
            <h2 className="text-xl font-medium text-[var(--ff-accent-soft)]">What are you riding?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Choose the type of transportation.</p>
          </div>

          {transportLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}
          {transportError && <ErrorState message={transportError} onRetry={retryTransport} />}
          {!transportLoading && !transportError && transportTypes.length === 0 && (
            <EmptyState
              icon={<Bus size={24} />}
              title="No transportation types available"
              description="Data not yet available. Check back soon."
            />
          )}

          {!transportLoading && !transportError && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {transportTypes.map((t) => (
                <motion.button
                  key={t.id}
                  layout
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setSelectedTransport(t)}
                  className={`ff-card text-left px-3.5 py-3.5 flex min-h-[92px] flex-col items-start gap-2.5 transition-all duration-150 ${
                    selectedTransport?.id === t.id
                      ? 'border-[var(--ff-accent)] bg-[rgba(120,23,40,.42)] text-white shadow-[0_0_26px_rgba(224,101,90,.15)]'
                      : 'ff-card-hover'
                  }`}
                  aria-pressed={selectedTransport?.id === t.id}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    selectedTransport?.id === t.id ? 'bg-white/15' : 'bg-[var(--ff-white-smoke)]'
                  }`}>
                    {t.icon ?? '🚌'}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${selectedTransport?.id === t.id ? 'text-white' : 'text-[var(--ff-onyx)]'}`}>
                      {t.name}
                    </p>
                    {t.description && (
                      <p className={`text-xs mt-0.5 ${selectedTransport?.id === t.id ? 'text-white/70' : 'text-gray-500'}`}>
                        {t.description}
                      </p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 2: Origin */}
      {step === 2 && (
        <motion.div key="step-2" className="space-y-4" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div>
            <h2 className="text-xl font-medium text-[var(--ff-accent-soft)]">Where are you coming from?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Search your starting point or terminal.</p>
          </div>
          <SearchLocationInput
            label="From"
            value={originLocation}
            onSelect={setOriginLocation}
            onSearch={originSearch.search}
            results={originSearch.results}
            loading={originSearch.loading}
            error={originSearch.error}
            placeholder="Search terminal, street, or area..."
          />
          <p className="text-xs text-gray-400">
            You can skip this if you don't know the exact route — FareFair will use general fare rules.
          </p>
        </motion.div>
      )}

      {/* Step 3: Destination */}
      {step === 3 && (
        <motion.div key="step-3" className="space-y-4" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div>
            <h2 className="text-xl font-medium text-[var(--ff-accent-soft)]">Where are you going?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Search your destination or stop.</p>
          </div>
          <SearchLocationInput
            label="To"
            value={destinationLocation}
            onSelect={setDestinationLocation}
            onSearch={destinationSearch.search}
            results={destinationSearch.results}
            loading={destinationSearch.loading}
            error={destinationSearch.error}
            placeholder="Search destination, terminal, or area..."
          />
        </motion.div>
      )}

      {/* Step 4: Discount */}
      {step === 4 && (
        <motion.div key="step-4" className="space-y-4" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div>
            <h2 className="text-xl font-medium text-[var(--ff-accent-soft)]">Do you get a discount?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Select if you qualify for a reduced fare.</p>
          </div>

          {discountLoading && <LoadingState message="Loading discount options..." />}
          {discountError && <ErrorState message={discountError} onRetry={retryDiscounts} />}

          {!discountLoading && !discountError && (
            <div className="space-y-2.5">
              {/* No discount option */}
              <motion.button
                type="button"
                layout
                whileTap={{ scale: 0.97 }}
                onClick={() => { setNoDiscount(true); setSelectedDiscount(null); }}
                className={`ff-card w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-150 ${
                  noDiscount
                    ? 'border-[var(--ff-accent)] bg-[rgba(120,23,40,.42)] text-white shadow-[0_0_26px_rgba(224,101,90,.15)]'
                    : 'ff-card-hover'
                }`}
                aria-pressed={noDiscount}
              >
                <span className="text-xl">👤</span>
                <div>
                  <p className={`font-semibold text-sm ${noDiscount ? 'text-white' : 'text-[var(--ff-onyx)]'}`}>No Discount</p>
                  <p className={`text-xs mt-0.5 ${noDiscount ? 'text-white/70' : 'text-gray-500'}`}>Regular fare applies</p>
                </div>
              </motion.button>

              {discountTypes.map((d) => (
                <motion.button
                  key={d.id}
                  layout
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => { setSelectedDiscount(d); setNoDiscount(false); }}
                  className={`ff-card w-full text-left px-4 py-3.5 flex items-center gap-3 transition-all duration-150 ${
                    selectedDiscount?.id === d.id
                      ? 'border-[var(--ff-accent)] bg-[rgba(120,23,40,.42)] text-white shadow-[0_0_26px_rgba(224,101,90,.15)]'
                      : 'ff-card-hover'
                  }`}
                  aria-pressed={selectedDiscount?.id === d.id}
                >
                  <span className="text-xl">🏷️</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${selectedDiscount?.id === d.id ? 'text-white' : 'text-[var(--ff-onyx)]'}`}>
                        {d.name}
                      </p>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        selectedDiscount?.id === d.id ? 'bg-white/20 text-white' : 'bg-green-50 text-green-700'
                      }`}>
                        {d.percentage}% off
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${selectedDiscount?.id === d.id ? 'text-white/70' : 'text-gray-500'}`}>
                      {d.eligibility}
                    </p>
                  </div>
                </motion.button>
              ))}

              {discountTypes.length === 0 && (
                <EmptyState
                  title="No discount data available"
                  description="Discount information is not yet available. You can continue with regular fare."
                />
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Step 5: Amount charged */}
      {step === 5 && (
        <motion.div key="step-5" className="space-y-6" initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .22 }}>
          <div>
            <h2 className="text-xl font-medium text-[var(--ff-accent-soft)]">How much did the driver charge you?</h2>
            <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Enter the exact amount you paid.</p>
          </div>

          <PesoInput
            label="Amount Charged"
            value={chargedFare}
            onChange={setChargedFare}
            placeholder="0.00"
            error={fareError}
            hint="Enter the exact peso amount you were charged."
          />

          {/* Summary */}
          <div className="ff-card p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your trip summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-24">Transport</span>
                <span className="font-medium text-[var(--ff-onyx)]">{selectedTransport?.name ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-24">From</span>
                <span className="font-medium text-[var(--ff-onyx)]">{originLocation?.name ?? 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-24">To</span>
                <span className="font-medium text-[var(--ff-onyx)]">{destinationLocation?.name ?? 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs w-24">Discount</span>
                <span className="font-medium text-[var(--ff-onyx)]">
                  {noDiscount ? 'None' : selectedDiscount?.name ?? 'None'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex gap-3 border-t border-[var(--ff-border)] pt-4">
        {step > 1 && (
          <button
            type="button"
            onClick={goBack}
            className="ff-btn-secondary flex items-center gap-1.5 px-4"
            aria-label="Go back"
          >
            <ChevronLeft size={18} aria-hidden />
            Back
          </button>
        )}

        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext()}
            className={`ff-btn-primary flex-1 flex items-center justify-center gap-1.5 ${
              !canGoNext() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Continue to next step"
          >
            Continue
            <ChevronRight size={18} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCalculate}
            disabled={!canGoNext() || calculating}
            className={`ff-btn-primary flex-1 flex items-center justify-center gap-1.5 ${
              (!canGoNext() || calculating) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Calculate fare"
          >
            {calculating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              'Check My Fare'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
