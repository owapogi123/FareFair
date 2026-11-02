'use client';

import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Globe, ChevronRight, Users, Star, CheckCircle } from 'lucide-react';
import { CinematicCanvas } from '../components/ui/CinematicCanvas';
import { CinematicErrorBoundary } from '../components/ui/CinematicErrorBoundary';
import { ScrollProgressWrapper } from '../components/ui/ScrollProgressWrapper';
import { isSupabaseConfigured } from '../lib/supabase';

const trustPoints = [
  { icon: ShieldCheck, label: 'Government-backed sources', description: 'Fare data is traceable to official documents and authoritative sources.' },
  { icon: Globe, label: 'Effective dates shown', description: 'See when a fare or rule became effective.' },
  { icon: CheckCircle, label: 'Discounts explained', description: 'Eligibility, requirements and legal basis stay visible.' },
  { icon: Users, label: 'Verification status', description: 'Records are labeled verified, calculated, unverified or conflicting.' },
  { icon: Star, label: 'Sources available', description: 'Open the supporting source instead of taking a claim on trust.' },
  { icon: ChevronRight, label: 'Estimates labeled', description: 'Calculated estimates are never presented as official route fares.' },
];

const audiences = [
  { icon: Users, label: 'Daily commuters' },
  { icon: Globe, label: 'Foreign tourists' },
  { icon: Star, label: 'Students' },
  { icon: ShieldCheck, label: 'Senior citizens' },
  { icon: CheckCircle, label: 'PWDs' },
  { icon: ChevronRight, label: 'Filipino families' },
];

const heroFeatures = [
  'Fare Transparency',
  'Route Discovery',
  'Commuter Discounts',
  'Sources & Proof',
];

