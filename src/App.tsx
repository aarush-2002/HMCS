import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './shared/types';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import WardenDashboard from './pages/WardenDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={
        user.role === Role.WARDEN ? '/warden' :
        user.role === Role.ADMIN ? '/admin' : '/student'
      } replace /> : <Landing />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole={Role.STUDENT}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/warden"
        element={
          <ProtectedRoute requiredRole={Role.WARDEN}>
            <WardenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole={Role.ADMIN}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
