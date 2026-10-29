import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck,
  BookOpen,
  Users,
  Globe,
  FileText,
  Heart,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Mail,
  Send,
  Link as LinkIcon,
} from 'lucide-react';
import { MotionPage } from '../components/ui/MotionPage';
import { InteractiveCard } from '../components/ui/InteractiveCard';
import { FareIcon, type FareIconName } from '../components/ui/FareIcons';
import { Button } from '../components/ui/Button';

const trustSignals = [
  { icon: 'shield' as FareIconName, label: 'Government Sources', desc: 'LTFRB, DOTr, MMDA official documents' },
  { icon: 'verified' as FareIconName, label: 'Verified Data', desc: 'Every fare tagged: verified, calculated, or estimated' },
  { icon: 'source' as FareIconName, label: 'Open Sources', desc: 'Click any fare to see the original document' },
  { icon: 'calendar' as FareIconName, label: 'Effective Dates', desc: 'Know exactly when a fare rule applies' },
  { icon: 'discount' as FareIconName, label: 'Discounts Explained', desc: 'Student, Senior, PWD — eligibility & legal basis' },
  { icon: 'estimate' as FareIconName, label: 'Honest Estimates', desc: 'Calculated fares never sold as official' },
];

const team = [
  { name: 'Juan Dela Cruz', role: 'Founder & Commuter Advocate', bio: 'Daily MRT rider who got tired of guessing fares.', icon: 'commuter' as FareIconName },
  { name: 'Maria Santos', role: 'Data & Policy Lead', bio: 'Former LTFRB researcher. Knows every memo by heart.', icon: 'verified' as FareIconName },
  { name: 'Carlos Reyes', role: 'Engineer', bio: 'Builds tools that work on ₱500 phones and 3G.', icon: 'phone' as FareIconName },
];

const partners = [
  { name: 'LTFRB', desc: 'Fare regulations & matrices', icon: 'shield' as FareIconName },
  { name: 'DOTr', desc: 'Transport policy & programs', icon: 'globe' as FareIconName },
  { name: 'MMDA', desc: 'Metro Manila traffic & routes', icon: 'route' as FareIconName },
  { name: 'DTI', desc: 'Consumer protection', icon: 'verified' as FareIconName },
];

const footerLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Data Sources', href: '/sources' },
  { label: 'Report an Error', href: '/report' },
  { label: 'API Docs', href: '#' },
  { label: 'Contact', href: '#' },
];

const socialLinks = [
  { icon: MessageSquare, href: '#', label: 'Community' },
  { icon: Send, href: '#', label: 'Twitter/X' },
  { icon: LinkIcon, href: '#', label: 'GitHub' },
  { icon: Mail, href: '#', label: 'Contact' },
];

/* 2D Animated Icon Wrapper — replaces 3D Ad3D */
interface AnimatedIconProps {
  icon: React.ElementType;
  size?: number;
  className?: string;
  delay?: number;
  fareIconName?: FareIconName; // For FareIcon component which needs a name prop
}

function AnimatedIcon({ icon: Icon, size = 28, className = '', delay = 0, fareIconName }: AnimatedIconProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.8, rotate: -12 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {fareIconName ? <FareIcon name={fareIconName} size={size} aria-hidden /> : <Icon size={size} aria-hidden />}
    </motion.div>
  );
}

/* Subtle 3D-like background depth — CSS only, no Three.js */
function BackgroundDepth() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -80]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 60]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -40]);

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-10 w-48 h-48 rounded-full bg-[rgba(179,32,58,.06)] blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 rounded-full bg-[rgba(179,32,58,.04)] blur-3xl" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div
        style={{ y: y1 }}
        className="absolute top-1/4 left-10 w-48 h-48 rounded-full bg-[rgba(179,32,58,.06)] blur-3xl"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-1/4 right-10 w-64 h-64 rounded-full bg-[rgba(179,32,58,.04)] blur-3xl"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[rgba(179,32,58,.02)] blur-[120px]"
      />
    </div>
  );
}