export function HomePage() {
  const configured = isSupabaseConfigured();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <ScrollProgressWrapper />
      <div className="relative z-0 min-h-screen">
        {/* Hero Section */}
        <section className="ff-hero" aria-labelledby="hero-headline">
          {/* Cinematic 3D Canvas - Constrained Visual Container */}
          <div className="ff-hero__visual" aria-hidden="true">
            <CinematicErrorBoundary
              fallback={
                <div className="ff-hero__canvas" style={{ background: 'linear-gradient(180deg, var(--ff-bg) 0%, var(--ff-bg-deep) 100%)' }} aria-hidden="true">
                  <div className="w-full h-full flex items-end justify-center" style={{ padding: '0 24px 60px' }}>
                    {/* Premium Static Jeepney Illustration Fallback */}
                    <svg
                      className="w-full max-w-[600px] h-auto"
                      viewBox="0 0 600 300"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      role="img"
                      aria-label="FareFair jeepney illustration"
                    >
                      <defs>
                        <linearGradient id="bodyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4d7dc" />
                          <stop offset="100%" stopColor="#c8cbd1" />
                        </linearGradient>
                        <linearGradient id="roofGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9b2642" />
                          <stop offset="100%" stopColor="#8C203D" />
                        </linearGradient>
                        <linearGradient id="chassisGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2a2a3e" />
                          <stop offset="100%" stopColor="#1a1a2e" />
                        </linearGradient>
                        <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#1a2a3a" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2a3a4a" stopOpacity="0.5" />
                        </linearGradient>
                        <radialGradient id="wheelGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#c8cbd1" />
                          <stop offset="100%" stopColor="#1a1a2e" />
                        </radialGradient>
                        <filter id="softShadow" x="-50%" y="0%" width="200%" height="150%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                          <feOffset dx="0" dy="8" result="offsetBlur" />
                          <feComponentTransfer>
                            <feFuncA type="linear" slope="0.15" />
                          </feComponentTransfer>
                          <feMerge>
                            <feMergeNode in="offsetBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Contact Shadow */}
                      <ellipse cx="300" cy="265" rx="180" ry="8" fill="#1a1a2e" opacity="0.12" />

                      {/* Chassis / Undercarriage */}
                      <rect x="80" y="195" width="440" height="18" rx="3" fill="url(#chassisGradient)" filter="url(#softShadow)" />

                      {/* Main Body - Lower */}
                      <path d="M100 135 L100 195 L500 195 L500 135 Q500 125 490 120 L110 120 Q100 125 100 135 Z" fill="url(#bodyGradient)" filter="url(#softShadow)" />

                      {/* Main Body - Upper (passenger cabin) */}
                      <path d="M110 85 L110 135 L490 135 L490 85 Q490 75 480 70 L120 70 Q110 75 110 85 Z" fill="url(#bodyGradient)" filter="url(#softShadow)" />

                      {/* Roof */}
                      <path d="M95 70 L95 58 Q95 50 105 45 L495 45 Q505 50 505 58 L505 70 Z" fill="url(#roofGradient)" filter="url(#softShadow)" />

                      {/* Roof front curve */}
                      <path d="M495 45 Q510 45 510 58 L510 70" stroke="url(#roofGradient)" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#softShadow)" />

                      {/* Roof rear curve */}
                      <path d="M105 45 Q90 45 90 58 L90 70" stroke="url(#roofGradient)" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#softShadow)" />

                      {/* Front Grille Area */}
                      <rect x="500" y="120" width="16" height="70" rx="2" fill="#1a1a2e" />

                      {/* Grille Details - Horizontal bars */}
                      <g fill="#2a2a3e">
                        <rect x="502" y="128" width="12" height="4" rx="1" />
                        <rect x="502" y="138" width="12" height="4" rx="1" />
                        <rect x="502" y="148" width="12" height="4" rx="1" />
                        <rect x="502" y="158" width="12" height="4" rx="1" />
                        <rect x="502" y="168" width="12" height="4" rx="1" />
                      </g>

                      {/* Headlights */}
                      <g filter="url(#softShadow)">
                        <circle cx="508" cy="135" r="12" fill="#fff8e7" opacity="0.9" />
                        <circle cx="508" cy="135" r="8" fill="#fff8e7" opacity="0.6" />
                        <circle cx="508" cy="175" r="12" fill="#fff8e7" opacity="0.9" />
                        <circle cx="508" cy="175" r="8" fill="#fff8e7" opacity="0.6" />
                      </g>

                      {/* Headlight bezels */}
                      <g fill="none" stroke="#c8cbd1" strokeWidth="2.5">
                        <circle cx="508" cy="135" r="14" />
                        <circle cx="508" cy="175" r="14" />
                      </g>

                      {/* Turn signals */}
                      <circle cx="512" cy="110" r="6" fill="#ff8c00" opacity="0.4" />
                      <circle cx="512" cy="200" r="6" fill="#ff8c00" opacity="0.4" />

                      {/* Windshield */}
                      <path d="M180 85 Q180 78 188 75 L462 75 Q470 78 470 85 L470 135 L180 135 Z" fill="url(#glassGradient)" />

                      {/* Windshield frame */}
                      <path d="M180 85 Q180 78 188 75 L462 75 Q470 78 470 85" fill="none" stroke="#c8cbd1" strokeWidth="2" opacity="0.6" />

                      {/* Side Windows - Driver side */}
                      <path d="M115 135 L115 85 Q125 78 135 75 L280 75 Q290 78 290 85 L290 135 Z" fill="url(#glassGradient)" opacity="0.4" />

                      {/* Side Windows - Passenger side */}
                      <path d="M320 135 L320 85 Q330 78 340 75 L480 75 Q490 78 490 85 L490 135 Z" fill="url(#glassGradient)" opacity="0.4" />

                      {/* Rear Window */}
                      <path d="M110 135 L110 85 Q100 78 90 75 L90 85 Z" fill="url(#glassGradient)" opacity="0.5" />

                      {/* Side Entry - Passenger side */}
                      <path d="M280 135 L280 185 L380 185 L380 135 Z" fill="url(#bodyGradient)" filter="url(#softShadow)" />
                      <path d="M280 185 L280 193 L380 193 L380 185 Z" fill="#2a2a3e" filter="url(#softShadow)" />

                      {/* Front Bumper */}
                      <rect x="500" y="193" width="10" height="20" rx="2" fill="#2a2a3e" />

                      {/* Rear Bumper */}
                      <rect x="90" y="193" width="10" height="20" rx="2" fill="#2a2a3e" />

                      {/* Wheels - Front Right */}
                      <g filter="url(#softShadow)">
                        <circle cx="380" cy="265" r="38" fill="#0d0d0d" />
                        <circle cx="380" cy="265" r="28" fill="url(#wheelGradient)" />
                        <circle cx="380" cy="265" r="10" fill="#1a1a2e" />
                        <g fill="#a0a3a8">
                          <circle cx="380" cy="265" r="4" />
                          <circle cx="405" cy="248" r="4" />
                          <circle cx="418" cy="265" r="4" />
                          <circle cx="405" cy="282" r="4" />
                          <circle cx="355" cy="248" r="4" />
                        </g>
                      </g>

                      {/* Wheels - Front Left */}
                      <g filter="url(#softShadow)">
                        <circle cx="380" cy="265" r="38" fill="#0d0d0d" />
                        <circle cx="380" cy="265" r="28" fill="url(#wheelGradient)" />
                        <circle cx="380" cy="265" r="10" fill="#1a1a2e" />
                        <g fill="#a0a3a8">
                          <circle cx="380" cy="265" r="4" />
                          <circle cx="405" cy="248" r="4" />
                          <circle cx="418" cy="265" r="4" />
                          <circle cx="405" cy="282" r="4" />
                          <circle cx="355" cy="248" r="4" />
                        </g>
                      </g>

                      {/* Wheels - Rear Right */}
                      <g filter="url(#softShadow)">
                        <circle cx="220" cy="265" r="38" fill="#0d0d0d" />
                        <circle cx="220" cy="265" r="28" fill="url(#wheelGradient)" />
                        <circle cx="220" cy="265" r="10" fill="#1a1a2e" />
                        <g fill="#a0a3a8">
                          <circle cx="220" cy="265" r="4" />
                          <circle cx="245" cy="248" r="4" />
                          <circle cx="258" cy="265" r="4" />
                          <circle cx="245" cy="282" r="4" />
                          <circle cx="195" cy="248" r="4" />
                        </g>
                      </g>

                      {/* Wheels - Rear Left */}
                      <g filter="url(#softShadow)">
                        <circle cx="220" cy="265" r="38" fill="#0d0d0d" />
                        <circle cx="220" cy="265" r="28" fill="url(#wheelGradient)" />
                        <circle cx="220" cy="265" r="10" fill="#1a1a2e" />
                        <g fill="#a0a3a8">
                          <circle cx="220" cy="265" r="4" />
                          <circle cx="245" cy="248" r="4" />
                          <circle cx="258" cy="265" r="4" />
                          <circle cx="245" cy="282" r="4" />
                          <circle cx="195" cy="248" r="4" />
                        </g>
                      </g>

                      {/* Fare sign on roof */}
                      <rect x="270" y="35" width="60" height="12" rx="2" fill="#FFD700" opacity="0.9" filter="url(#softShadow)" />
                      <text x="300" y="44" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1a1a2e" fontFamily="Inter, system-ui">FARE</text>

                      {/* Small FareFair logo on side */}
                      <circle cx="290" cy="105" r="14" fill="#8C203D" opacity="0.8" />
                      <text x="290" y="110" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" fontFamily="Inter, system-ui">FF</text>

                      {/* Subtle ambient particles */}
                      <g opacity="0.06" fill="#8C203D">
                        <circle cx="80" cy="60" r="2" />
                        <circle cx="120" cy="40" r="1.5" />
                        <circle cx="160" cy="70" r="2" />
                        <circle cx="520" cy="50" r="1.5" />
                        <circle cx="560" cy="80" r="2" />
                        <circle cx="40" cy="100" r="1" />
                        <circle cx="580" cy="120" r="1.5" />
                      </g>
                      <g opacity="0.04" fill="#FFD700">
                        <circle cx="100" cy="50" r="1.5" />
                        <circle cx="540" cy="60" r="1" />
                        <circle cx="60" cy="90" r="1.5" />
                        <circle cx="580" cy="100" r="1" />
                      </g>
                    </svg>
                  </div>
                </div>
              }
            >
              <CinematicCanvas />
            </CinematicErrorBoundary>
          </div>

          {/* Decorative Background Wordmark */}
          <span className="ff-hero__decorative-text" aria-hidden="true">FAREFAIR</span>

          {/* Hero Content Layer */}
          <div className="ff-hero__content">
            <div className="ff-hero__badge">
              <ShieldCheck size={13} className="ff-hero__badge-icon" aria-hidden />
              Philippine commuter platform
            </div>

            <h1 id="hero-headline" className="ff-hero__headline">
              Know the fare. Travel with confidence.
            </h1>

            <p className="ff-hero__description">
              Check public transport fares, explore routes, and see the sources behind the information.
            </p>

            <div className="ff-hero__cta-group">
              <Link to="/check-fare" className="ff-hero__btn ff-hero__btn--primary">
                <ChevronRight size={18} aria-hidden />
                Check My Fare
              </Link>
              <Link to="/routes" className="ff-hero__btn ff-hero__btn--secondary">
                <Globe size={18} aria-hidden />
                Find My Route
              </Link>
            </div>
          </div>

          {/* Bottom Feature Strip */}
          <div className="ff-hero__features" role="list" aria-label="Key features">
            {heroFeatures.map((feature, index) => (
              <div key={feature} className="ff-hero__feature" role="listitem">
                <span className="ff-hero__feature-label">{feature}</span>
                {index < heroFeatures.length - 1 && (
                  <span className="ff-hero__feature-divider" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="relative z-20 py-16 sm:py-24 lg:py-32 px-4 sm:px-8 lg:px-12" aria-labelledby="trust-title">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent)]">
                <ShieldCheck size={20} aria-hidden />
              </span>
              <div>
                <h2 id="trust-title" className="text-2xl sm:text-3xl font-light text-[var(--ff-text)]">Why trust FareFair?</h2>
                <p className="mt-1 text-sm text-[var(--ff-text-muted)]">Hover or focus each item for a quick explanation.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trustPoints.map(({ icon: Icon, label, description }, index) => (
                <motion.div
                  key={label}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ delay: index * 0.05, duration: 0.28 }}
                  tabIndex={0}
                  className="group relative rounded-2xl border border-transparent p-4 sm:p-5 transition-colors hover:border-[var(--ff-border)] hover:bg-[var(--ff-tint-soft)] focus:border-[var(--ff-border)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--ff-border)] text-[var(--ff-accent)]">
                      <Icon size={18} aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[var(--ff-text)]">{label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--ff-text-muted)]">{description}</p>
                    </div>
                  </div>
                  <span className="pointer-events-none absolute left-4 right-4 top-full mt-2 z-20 hidden rounded-xl border border-[var(--ff-border)] bg-[var(--ff-popover)] p-3 text-xs text-[var(--ff-text-muted)] shadow-xl group-hover:block group-focus:block lg:block lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:group-focus:opacity-100">
                    {description}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Audience Marquee */}
        <section className="relative z-20 pb-8 px-4 sm:px-8" aria-labelledby="audience-title">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-4 flex items-center gap-2">
              <Users size={17} className="text-[var(--ff-accent)]" aria-hidden />
              <h2 id="audience-title" className="text-sm font-medium text-[var(--ff-text-muted)]">Made for people moving around the Philippines</h2>
            </div>
            <div className="overflow-hidden mask-gradient" style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
              <motion.div
                className="flex gap-3 min-w-max"
                animate={reduceMotion ? {} : { x: [-window.innerWidth, 0] }}
                transition={reduceMotion ? {} : { duration: 30, repeat: Infinity, ease: 'linear' }}
                style={{ willChange: 'transform' }}
              >
                {[...audiences, ...audiences].map(({ icon: Icon, label }, index) => (
                  <span key={`${label}-${index}`} className="ff-audience-pill group whitespace-nowrap flex items-center gap-2">
                    <Icon size={18} className="text-[var(--ff-accent)] transition-transform duration-200 group-hover:scale-110" aria-hidden />
                    <span className="text-sm">{label}</span>
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA Band */}
        <section className="relative z-20 py-12 sm:py-16 lg:py-24 px-4 sm:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="relative rounded-[32px] sm:rounded-[40px] bg-[var(--ff-primary)] p-8 sm:p-12 lg:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--ff-accent)]/20 via-transparent to-[var(--ff-accent)]/20 blur-3xl" />
              <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] tracking-[-.02em] text-white">
                Ready to know the fare?
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg font-light leading-relaxed text-white/70">
                Join thousands of commuters who check before they pay. Free, no ads, official data only.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row items-center justify-center">
                <Link to="/check-fare" className="ff-btn-primary min-w-[200px] text-base bg-white text-[var(--ff-primary)] hover:bg-white/90">
                  <ChevronRight size={18} aria-hidden />
                  Check My Fare
                </Link>
                <Link to="/routes" className="ff-btn-secondary min-w-[180px] text-base border-white/30 text-white hover:bg-white/10">
                  <Globe size={18} aria-hidden />
                  Find My Route
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Database not configured notice */}
        {!configured && (
          <section className="relative z-20 mx-auto max-w-[1280px] px-4 sm:px-8 pb-8">
            <div className="rounded-2xl border border-[rgba(138,90,11,.28)] bg-[var(--ff-amber-bg)] p-4">
              <p className="text-sm font-semibold text-[var(--ff-amber)]">Database not configured</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ff-text-muted)]">
                Set your Supabase credentials in <code className="rounded bg-black/5 px-1.5 py-0.5">.env</code> to connect to live data.
              </p>
            </div>
          </section>
        )}
      </div>
    </>
  );
}