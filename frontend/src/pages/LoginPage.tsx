import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [showSplash, setShowSplash] = useState(
    () => sessionStorage.getItem('milestone_splash_seen') !== 'true',
  );
  const [isSplashExiting, setIsSplashExiting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showSplash) return;

    sessionStorage.setItem('milestone_splash_seen', 'true');
    const revealCardTimer = window.setTimeout(() => setIsSplashExiting(true), 4600);
    const hideSplashTimer = window.setTimeout(() => setShowSplash(false), 5100);

    return () => {
      window.clearTimeout(revealCardTimer);
      window.clearTimeout(hideSplashTimer);
    };
  }, [showSplash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await api.auth.register({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
        });
        setAuth(res.access_token, res.user, password);
      } else {
        const res = await api.auth.login({
          email: email.trim(),
          password,
        });
        setAuth(res.access_token, res.user, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@milestone.local');
    setPassword('MileStone2026!');
    setFullName('Demo User');
  };
  const isAuthCardVisible = !showSplash || isSplashExiting;

  return (
    <div className="relative isolate min-h-screen flex items-center justify-center overflow-hidden p-4 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-[#0b0f19] dark:via-[#111827] dark:to-[#0f172a] text-slate-900 dark:text-slate-100">
      <div aria-hidden="true" className="auth-orb auth-orb-one" />
      <div aria-hidden="true" className="auth-orb auth-orb-two" />
      {showSplash && (
        <div
          aria-hidden="true"
          className={`auth-splash fixed inset-0 z-20 flex flex-col items-center justify-center ${
            isSplashExiting
              ? 'opacity-0 scale-95 pointer-events-none'
              : 'opacity-100 scale-100'
          }`}
        >
          <div className="auth-splash-glow" />
          <img
            src="/logo-mark.png"
            alt=""
            className="auth-splash-logo relative z-10 w-24 h-24 object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-[0_8px_20px_rgba(99,102,241,0.28)]"
          />
          <div className="auth-splash-copy relative z-10 mt-5 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              MileStone
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Personal Productivity
            </p>
            <div className="mx-auto mt-6 w-56 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
              <div className="auth-splash-progress h-full rounded-full" />
            </div>
            <p className="mt-3 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
              Preparing your workspace...
            </p>
          </div>
        </div>
      )}
      <div
        aria-hidden={!isAuthCardVisible}
        inert={!isAuthCardVisible}
        className={`auth-card relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden p-8 sm:p-10 space-y-6 transition-all duration-500 ease-out ${
          isAuthCardVisible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-5 scale-[0.98] pointer-events-none'
        }`}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/logo-mark.png"
            alt="MileStone Logo"
            className="auth-logo w-14 h-14 object-contain mx-auto mb-3 mix-blend-multiply dark:mix-blend-normal drop-shadow-[0_8px_20px_rgba(99,102,241,0.28)]"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            MileStone
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isRegister
              ? 'Create your account to supercharge personal productivity'
              : 'Sign in to access your projects, tasks, and analytics'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="relative flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <span
            aria-hidden="true"
            className={`auth-tab-indicator absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white dark:bg-slate-900 shadow-sm ${
              isRegister ? 'translate-x-full' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`relative z-10 flex-1 py-2 rounded-lg transition-colors ${
              !isRegister
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`relative z-10 flex-1 py-2 rounded-lg transition-colors ${
              isRegister
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit relative w-full overflow-hidden py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            <span>{isLoading ? 'Processing...' : isRegister ? 'Register & Start' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Account Quick-Fill */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Quick-fill demo credentials
          </button>
        </div>
      </div>
    </div>
  );
};
