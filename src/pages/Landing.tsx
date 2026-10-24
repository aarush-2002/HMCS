import React, { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../shared/types';
import { POLICY } from '../shared/policy';
import { Button, Input } from '../components/ui';
import { Building2, Users, Shield, BookOpen, AlertTriangle, CheckCircle, Clock, Star, ArrowRight, Send, ThumbsUp, FileText } from 'lucide-react';

// Lazy load WorldCanvas for code splitting
const WorldCanvas = React.lazy(() => import('../components/WorldCanvas').then(module => ({ default: module.WorldCanvas })));

export default function Landing() {
  const [showLogin, setShowLogin] = useState<Role | null>(null);

  if (showLogin) {
    return <LoginPage role={showLogin} onBack={() => setShowLogin(null)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--stone-50)] relative">
      {/* 3D World Background */}
      <Suspense fallback={null}>
        <WorldCanvas scene="landing" />
      </Suspense>
      
      {/* Content overlay */}
      <div className="relative z-10">
      {/* Header */}
      <header className="border-b border-[var(--stone-200)] bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-700)] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--stone-900)] font-heading tracking-tight">HMCS</h1>
              <p className="text-[11px] text-[var(--stone-500)] -mt-0.5 tracking-wide uppercase">Hostel Complaint System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-[var(--accent-700)] mb-4 tracking-wide uppercase">Transparent • Accountable • Timely</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--stone-900)] font-heading leading-[1.1] mb-6">
            Report issues.<br />
            <span className="text-[var(--accent-700)]">Track resolutions.</span>
          </h2>
          <p className="text-lg text-[var(--stone-600)] leading-relaxed mb-10 max-w-xl">
            A shared system for hostel residents to report problems, for wardens to prioritize and resolve them, and for students to confirm and rate the quality of resolution.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => setShowLogin(Role.STUDENT)} icon={<Users className="w-5 h-5" />}>
              Student Login
            </Button>
            <Button size="lg" variant="outline" onClick={() => setShowLogin(Role.WARDEN)} icon={<Shield className="w-5 h-5" />}>
              Warden Login
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <h3 className="text-2xl font-bold text-[var(--stone-900)] font-heading mb-10">How it works</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: <Send className="w-6 h-6" />,
              title: 'Report',
              desc: 'Submit a complaint with a title, description, category, and optional photo. Flag emergencies for 24h response.',
            },
            {
              step: '02',
              icon: <ThumbsUp className="w-6 h-6" />,
              title: 'Support',
              desc: 'Upvote complaints affecting you. Issues reaching 10 upvotes are automatically promoted to emergency priority.',
            },
            {
              step: '03',
              icon: <Star className="w-6 h-6" />,
              title: 'Resolve & Rate',
              desc: 'Confirm when an issue is fixed. Rate the warden\'s handling. Missed deadlines trigger accountability penalties.',
            },
          ].map(item => (
            <div key={item.step} className="relative bg-white rounded-2xl border border-[var(--stone-200)] p-6">
              <span className="text-xs font-bold text-[var(--accent-600)] tracking-wider">{item.step}</span>
              <div className="w-12 h-12 bg-[var(--accent-50)] rounded-xl flex items-center justify-center text-[var(--accent-700)] mt-3 mb-4">
                {item.icon}
              </div>
              <h4 className="text-lg font-semibold text-[var(--stone-900)] font-heading mb-2">{item.title}</h4>
              <p className="text-sm text-[var(--stone-600)] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Policy */}
      <section className="border-t border-[var(--stone-200)] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <h3 className="text-2xl font-bold text-[var(--stone-900)] font-heading mb-8">Resolution Deadlines</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[var(--stone-200)] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[var(--stone-100)] rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[var(--stone-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--stone-500)]">Normal Complaints</p>
                  <p className="text-2xl font-bold text-[var(--stone-900)] font-heading">{POLICY.normalDeadlineHours} hours</p>
                </div>
              </div>
              <p className="text-sm text-[var(--stone-600)]">Standard issues like maintenance, cleanliness, or furniture. Limit: {POLICY.normalComplaintsPerDay} per student per day.</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-sm text-red-600">Emergency Complaints</p>
                  <p className="text-2xl font-bold text-red-800 font-heading">{POLICY.emergencyDeadlineHours} hours</p>
                </div>
              </div>
              <p className="text-sm text-red-700/80">Safety hazards, flooding, electrical dangers. Limit: {POLICY.emergencyComplaintsPerWeek} per student per week.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 rounded-xl bg-[var(--stone-50)]">
              <p className="text-2xl font-bold text-[var(--accent-700)] font-heading">{POLICY.promotionThreshold}</p>
              <p className="text-xs text-[var(--stone-500)] mt-1">Upvotes to promote</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--stone-50)]">
              <p className="text-2xl font-bold text-[var(--accent-700)] font-heading">{POLICY.resolutionVotesRequired}</p>
              <p className="text-xs text-[var(--stone-500)] mt-1">Votes to confirm</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--stone-50)]">
              <p className="text-2xl font-bold text-[var(--accent-700)] font-heading">{POLICY.confirmationWindowHours}h</p>
              <p className="text-xs text-[var(--stone-500)] mt-1">Confirmation window</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-[var(--stone-50)]">
              <p className="text-2xl font-bold text-[var(--accent-700)] font-heading">{POLICY.ratingMax}★</p>
              <p className="text-xs text-[var(--stone-500)] mt-1">Max rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--stone-200)] bg-[var(--stone-50)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-[var(--stone-500)]">
          HMCS — Hostel Management Complaint System • Vivekananda Hostel, Block A • Timezone: {POLICY.defaultTimezone}
        </div>
      </footer>
      </div>
    </div>
  );
}

