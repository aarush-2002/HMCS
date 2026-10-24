import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorldCanvas } from './WorldCanvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  eyebrow: string;
  sceneType: 'student' | 'warden';
  switchLink: {
    text: string;
    href: string;
  };
}

export function AuthLayout({ 
  title, 
  subtitle, 
  eyebrow, 
  sceneType,
  switchLink 
}: AuthLayoutProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus email input on mount
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate authentication
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock validation - in real app, this would call your auth API
    if (sceneType === 'student' && email === 'student@hmcs.edu' && password === 'student123') {
      setSuccess(true);
      setTimeout(() => {
        navigate('/student');
      }, 600);
    } else if (sceneType === 'warden' && email === 'warden@hmcs.edu' && password === 'warden123') {
      setSuccess(true);
      setTimeout(() => {
        navigate('/warden');
      }, 600);
    } else {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-bone relative overflow-hidden">
      {/* World background */}
      <div className="absolute inset-0 z-0">
        <WorldCanvas scene="auth" variant={sceneType} />
      </div>

      {/* Success glow overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-ember/20 via-transparent to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col md:flex-row">
        {/* Scene band (mobile) / open space (desktop) */}
        <div className="md:flex-1 md:relative">
          {/* Mobile: short scene band */}
          <div className="md:hidden h-48 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/50 to-ink" />
          </div>
        </div>

        {/* Form column */}
        <div className="w-full md:w-[420px] md:max-w-[420px] md:flex md:flex-col md:justify-center relative">
          {/* Ink scrim */}
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm md:bg-ink/90" />

          {/* Form content */}
          <div className="relative p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Eyebrow */}
              <div className="eyebrow eyebrow-ember mb-4">{eyebrow}</div>

              {/* Title */}
              <h1 className="display display-lg mb-3">{title}</h1>

              {/* Subtitle */}
              <p className="body text-bone-dim mb-8">{subtitle}</p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm text-bone-dim mb-2">
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-ink-2 border border-line rounded-lg text-bone placeholder:text-muted focus:outline-none focus:border-ember transition-colors"
                    placeholder="you@hmcs.edu"
                    required
                    autoComplete="email"
                    disabled={loading || success}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm text-bone-dim mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-ink-2 border border-line rounded-lg text-bone placeholder:text-muted focus:outline-none focus:border-ember transition-colors"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      disabled={loading || success}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-bone transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading || success}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-start gap-2 p-3 bg-emergency/10 border border-emergency/30 rounded-lg"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="w-5 h-5 text-emergency flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-emergency">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full px-6 py-3 bg-ember text-ink rounded-full font-medium hover:bg-ember/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-ink/30 border-t-ink rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span>Signing in...</span>
                    </>
                  ) : success ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        ✓
                      </motion.div>
                      <span>Welcome!</span>
                    </>
                  ) : (
                    <span>Sign in</span>
                  )}
                </button>

                {/* Help link */}
                <div className="text-center">
                  <a
                    href="#"
                    className="text-sm text-bone-dim hover:text-ember transition-colors"
                  >
                    Need help signing in?
                  </a>
                </div>

                {/* Admin note */}
                <p className="text-xs text-muted text-center">
                  Accounts are created by the hostel administrator.
                </p>
              </form>

              {/* Switch link */}
              <div className="mt-8 pt-8 border-t border-line text-center">
                <a
                  href={switchLink.href}
                  className="text-sm text-bone-dim hover:text-ember transition-colors"
                >
                  {switchLink.text} →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
