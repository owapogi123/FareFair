import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { isSupabaseConfigured } from '../lib/supabase';
import { MotionPage } from '../components/ui/MotionPage';
import { InteractiveCard } from '../components/ui/InteractiveCard';
import { FareIcon, type FareIconName } from '../components/ui/FareIcons';

const quickActions: { to: string; icon: FareIconName; label: string; description: string }[] = [
  { to: '/check-fare', icon: 'fare', label: 'Check My Fare', description: 'Compare the amount you paid with verified fare data.' },
  { to: '/routes', icon: 'route', label: 'Find My Route', description: 'Search available routes and route details.' },
  { to: '/discounts', icon: 'discount', label: 'View Discounts', description: 'Understand Student, Senior and PWD eligibility.' },
  { to: '/tourist-prices', icon: 'tourist', label: 'Tourist Prices', description: 'Check common prices before you visit.' },
  { to: '/report', icon: 'report', label: 'Report Overcharge', description: 'Save the details of a fare concern.' },
];

const trustPoints: { icon: FareIconName; label: string; description: string }[] = [
  { icon: 'shield', label: 'Government-backed sources', description: 'Fare data is traceable to official documents and authoritative sources.' },
  { icon: 'calendar', label: 'Effective dates shown', description: 'See when a fare or rule became effective.' },
  { icon: 'discount', label: 'Discounts explained', description: 'Eligibility, requirements and legal basis stay visible.' },
  { icon: 'verified', label: 'Verification status', description: 'Records are labeled verified, calculated, unverified or conflicting.' },
  { icon: 'source', label: 'Sources available', description: 'Open the supporting source instead of taking a claim on trust.' },
  { icon: 'estimate', label: 'Estimates labeled', description: 'Calculated estimates are never presented as official route fares.' },
];

const audiences: { icon: FareIconName; label: string }[] = [
  { icon: 'commuter', label: 'Daily commuters' },
  { icon: 'traveler', label: 'Foreign tourists' },
  { icon: 'student', label: 'Students' },
  { icon: 'senior', label: 'Senior citizens' },
  { icon: 'pwd', label: 'PWDs' },
  { icon: 'family', label: 'Filipino families' },
];

const iconTile =
  'grid place-items-center border border-[var(--ff-border)] bg-[var(--ff-tint-soft)] text-[var(--ff-accent)]';

