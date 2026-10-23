import React, { Component, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './shared/types';
import { ToastContainer } from './components/ui';
import { AlertTriangle, Building2, ShieldX } from 'lucide-react';

// Lazy-loaded routes
const Landing = lazy(() => import('./pages/Landing'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const WardenDashboard = lazy(() => import('./pages/WardenDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// ─── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--stone-50)] flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--stone-900)] font-heading mb-2">Something went wrong</h1>
            <p className="text-sm text-[var(--stone-600)] mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.hash = '/'; }}
              className="px-6 py-2.5 bg-[var(--accent-700)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-800)] transition"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Loading Spinner ───────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-[var(--accent-200)] border-t-[var(--accent-700)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[var(--stone-500)]">Loading...</p>
      </div>
    </div>
  );
}

// ─── 403 Page ──────────────────────────────────────────────────────────────────
function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--stone-900)] font-heading mb-2">Access Denied</h1>
        <p className="text-sm text-[var(--stone-600)] mb-6">You don't have permission to access this page. Please sign in with the correct role.</p>
        <a href="#/" className="px-6 py-2.5 bg-[var(--accent-700)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-800)] transition inline-block">
          Go to Login
        </a>
      </div>
    </div>
  );
}

// ─── 404 Page ──────────────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-[var(--stone-100)] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-[var(--stone-400)]" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--stone-900)] font-heading mb-2">404</h1>
        <p className="text-sm text-[var(--stone-600)] mb-6">This page doesn't exist or has been moved.</p>
        <a href="#/" className="px-6 py-2.5 bg-[var(--accent-700)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-800)] transition inline-block">
          Return Home
        </a>
      </div>
    </div>
  );
}

// ─── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== requiredRole) return <ForbiddenPage />;
  return <>{children}</>;
}

// ─── App Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to={
            user.role === Role.WARDEN ? '/warden' :
            user.role === Role.ADMIN ? '/admin' : '/student'
          } replace /> : <Landing />
        } />
        <Route path="/student" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><StudentDashboard /></ProtectedRoute>
        } />
        <Route path="/warden" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenDashboard /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