export function AboutPage() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -50]);

  return (
    <MotionPage className="min-h-screen">
      {/* ===== HERO ===== */}
      <section
        className="relative overflow-hidden rounded-none border-b border-[var(--ff-border)] bg-[var(--ff-bg-deep)] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24"
        aria-labelledby="about-hero-title"
      >
        <BackgroundDepth />

        <motion.div
          style={{ y }}
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--ff-border)] px-3 py-1.5 text-xs font-medium text-[var(--ff-text-muted)]">
            <ShieldCheck size={13} className="text-[var(--ff-accent)]" aria-hidden />
            About FareFair PH
          </div>

          <h1 id="about-hero-title" className="mb-4 text-[clamp(2.2rem,7vw,4.5rem)] font-light leading-[.98] tracking-[-.05em]">
            <span className="ff-gradient-text">Know the fare.</span>
            <br />
            <span className="font-normal text-[var(--ff-text-muted)]">Pay the right price.</span>
          </h1>

          <p className="mb-8 max-w-2xl mx-auto text-lg font-light leading-relaxed text-[var(--ff-text-muted)] sm:text-xl">
            FareFair is a non-profit, open-data project helping every Filipino commuter — students, seniors, PWDs, tourists, daily riders —
            verify transportation fares against official government records. No guesswork. No surprises.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/check-fare" className="ff-btn-primary ff-pulse-glow min-w-[200px] text-base">
              <FareIcon name="fare" size={18} />
              Check My Fare
            </Link>
            <Link to="/sources" className="ff-btn-secondary min-w-[200px] text-base">
              <FareIcon name="source" size={18} />
              View Sources
            </Link>
          </div>

          {/* 2D Hero Illustration — replaces 3D jeepney */}
          <motion.div
            className="mt-10 lg:mt-16 flex justify-center"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <AnimatedIcon icon={ShieldCheck} size={64} className="text-[var(--ff-accent)]/15" delay={0.3} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== MISSION ===== */}
      <section className="ff-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20" aria-labelledby="mission-title">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <h2 id="mission-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">
              Why We Exist
            </h2>
            <p className="mt-3 text-[var(--ff-text-muted)] max-w-2xl mx-auto">
              Every day, millions of Filipinos overpay because fare information is scattered, outdated, or hidden.
              FareFair centralizes, verifies, and presents it — so you don't have to guess.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Heart, label: 'Commuter-First', desc: 'Built by riders, for riders. No ads. No tracking. No agenda.' },
              { icon: BookOpen, label: 'Open Data', desc: 'All fare rules, sources, and calculations are publicly viewable.' },
              { icon: ShieldCheck, label: 'Government-Backed', desc: 'Data sourced from LTFRB, DOTr, MMDA official issuances.' },
              { icon: Sparkles, label: 'Always Current', desc: 'Effective dates on every fare. Expired rules flagged automatically.' },
              { icon: Users, label: 'Inclusive', desc: 'Student, Senior, PWD discounts with eligibility & legal basis.' },
              { icon: Globe, label: 'Tourist-Ready', desc: 'Common prices for attractions, food, transport — no tourist tax.' },
            ].map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group ff-card p-5 text-center transition-colors hover:border-[var(--ff-accent)] hover:bg-[var(--ff-tint-soft)]"
              >
                <AnimatedIcon icon={Icon} size={24} delay={i * 0.08} className="mb-3" />
                <h3 className="font-medium text-[var(--ff-text)]">{label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-muted)]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TRUST SIGNALS ===== */}
      <section className="ff-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20 bg-[var(--ff-card)]" aria-labelledby="trust-title">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <h2 id="trust-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">
              How We Keep Data Honest
            </h2>
            <p className="mt-3 text-[var(--ff-text-muted)] max-w-2xl mx-auto">
              Transparency isn't a badge — it's built into every record.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trustSignals.map(({ icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="group relative ff-card p-4 transition-colors hover:border-[var(--ff-accent)]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent)]">
                    <FareIcon name={icon} size={20} />
                  </span>
                  <h3 className="font-medium text-[var(--ff-text)]">{label}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--ff-text-muted)]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      <section className="ff-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20" aria-labelledby="team-title">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <h2 id="team-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">
              Small Team, Big Mission
            </h2>
            <p className="mt-3 text-[var(--ff-text-muted)] max-w-2xl mx-auto">
              We're commuters, researchers, and engineers who believe public data should serve the public.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="group ff-card p-5 text-center"
              >
                {/* 2D Avatar Circle with animated ring — replaces 3D coins */}
                <motion.div
                  className="mb-3 relative mx-auto h-24 w-24"
                  initial={false}
                  animate={{ rotate: reduceMotion ? 0 : 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{ willChange: 'transform' }}
                >
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--ff-accent)]/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--ff-accent)]/60" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' }} />
                  <AnimatedIcon icon={FareIcon} size={40} delay={i * 0.1} className="absolute inset-0 flex items-center justify-center" fareIconName={member.icon} />
                </motion.div>
                <h3 className="font-medium text-[var(--ff-text)]">{member.name}</h3>
                <p className="mt-1 text-sm text-[var(--ff-accent)] font-medium">{member.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ff-text-muted)]">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DATA PARTNERS ===== */}
      <section className="ff-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20 bg-[var(--ff-card)]" aria-labelledby="partners-title">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <h2 id="partners-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">
              Official Data Sources
            </h2>
            <p className="mt-3 text-[var(--ff-text-muted)] max-w-2xl mx-auto">
              We don't scrape. We reference. Every fare links to its governing document.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner, i) => (
              <motion.div
                key={partner.name}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="group ff-card p-4 text-center transition-colors hover:border-[var(--ff-accent)] hover:bg-[var(--ff-tint-soft)]"
              >
                <AnimatedIcon icon={FareIcon} size={20} delay={i * 0.06} className="mb-2" fareIconName={partner.icon} />
                <h3 className="font-medium text-[var(--ff-text)]">{partner.name}</h3>
                <p className="mt-1 text-xs text-[var(--ff-text-muted)]">{partner.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/sources" className="inline-flex items-center gap-2 ff-btn-secondary">
              Browse All Sources & Documents
              <ExternalLink size={16} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== OPEN SOURCE / COMMUNITY ===== */}
      <section className="ff-page px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20" aria-labelledby="community-title">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10 text-center">
            <h2 id="community-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">
              Open Source & Community-Driven
            </h2>
            <p className="mt-3 text-[var(--ff-text-muted)] max-w-2xl mx-auto">
              FareFair is built in the open. Found an error? Missing a route? Want to contribute?
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            <InteractiveCard delay={0} className="h-full">
              <div className="flex h-full flex-col items-center text-center p-5">
                <AnimatedIcon icon={LinkIcon} size={28} delay={0} className="mb-3" />
                <h3 className="font-medium text-[var(--ff-text)]">Contribute Code</h3>
                <p className="mt-2 text-sm text-[var(--ff-text-muted)]">React, TypeScript, Supabase — PRs welcome.</p>
                <Button variant="ghost" className="mt-4" asChild>
                  <Link to="#" className="flex items-center gap-1.5">View Repository <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </InteractiveCard>

            <InteractiveCard delay={0.05} className="h-full">
              <div className="flex h-full flex-col items-center text-center p-5">
                <AnimatedIcon icon={FileText} size={28} delay={0.05} className="mb-3" />
                <h3 className="font-medium text-[var(--ff-text)]">Submit Data</h3>
                <p className="mt-2 text-sm text-[var(--ff-text-muted)]">New fare matrix? Updated discount? Send it over.</p>
                <Button variant="ghost" className="mt-4" asChild>
                  <Link to="/report" className="flex items-center gap-1.5">Report Data <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </InteractiveCard>

            <InteractiveCard delay={0.1} className="h-full">
              <div className="flex h-full flex-col items-center text-center p-5">
                <AnimatedIcon icon={MessageSquare} size={28} delay={0.1} className="mb-3" />
                <h3 className="font-medium text-[var(--ff-text)]">Join Discussion</h3>
                <p className="mt-2 text-sm text-[var(--ff-text-muted)]">Help shape features, report bugs, share feedback.</p>
                <Button variant="ghost" className="mt-4" asChild>
                  <Link to="#" className="flex items-center gap-1.5">Community Forum <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative overflow-hidden rounded-[26px] border border-[var(--ff-border)] bg-[var(--ff-primary)] px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 mx-4 my-10 sm:mx-6 lg:mx-8" aria-labelledby="cta-title">
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Subtle 3D-like atmospheric depth — CSS gradients only */}
          <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[rgba(255,255,255,.03)] blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[rgba(179,32,58,.08)] blur-3xl" />
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 id="cta-title" className="text-2xl sm:text-3xl font-light text-white">
              Ready to check your fare?
            </h2>
            <p className="mt-3 text-lg font-light text-white/70">
              Takes 30 seconds. Uses official data. Shows you the proof.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/check-fare" className="ff-btn-primary ff-pulse-glow min-w-[200px] text-base bg-white text-[var(--ff-primary)] hover:bg-white/90">
                <FareIcon name="fare" size={18} className="text-[var(--ff-accent)]" />
                Check My Fare Now
              </Link>
              <Link to="/routes" className="ff-btn-secondary min-w-[200px] text-base border-white/30 text-white hover:bg-white/10">
                <FareIcon name="route" size={18} />
                Find My Route
              </Link>
            </div>
          </motion.div>

          {/* 2D Decorative Element — replaces 3D bus */}
          <motion.div
            className="absolute bottom-4 right-4 max-w-32 opacity-15 lg:max-w-40 pointer-events-none"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            aria-hidden
          >
            <AnimatedIcon icon={ShieldCheck} size={80} className="text-white" />
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="ff-footer px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16" role="contentinfo">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5" aria-label="FareFair home">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--ff-primary)]">
                  <ShieldCheck size={19} className="text-white" aria-hidden />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold tracking-tight text-[var(--ff-text)]">FareFair</span>
                  <span className="block text-[10px] font-medium tracking-[0.18em] text-[var(--ff-accent)]">PH</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--ff-text-muted)]">
                Know the fare. Pay the right price. Every ride, every time.
              </p>
              <div className="mt-6 flex gap-4">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-text-muted)] transition-colors hover:border-[var(--ff-accent)] hover:text-[var(--ff-accent)]"
                    aria-label={label}
                  >
                    <Icon size={18} aria-hidden />
                  </a>
                ))}
              </div>
            </div>

            <nav aria-label="Quick links">
              <h3 className="font-medium text-[var(--ff-text)]">Quick Links</h3>
              <ul className="mt-3 space-y-2">
                {[
                  { label: 'Check My Fare', href: '/check-fare' },
                  { label: 'Find My Route', href: '/routes' },
                  { label: 'Discounts', href: '/discounts' },
                  { label: 'Tourist Prices', href: '/tourist-prices' },
                  { label: 'Report Overcharge', href: '/report' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-[var(--ff-text-muted)] hover:text-[var(--ff-accent)] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal & Info">
              <h3 className="font-medium text-[var(--ff-text)]">Legal & Info</h3>
              <ul className="mt-3 space-y-2">
                {footerLinks.map((item) => (
                  <li key={item.label}>
                    <Link to={item.href} className="text-sm text-[var(--ff-text-muted)] hover:text-[var(--ff-accent)] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--ff-border)] flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--ff-text-muted)]">
              © {new Date().getFullYear()} FareFair PH. Non-profit. Open source. Not affiliated with any government agency.
            </p>
            <p className="text-xs text-[var(--ff-text-muted)]">
              Data sourced from LTFRB, DOTr, MMDA. <Link to="/sources" className="underline hover:text-[var(--ff-accent)]">View all sources</Link>
            </p>
          </div>
        </div>
      </footer>
    </MotionPage>
  );
}