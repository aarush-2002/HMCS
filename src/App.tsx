import React, { Component, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './shared/types';
import { ToastContainer } from './components/ui';
import { AlertTriangle, Building2, ShieldX } from 'lucide-react';

// Lazy-loaded routes
const Landing = lazy(() => import('./pages/Landing'));
const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const WardenLogin = lazy(() => import('./pages/WardenLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const WardenDashboard = lazy(() => import('./pages/WardenDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Design = lazy(() => import('./pages/Design'));
const Feed = lazy(() => import('./pages/Feed'));
const NewComplaint = lazy(() => import('./pages/NewComplaint'));
const ComplaintDetail = lazy(() => import('./pages/ComplaintDetail'));
const MyComplaints = lazy(() => import('./pages/MyComplaints'));
const Notifications = lazy(() => import('./pages/Notifications'));

// Warden pages (calm mode)
const WardenQueue = lazy(() => import('./pages/WardenQueue'));
const WardenComplaintDetail = lazy(() => import('./pages/WardenComplaintDetail'));
const WardenOverdue = lazy(() => import('./pages/WardenOverdue'));
const WardenPerformance = lazy(() => import('./pages/WardenPerformance'));
const WardenNotifications = lazy(() => import('./pages/WardenNotifications'));

// Admin pages (calm mode)
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminHostels = lazy(() => import('./pages/AdminHostels'));
const AdminPolicies = lazy(() => import('./pages/AdminPolicies'));
const AdminAudit = lazy(() => import('./pages/AdminAudit'));
const AdminScores = lazy(() => import('./pages/AdminScores'));

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

// ─── Error Pages ───────────────────────────────────────────────────────────────
import { ErrorPage } from './components/ErrorPage';

function ForbiddenPage() {
  return <ErrorPage code="403" />;
}

function NotFoundPage() {
  return <ErrorPage code="404" />;
}

function ServerErrorPage() {
  return <ErrorPage code="500" />;
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
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><Feed /></ProtectedRoute>
        } />
        <Route path="/student/new" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><NewComplaint /></ProtectedRoute>
        } />
        <Route path="/student/complaint/:id" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><ComplaintDetail /></ProtectedRoute>
        } />
        <Route path="/student/mine" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><MyComplaints /></ProtectedRoute>
        } />
        <Route path="/student/notifications" element={
          <ProtectedRoute requiredRole={Role.STUDENT}><Notifications /></ProtectedRoute>
        } />
        <Route path="/warden/login" element={<WardenLogin />} />
        <Route path="/warden" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenQueue /></ProtectedRoute>
        } />
        <Route path="/warden/complaint/:id" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenComplaintDetail /></ProtectedRoute>
        } />
        <Route path="/warden/overdue" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenOverdue /></ProtectedRoute>
        } />
        <Route path="/warden/performance" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenPerformance /></ProtectedRoute>
        } />
        <Route path="/warden/notifications" element={
          <ProtectedRoute requiredRole={Role.WARDEN}><WardenNotifications /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminUsers /></ProtectedRoute>
        } />
        <Route path="/admin/hostels" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminHostels /></ProtectedRoute>
        } />
        <Route path="/admin/policies" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminPolicies /></ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminAudit /></ProtectedRoute>
        } />
        <Route path="/admin/scores" element={
          <ProtectedRoute requiredRole={Role.ADMIN}><AdminScores /></ProtectedRoute>
        } />
        <Route path="/design" element={<Design />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/500" element={<ServerErrorPage />} />
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
