import { useState, useId } from 'react';
import { AlertOctagon, Upload, X } from 'lucide-react';
import { submitOverchargeReport, uploadEvidenceFile } from '../api/dataApi';
import { useTransportTypes } from '../hooks/useTransportTypes';
import { PesoInput } from '../components/ui/PesoInput';
import { ErrorState } from '../components/ui/ErrorState';
import { MotionPage } from '../components/ui/MotionPage';
import { Toast } from '../components/ui/Toast';

type FormState = {
  transport_type_id: string;
  origin_text: string;
  destination_text: string;
  charged_fare: string;
  expected_fare: string;
  vehicle_plate: string;
  operator: string;
  driver_details: string;
  notes: string;
  occurred_at: string;
};

const INITIAL_FORM: FormState = {
  transport_type_id: '',
  origin_text: '',
  destination_text: '',
  charged_fare: '',
  expected_fare: '',
  vehicle_plate: '',
  operator: '',
  driver_details: '',
  notes: '',
  occurred_at: new Date().toISOString().slice(0, 16),
};

export function ReportPage() {
  const formId = useId();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: transportTypes, loading: transportLoading } = useTransportTypes();

  const update = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setValidationErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};
    if (!form.transport_type_id) errors.transport_type_id = 'Please select a transportation type.';
    if (!form.charged_fare || isNaN(parseFloat(form.charged_fare))) {
      errors.charged_fare = 'Please enter the amount you were charged.';
    }
    if (!form.occurred_at) errors.occurred_at = 'Please enter the date and time.';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5)); // max 5 files
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { id } = await submitOverchargeReport({
        transport_type_id: form.transport_type_id,
        origin_location_id: null,
        destination_location_id: null,
        origin_text: form.origin_text || null,
        destination_text: form.destination_text || null,
        charged_fare: parseFloat(form.charged_fare),
        expected_fare: form.expected_fare ? parseFloat(form.expected_fare) : null,
        difference: form.expected_fare
          ? parseFloat(form.charged_fare) - parseFloat(form.expected_fare)
          : null,
        vehicle_plate: form.vehicle_plate || null,
        operator: form.operator || null,
        driver_details: form.driver_details || null,
        notes: form.notes || null,
        occurred_at: new Date(form.occurred_at).toISOString(),
      } as Parameters<typeof submitOverchargeReport>[0]);

      // Upload evidence files if any
      if (files.length > 0) {
        await Promise.allSettled(files.map((f) => uploadEvidenceFile(id, f)));
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
      setFiles([]);
    } catch {
      setError('We couldn\'t submit your report. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionPage className="ff-page ff-page-narrow">
      <Toast open={submitted} message="Report saved successfully." onClose={() => setSubmitted(false)} />
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Consumer report</p>
        <h1 className="ff-page-title mt-1">Report Overcharge</h1>
        <p className="ff-page-subtitle">Save the details of a fare concern and keep your evidence organized.</p>
      </header>

      <div className="mb-5 flex gap-3 rounded-2xl border border-[rgba(243,185,106,.28)] bg-[rgba(180,104,23,.12)] p-4">
        <AlertOctagon size={18} className="mt-0.5 shrink-0 text-[#FFD19A]" aria-hidden />
        <p className="text-xs leading-relaxed text-[var(--ff-text-muted)]">
          <strong>Prepare Fare Report</strong> — This saves your fare concern on FareFair.
          It does not automatically file a formal complaint with the government.
        </p>
      </div>

      {error && <ErrorState message={error} className="mb-4" />}

      <form id={formId} onSubmit={handleSubmit} noValidate className="ff-card space-y-5 p-4 sm:p-5">
        {/* Transport type */}
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-transport`} className="ff-label">
            Transportation Type <span className="text-red-500">*</span>
          </label>
          {transportLoading ? (
            <div className="ff-input animate-pulse bg-[var(--ff-platinum)]" />
          ) : (
            <select
              id={`${formId}-transport`}
              value={form.transport_type_id}
              onChange={(e) => update('transport_type_id', e.target.value)}
              className={`ff-input ${validationErrors.transport_type_id ? 'border-red-400' : ''}`}
              aria-required="true"
              aria-invalid={!!validationErrors.transport_type_id}
            >
              <option value="">Select transportation type</option>
              {transportTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {validationErrors.transport_type_id && (
            <p className="text-sm text-red-600" role="alert">{validationErrors.transport_type_id}</p>
          )}
        </div>

        {/* Origin & destination */}
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-origin`} className="ff-label">From (Starting point)</label>
          <input
            id={`${formId}-origin`}
            type="text"
            value={form.origin_text}
            onChange={(e) => update('origin_text', e.target.value)}
            placeholder="E.g., Cubao terminal, Commonwealth Ave."
            className="ff-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${formId}-dest`} className="ff-label">To (Destination)</label>
          <input
            id={`${formId}-dest`}
            type="text"
            value={form.destination_text}
            onChange={(e) => update('destination_text', e.target.value)}
            placeholder="E.g., SM North EDSA, Fairview"
            className="ff-input"
          />
        </div>

        {/* Fares */}
        <div className="grid grid-cols-2 gap-3">
          <PesoInput
            label="Amount Charged *"
            value={form.charged_fare}
            onChange={(v) => update('charged_fare', v)}
            error={validationErrors.charged_fare}
          />
          <PesoInput
            label="Expected Fare"
            value={form.expected_fare}
            onChange={(v) => update('expected_fare', v)}
            hint="Optional"
          />
        </div>

        {/* Date and time */}
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-datetime`} className="ff-label">
            Date &amp; Time <span className="text-red-500">*</span>
          </label>
          <input
            id={`${formId}-datetime`}
            type="datetime-local"
            value={form.occurred_at}
            onChange={(e) => update('occurred_at', e.target.value)}
            className={`ff-input ${validationErrors.occurred_at ? 'border-red-400' : ''}`}
            aria-required="true"
          />
          {validationErrors.occurred_at && (
            <p className="text-sm text-red-600" role="alert">{validationErrors.occurred_at}</p>
          )}
        </div>

        {/* Vehicle details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor={`${formId}-plate`} className="ff-label">Plate Number</label>
            <input
              id={`${formId}-plate`}
              type="text"
              value={form.vehicle_plate}
              onChange={(e) => update('vehicle_plate', e.target.value)}
              placeholder="ABC 1234"
              className="ff-input uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${formId}-operator`} className="ff-label">Operator</label>
            <input
              id={`${formId}-operator`}
              type="text"
              value={form.operator}
              onChange={(e) => update('operator', e.target.value)}
              placeholder="Company name"
              className="ff-input"
            />
          </div>
        </div>

        {/* Driver details */}
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-driver`} className="ff-label">Driver Details (optional)</label>
          <input
            id={`${formId}-driver`}
            type="text"
            value={form.driver_details}
            onChange={(e) => update('driver_details', e.target.value)}
            placeholder="Name, badge number, description..."
            className="ff-input"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label htmlFor={`${formId}-notes`} className="ff-label">Notes</label>
          <textarea
            id={`${formId}-notes`}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Describe what happened..."
            rows={3}
            className="ff-input resize-none"
          />
        </div>

        {/* Evidence upload */}
        <div className="space-y-2">
          <p className="ff-label">Evidence (optional)</p>
          <label
            className="flex flex-col items-center justify-center gap-2 w-full h-24 border border-dashed border-[var(--ff-border-strong)] rounded-2xl cursor-pointer hover:border-[var(--ff-accent)] transition-colors bg-[rgba(120,23,40,.08)]"
            aria-label="Upload evidence files"
          >
            <Upload size={20} className="text-gray-400" aria-hidden />
            <span className="text-sm text-gray-500">Tap to upload photos or receipts</span>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload evidence files"
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-white border border-[var(--ff-platinum)] rounded-lg px-3 py-2">
                  <span className="flex-1 truncate text-[var(--ff-onyx)]">{file.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="p-0.5 rounded hover:bg-[var(--ff-platinum)]"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400">Maximum 5 files. Images and PDFs accepted.</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`ff-btn-primary w-full ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving Report...
            </>
          ) : (
            <>
              <AlertOctagon size={18} aria-hidden />
              Prepare Fare Report
            </>
          )}
        </button>
      </form>
    </MotionPage>
  );
}
