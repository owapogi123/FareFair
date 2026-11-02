import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MobileBottomNav, DesktopNavigation } from './components/nav/AppNav';
import { LoadingState } from './components/ui/LoadingState';
import { CursorGlow } from './components/ui/CursorGlow';
import { Footer } from './components/layout/Footer';
import { supabase } from './lib/supabase';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const CheckFarePage = lazy(() => import('./pages/CheckFarePage').then((m) => ({ default: m.CheckFarePage })));
const RoutesPage = lazy(() => import('./pages/RoutesPage').then((m) => ({ default: m.RoutesPage })));
const DiscountsPage = lazy(() => import('./pages/DiscountsPage').then((m) => ({ default: m.DiscountsPage })));
const TouristPricesPage = lazy(() => import('./pages/TouristPricesPage').then((m) => ({ default: m.TouristPricesPage })));
const ReportPage = lazy(() => import('./pages/ReportPage').then((m) => ({ default: m.ReportPage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((m) => ({ default: m.SourcesPage })));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

function PageLoader() {
  return <LoadingState message="Loading FareFair..." className="py-20" />;
}

// Scrolls to the top whenever the page changes, so a new page never opens mid-scroll.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Sends logged-in users to home instead of showing them the login page again.
function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
  }, []);

  if (session === null) return <PageLoader />;
  return session ? <Navigate to="/" replace /> : <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense fallback={<PageLoader />}>
        <ScrollToTop />
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/check-fare" element={<CheckFarePage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/discounts" element={<DiscountsPage />} />
          <Route path="/tourist-prices" element={<TouristPricesPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/login" element={<RedirectIfLoggedIn><LoginPage /></RedirectIfLoggedIn>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CursorGlow />
      <DesktopNavigation />
      <MobileBottomNav />
      <main className="ff-main" id="main-content">
        <AnimatedRoutes />
      </main>
      <Footer />
    </BrowserRouter>
  );
}