// ─── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ role, onBack }: { role: Role; onBack: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isStudent = role === Role.STUDENT;
  const isWarden = role === Role.WARDEN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = login(email, password, role);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const fillDemo = (type: 'student' | 'warden' | 'admin') => {
    if (type === 'student') { setEmail('student1@hmcs.edu'); setPassword('student123'); }
    else if (type === 'warden') { setEmail('warden1@hmcs.edu'); setPassword('warden123'); }
    else { setEmail('admin@hmcs.edu'); setPassword('admin123'); }
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex flex-col">
      <header className="border-b border-[var(--stone-200)] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)] transition text-[var(--stone-600)]" aria-label="Go back">
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="w-8 h-8 bg-[var(--accent-700)] rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-[var(--stone-200)] p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                isStudent ? 'bg-[var(--accent-50)]' : isWarden ? 'bg-amber-50' : 'bg-purple-50'
              }`}>
                {isStudent ? <Users className="w-7 h-7 text-[var(--accent-700)]" /> :
                 isWarden ? <Shield className="w-7 h-7 text-amber-700" /> :
                 <BookOpen className="w-7 h-7 text-purple-700" />}
              </div>
              <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">
                {isStudent ? 'Student Login' : isWarden ? 'Warden Login' : 'Admin Login'}
              </h2>
              <p className="text-sm text-[var(--stone-500)] mt-1">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@hmcs.edu"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm flex items-center gap-2" role="alert">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[var(--stone-100)]">
              <p className="text-xs text-[var(--stone-500)] mb-2">Demo credentials (click to fill):</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fillDemo('student')} className="text-xs bg-[var(--accent-50)] text-[var(--accent-800)] px-2.5 py-1.5 rounded-lg hover:bg-[var(--accent-100)] transition font-medium">
                  student1@hmcs.edu
                </button>
                <button onClick={() => fillDemo('warden')} className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition font-medium">
                  warden1@hmcs.edu
                </button>
                <button onClick={() => fillDemo('admin')} className="text-xs bg-purple-50 text-purple-800 px-2.5 py-1.5 rounded-lg hover:bg-purple-100 transition font-medium">
                  admin@hmcs.edu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
