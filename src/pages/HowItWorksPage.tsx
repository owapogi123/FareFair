import { motion } from 'framer-motion';
import { Bus, MapPin, BadgePercent, PhilippinePeso, ShieldCheck, CheckCircle2, AlertTriangle, Clock, Database, HelpCircle } from 'lucide-react';
import { MotionPage } from '../components/ui/MotionPage';

const steps = [
  { icon: Bus, number: '01', title: 'Choose your ride', description: 'Pick the transportation type you actually used.' },
  { icon: MapPin, number: '02', title: 'Tell us the route', description: 'Choose where you came from and where you are going.' },
  { icon: BadgePercent, number: '03', title: 'Choose your discount', description: 'Select Student, Senior, PWD or regular fare when available.' },
  { icon: PhilippinePeso, number: '04', title: 'Enter what you paid', description: 'FareFair compares your amount with the best verified information available.' },
  { icon: ShieldCheck, number: '05', title: 'Check the evidence', description: 'See the verification status, effective date and source behind the result.' },
];

const resultTypes = [
  { icon: CheckCircle2, status: 'Fare Matches', description: 'The charged amount matches the official or calculated fare.', className: 'ff-fare-matches' },
  { icon: AlertTriangle, status: 'Possible Overcharge', description: 'You may have paid more than expected. Route conditions can still matter.', className: 'ff-fare-overcharge' },
  { icon: Clock, status: 'Estimated Only', description: 'The result uses a verified fare rule, but not a route-specific official matrix.', className: 'ff-fare-estimated' },
  { icon: Database, status: 'Data Not Available', description: 'FareFair does not have enough verified information yet.', className: 'ff-fare-unavailable' },
];

const faq = [
  ['Does FareFair work without internet?', 'FareFair needs an internet connection to retrieve current verified information from the database.'],
  ['Is FareFair a government agency?', 'No. FareFair is an independent consumer-protection tool that cites official sources where available.'],
  ['What if my transportation type is missing?', 'That means the database does not yet contain a verified record for it. FareFair should not invent one.'],
  ['Can FareFair file a complaint for me?', 'Not currently. FareFair helps you prepare and save a report, but formal complaints must still be filed with the proper agency.'],
] as const;

export function HowItWorksPage() {
  return (
    <MotionPage className="ff-page">
      <header className="ff-page-header">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-[var(--ff-accent)]">Simple by design</p>
        <h1 className="ff-page-title mt-1">How FareFair Works</h1>
        <p className="ff-page-subtitle">The app separates verified facts, calculated estimates and missing data so consumers can understand how a result was produced.</p>
      </header>

      <section aria-labelledby="steps-title">
        <h2 id="steps-title" className="mb-4 text-xl font-light text-[var(--ff-accent-soft)]">Check a fare in five steps</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {steps.map(({ icon: Icon, number, title, description }, index) => (
            <motion.article key={number} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .055 }} className="ff-card p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent-soft)]"><Icon size={18} /></span>
                <span className="text-sm font-light tracking-[.18em] text-[var(--ff-accent)]">{number}</span>
              </div>
              <h3 className="mt-5 text-base font-medium text-[var(--ff-text)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-muted)]">{description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="results-title">
        <h2 id="results-title" className="mb-4 text-xl font-light text-[var(--ff-accent-soft)]">What the results mean</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {resultTypes.map(({ icon: Icon, status, description, className }) => (
            <div key={status} className={`rounded-2xl p-4 ${className}`}>
              <div className="flex items-start gap-3">
                <Icon size={20} aria-hidden className="mt-0.5 shrink-0" />
                <div><p className="font-medium">{status}</p><p className="mt-1 text-sm opacity-90">{description}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 ff-card p-5" aria-labelledby="data-title">
        <h2 id="data-title" className="text-xl font-light text-[var(--ff-accent-soft)]">About our data</h2>
        <div className="mt-4 grid gap-4 text-sm leading-relaxed text-[var(--ff-text-muted)] md:grid-cols-2">
          <p>Fare information is designed to be sourced from government documents, regulatory orders and authoritative agency or establishment sources.</p>
          <p>Calculated results are labeled separately from route-specific verified fares. Missing data should remain missing instead of being filled with fake records.</p>
          <p>Every source record can carry publication, effective and last-checked dates so old information is easier to identify.</p>
          <p>The Sources &amp; Proof page is the evidence layer: users can see what information a source supports and open the original link.</p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="faq-title">
        <h2 id="faq-title" className="mb-4 text-xl font-light text-[var(--ff-accent-soft)]">Common questions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faq.map(([q, a]) => (
            <article key={q} className="ff-card p-4">
              <p className="flex gap-2 text-sm font-medium text-[var(--ff-text)]"><HelpCircle size={16} className="mt-0.5 shrink-0 text-[var(--ff-accent)]" />{q}</p>
              <p className="mt-2 pl-6 text-sm leading-relaxed text-[var(--ff-text-muted)]">{a}</p>
            </article>
          ))}
        </div>
      </section>
    </MotionPage>
  );
}
