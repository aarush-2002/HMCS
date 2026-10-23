import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../shared/types';
import { Building2, Shield, Users, BookOpen, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react';

export default function Landing() {
  const { login } = useAuth();
  const [loginRole, setLoginRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginRole) return;
    const result = login(email, password, loginRole);
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
  };

  const fillCredentials = (role: Role) => {
    setLoginRole(role);
    if (role === Role.STUDENT) { setEmail('student1@hmcs.edu'); setPassword('student123'); }
    else if (role === Role.WARDEN) { setEmail('warden1@hmcs.edu'); setPassword('warden123'); }
    else { setEmail('admin@hmcs.edu'); setPassword('admin123'); }
    setError('');
  };

  if (loginRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button onClick={() => setLoginRole(null)} className="text-slate-600 hover:text-slate-900 mb-4 flex items-center gap-1 text-sm">
            ← Back
          </button>
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-6">
              <div className={`w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                loginRole === Role.STUDENT ? 'bg-blue-100' : loginRole === Role.WARDEN ? 'bg-amber-100' : 'bg-purple-100'
              }`}>
                {loginRole === Role.STUDENT ? <Users className="w-7 h-7 text-blue-600" /> :
                 loginRole === Role.WARDEN ? <Shield className="w-7 h-7 text-amber-600" /> :
                 <BookOpen className="w-7 h-7 text-purple-600" />}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {loginRole === Role.STUDENT ? 'Student Login' : loginRole === Role.WARDEN ? 'Warden Login' : 'Admin Login'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">HMCS — Hostel Management Complaint System</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="you@hmcs.edu"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg font-medium text-white transition shadow-sm ${
                  loginRole === Role.STUDENT ? 'bg-blue-600 hover:bg-blue-700' :
                  loginRole === Role.WARDEN ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                Sign In
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Demo credentials (click to fill):</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fillCredentials(Role.STUDENT)} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md hover:bg-blue-100 transition">
                  student1@hmcs.edu
                </button>
                <button onClick={() => fillCredentials(Role.WARDEN)} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md hover:bg-amber-100 transition">
                  warden1@hmcs.edu
                </button>
                <button onClick={() => fillCredentials(Role.ADMIN)} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md hover:bg-purple-100 transition">
                  admin@hmcs.edu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">HMCS</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Hostel Management Complaint System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <AlertTriangle className="w-4 h-4" />
            Transparent. Accountable. Timely.
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Report hostel issues.<br />
            <span className="text-blue-600">Track resolutions.</span>
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            HMCS gives hostel residents a transparent way to report problems, helps wardens prioritize and resolve them, and lets students confirm and rate resolution quality.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setLoginRole(Role.STUDENT)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-200 transition flex items-center justify-center gap-3"
            >
              <Users className="w-5 h-5" />
              Student Login
            </button>
            <button
              onClick={() => setLoginRole(Role.WARDEN)}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-semibold text-lg shadow-lg shadow-slate-200 border border-slate-200 transition flex items-center justify-center gap-3"
            >
              <Shield className="w-5 h-5" />
              Warden Login
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Report Issues</h3>
            <p className="text-sm text-slate-600">Submit complaints with photos, categorize by type, and flag emergencies. 1 normal/day, 1 emergency/week.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Track & Confirm</h3>
            <p className="text-sm text-slate-600">Follow complaint status in real-time. Confirm resolution when fixed — 3 votes within 24h closes the issue.</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Rate & Accountability</h3>
            <p className="text-sm text-slate-600">Rate wardens 1-3 stars after resolution. Missed deadlines trigger penalties. Performance is transparent.</p>
          </div>
        </div>

        {/* Policy summary */}
        <div className="mt-12 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            System Policies
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-900">72h</p>
              <p className="text-sm text-slate-600">Normal complaint deadline</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-700">24h</p>
              <p className="text-sm text-slate-600">Emergency complaint deadline</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-700">10</p>
              <p className="text-sm text-slate-600">Upvotes to promote to emergency</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">3</p>
              <p className="text-sm text-slate-600">"Solved" votes to confirm resolution</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          HMCS — Hostel Management Complaint System • Vivekananda Hostel, Block A
        </div>
      </footer>
    </div>
  );
}