export function HomePage() {
  const configured = isSupabaseConfigured();
  const reduceMotion = useReducedMotion();

  return (
    <MotionPage className="ff-page">
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden rounded-[26px] border border-[var(--ff-border)] bg-[var(--ff-card)] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] px-3 py-1.5 text-xs font-medium text-[var(--ff-text-muted)]">
            <FareIcon name="shield" size={13} className="text-[var(--ff-accent)]" />
            Philippine fare transparency
          </div>

          <h1 className="max-w-3xl text-[clamp(2.7rem,8vw,5.5rem)] font-light leading-[.98] tracking-[-.055em]">
            <span className="ff-gradient-text">Know the fare.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-[var(--ff-text-muted)] sm:text-xl">
            Check verified fares, understand discounts, compare routes and see the proof before you pay.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/check-fare" className="ff-btn-primary ff-pulse-glow min-w-[180px] text-base">
              <FareIcon name="fare" size={18} />
              Check My Fare
            </Link>
            <Link to="/routes" className="ff-btn-secondary min-w-[170px] text-base">
              <FareIcon name="route" size={18} />
              Find My Route
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--ff-text-muted)]">
            <span className="inline-flex items-center gap-1.5"><FareIcon name="verified" size={13} className="text-[var(--ff-accent)]" /> Clear verification status</span>
            <span className="inline-flex items-center gap-1.5"><FareIcon name="source" size={13} className="text-[var(--ff-accent)]" /> Sources visible</span>
            <span className="inline-flex items-center gap-1.5"><FareIcon name="phone" size={13} className="text-[var(--ff-accent)]" /> Built for mobile</span>
          </div>
        </motion.div>
      </section>

      {!configured && (
        <section className="mt-5 rounded-2xl border border-[rgba(138,90,11,.28)] bg-[var(--ff-amber-bg)] p-4">
          <p className="text-sm font-semibold text-[var(--ff-amber)]">Database not configured</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--ff-text-muted)]">
            Set your Supabase credentials in <code className="rounded bg-black/5 px-1.5 py-0.5">.env</code> to connect to live data.
          </p>
        </section>
      )}

      {/* ---------- Quick actions ---------- */}
      <section className="mt-9" aria-labelledby="quick-actions-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="quick-actions-title" className="text-2xl font-light text-[var(--ff-text)]">Where to?</h2>
          <p className="hidden max-w-sm text-right text-xs text-[var(--ff-text-muted)] sm:block">Simple tools first. Evidence and details stay one level deeper.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(({ to, icon, label, description }, index) => {
            const featured = index === 0;
            return (
              <InteractiveCard key={to} delay={index * 0.055} className={featured ? 'md:col-span-2 lg:col-span-1' : ''}>
                <Link
                  to={to}
                  aria-label={label}
                  className={`group flex h-full min-h-[150px] flex-col justify-between p-5 ${
                    featured ? 'bg-[var(--ff-primary)]' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`h-11 w-11 rounded-2xl transition-transform duration-200 group-hover:scale-105 ${
                        featured ? 'grid place-items-center bg-white/10 text-white' : iconTile
                      }`}
                    >
                      <FareIcon name={icon} size={22} />
                    </span>
                    <span
                      className={`grid h-8 w-8 place-items-center rounded-full transition-colors duration-200 ${
                        featured
                          ? 'text-white/60 group-hover:bg-white/10 group-hover:text-white'
                          : 'text-[var(--ff-text-muted)] group-hover:bg-[var(--ff-tint)] group-hover:text-[var(--ff-accent)]'
                      }`}
                    >
                      <FareIcon name="chevron" size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="mt-5">
                    <h3 className={`text-base font-medium ${featured ? 'text-white' : 'text-[var(--ff-text)]'}`}>{label}</h3>
                    <p className={`mt-1.5 text-sm leading-relaxed ${featured ? 'text-white/70' : 'text-[var(--ff-text-muted)]'}`}>{description}</p>
                  </div>
                </Link>
              </InteractiveCard>
            );
          })}
        </div>
      </section>

      {/* ---------- Trust ---------- */}
      <section className="mt-10 rounded-[22px] border border-[var(--ff-border)] bg-[var(--ff-card)] p-5 sm:p-6" aria-labelledby="trust-title">
        <div className="mb-5 flex items-center gap-3">
          <span className={`${iconTile} h-10 w-10 rounded-xl`}>
            <FareIcon name="shield" size={20} />
          </span>
          <div>
            <h2 id="trust-title" className="text-xl font-light text-[var(--ff-text)]">Why trust FareFair?</h2>
            <p className="mt-1 text-xs text-[var(--ff-text-muted)]">Hover or focus each item for a quick explanation.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trustPoints.map(({ icon, label, description }, index) => (
            <motion.div
              key={label}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ delay: index * 0.05, duration: 0.28 }}
              tabIndex={0}
              className="group relative rounded-2xl border border-transparent p-3 transition-colors hover:border-[var(--ff-border)] hover:bg-[var(--ff-tint-soft)] focus:border-[var(--ff-border)]"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent)]">
                  <FareIcon name={icon} size={18} />
                </span>
                <div>
                  <p className="text-sm font-medium text-[var(--ff-text)]">{label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--ff-text-muted)]">{description}</p>
                </div>
              </div>
              <span className="pointer-events-none absolute left-3 right-3 top-[calc(100%+.35rem)] z-20 hidden rounded-xl border border-[var(--ff-border)] bg-[var(--ff-popover)] p-2.5 text-xs text-[var(--ff-text-muted)] shadow-xl group-hover:block group-focus:block lg:block lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus:opacity-100">
                {description}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Audience marquee ---------- */}
      <section className="mt-10 pb-2" aria-labelledby="audience-title">
        <div className="mb-4 flex items-center gap-2">
          <FareIcon name="people" size={17} className="text-[var(--ff-accent)]" />
          <h2 id="audience-title" className="text-sm font-medium text-[var(--ff-text-muted)]">Made for people moving around the Philippines</h2>
        </div>
        <div className="ff-marquee">
          <div className="ff-marquee-track">
            {[...audiences, ...audiences].map(({ icon, label }, index) => (
              <span key={`${label}-${index}`} className="ff-audience-pill group">
                <FareIcon name={icon} size={18} className="text-[var(--ff-accent)] transition-transform duration-200 group-hover:scale-110" />
                <span className="text-sm">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>
    </MotionPage>
  );
}