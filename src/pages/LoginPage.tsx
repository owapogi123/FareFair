import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MotionPage } from '../components/ui/MotionPage';

// Friendlier messages for common Supabase auth errors.
const FRIENDLY_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please confirm your email first — check your inbox.',
  'User already registered': 'An account with this email already exists. Try signing in.',
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  return FRIENDLY_ERRORS[message] ?? message;
}

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

function validatePassword(password: string, isSignup: boolean): string | null {
  if (!password) return 'Password is required.';
  if (isSignup && password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode() {
    setIsSignup((v) => !v);
    setFieldErrors({});
    setAuthError(null);
    setNotice(null);
  }

  function setError(message: string, hint?: string) {
    setAuthError(hint ? `${message} ${hint}` : message);
  }

  async function sendPasswordReset() {
    setAuthError(null);
    setNotice(null);

    const emailError = validateEmail(email);
    setFieldErrors({ email: emailError ?? undefined });
    if (emailError) return;

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured.', 'Check your .env file.');
      return;
    }

    try {
      await supabase.auth.resetPasswordForEmail(email.trim());
      setNotice('Password reset link sent — check your inbox.');
    } catch (error) {
      setAuthError(getErrorMessage(error));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setNotice(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, isSignup);
    setFieldErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
    if (emailError || passwordError) return;

    if (!isSupabaseConfigured()) {
      setError('Authentication is not configured.', 'Check your .env file.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setNotice('Account created! Check your email for a confirmation link before signing in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate(redirectTo, { replace: true });
      }
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <MotionPage className="ff-page flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-[420px]">
        <div className="ff-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--ff-primary)]">
              <ShieldCheck size={24} className="text-white" aria-hidden />
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--ff-text)]">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--ff-text-muted)]">
              {isSignup ? 'Join FareFair in making fares fair for everyone.' : 'Sign in to continue to FareFair.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="ff-label">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                className={`ff-input ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : ''}`}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
              {fieldErrors.email && (
                <p id="login-email-error" className="text-sm text-red-600" role="alert">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="ff-label">Password</label>
                {!isSignup && (
                  <button type="button" onClick={sendPasswordReset} className="text-xs font-medium text-[var(--ff-accent)] hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  disabled={submitting}
                  className={`ff-input pr-12 ${fieldErrors.password ? 'border-red-400 focus:border-red-500' : ''}`}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-lg text-[var(--ff-text-muted)] hover:bg-[var(--ff-tint)] hover:text-[var(--ff-text)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} aria-hidden /> : <Eye size={17} aria-hidden />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" className="text-sm text-red-600" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            {authError && (
              <div className="ff-fare-overcharge rounded-2xl px-4 py-3 text-sm" role="alert">{authError}</div>
            )}

            {notice && (
              <div className="ff-fare-matches rounded-2xl px-4 py-3 text-sm" role="status">{notice}</div>
            )}

            <button type="submit" className="ff-btn-primary w-full" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <LogIn size={18} aria-hidden />}
              {submitting ? (isSignup ? 'Creating account...' : 'Signing in...') : isSignup ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--ff-text-muted)]">
            {isSignup ? 'Already have an account?' : 'New to FareFair?'}{' '}
            <button type="button" onClick={switchMode} className="font-medium text-[var(--ff-accent)] hover:underline">
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--ff-text-muted)]">
          <Link to="/" className="hover:text-[var(--ff-text)] hover:underline">Back to home</Link>
        </p>
      </div>
    </MotionPage>
  );
}
