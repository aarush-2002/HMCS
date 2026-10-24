import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Role } from '../shared/types';
import { Input, Button } from '../components/ui';
import { Atmosphere } from '../components/ui/Atmosphere';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

// Lazy load WorldCanvas
const WorldCanvas = React.lazy(() => import('../components/WorldCanvas').then(m => ({ default: m.WorldCanvas })));

export default function StudentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, Role.STUDENT);
      
      if (result.success) {
        setSuccess(true);
        // Window glow brightens for 600ms, then navigate
        setTimeout(() => {
          navigate('/student');
        }, 600);
      } else {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-bone relative overflow-x-clip">
      {/* 3D World Background - Student variant */}
      <React.Suspense fallback={null}>
        <WorldCanvas scene="auth" variant="student" />
      </React.Suspense>

      {/* Atmosphere layers */}
      <Atmosphere />

      {/* Success glow overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            className="fixed inset-0 z-30 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(245, 165, 36, 0.4), transparent 60%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-20 min-h-screen flex items-center">
        <div className="w-full max-w-[1400px] mx-auto px-[var(--pad)] grid md:grid-cols-3 gap-8 items-center">
          {/* Form column */}
          <div className="md:col-span-1">
            <motion.div
              className="bg-ink-2/80 backdrop-blur-md border border-line rounded-2xl p-8 max-w-[420px]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Eyebrow */}
              <div className="eyebrow eyebrow-ember mb-4">Student portal</div>

              {/* H1 */}
              <h1 className="display display-md mb-8">Welcome back.</h1>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@hmcs.edu"
                  required
                  autoComplete="email"
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-bone-dim hover:text-ember transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="flex items-start gap-2 p-3 rounded-lg bg-emergency-soft border border-emergency/30"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      role="alert"
                      aria-live="assertive"
                    >
                      <AlertCircle className="w-5 h-5 text-emergency shrink-0 mt-0.5" />
                      <div className="text-sm text-emergency">{error}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  Sign in
                </Button>

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

              {/* Switch to warden */}
              <div className="mt-8 pt-6 border-t border-line text-center">
                <Link
                  to="/warden/login"
                  className="text-sm text-bone-dim hover:text-ember transition-colors"
                >
                  Warden? Sign in here →
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Scene column (empty, world shows through) */}
          <div className="md:col-span-2 hidden md:block" />
        </div>
      </div>
    </div>
  );
}
