import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ComplaintStatus, Priority, Complaint } from '../shared/types';
import { getStore, getRatingsForWarden, getPenaltiesForWarden, getUserById } from '../store/data';
import { Building2, LogOut, Users, Shield, AlertTriangle, CheckCircle, BarChart3, BookOpen } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const store = getStore();

  const wardens = store.users.filter(u => u.role === 'WARDEN');
  const students = store.users.filter(u => u.role === 'STUDENT');
  const totalComplaints = store.complaints.length;
  const activeComplaints = store.complaints.filter(c => c.isActive).length;
  const resolvedComplaints = store.complaints.filter(c => c.status === ComplaintStatus.RESOLVED).length;
  const overdueComplaints = store.complaints.filter(c => {
    if (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) return false;
    return new Date() > new Date(c.deadlineAt);
  }).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">HMCS — Admin</h1>
              <p className="text-xs text-slate-500">{user.name} • {store.hostel.name}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-slate-100 transition" title="Logout">
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold text-slate-900">System Overview</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-slate-600">Students</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-slate-600">Wardens</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{wardens.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <span className="text-sm text-slate-600">Total Complaints</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{totalComplaints}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-slate-600">Overdue</span>
            </div>
            <p className="text-3xl font-bold text-red-700">{overdueComplaints}</p>
          </div>
        </div>

        {/* Complaint Status Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Complaint Status Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.values(ComplaintStatus).map(status => {
              const count = store.complaints.filter(c => c.status === status).length;
              return (
                <div key={status} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs text-slate-500">{status.replace(/_/g, ' ')}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warden Performance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Warden Performance</h3>
          <div className="space-y-4">
            {wardens.map(warden => {
              const ratings = getRatingsForWarden(warden.id);
              const penalties = getPenaltiesForWarden(warden.id);
              const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : 0;
              const assignedComplaints = store.complaints.filter(c => c.assignedWardenId === warden.id);
              const resolved = assignedComplaints.filter(c => c.status === ComplaintStatus.RESOLVED).length;

              return (
                <div key={warden.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900">{warden.name}</p>
                    <p className="text-xs text-slate-500">{warden.email}</p>
                    <p className="text-xs text-slate-500">{assignedComplaints.length} assigned • {resolved} resolved</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map(star => (
                          <svg key={star} className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">{avgRating.toFixed(1)} ({ratings.length})</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${penalties.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {penalties.length > 0 ? `-${penalties.length}` : '0'}
                      </p>
                      <p className="text-xs text-slate-500">Penalties</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Audit Events */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Recent Audit Events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {store.auditEvents.slice(0, 20).map(event => {
              const actor = getUserById(event.actorId);
              return (
                <div key={event.id} className="flex items-start gap-3 text-sm py-2 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-700">
                      <span className="font-medium">{actor?.name || event.actorId}</span>
                      {' — '}
                      <span>{event.action.replace(/_/g, ' ')}</span>
                      {' on '}
                      <span className="text-slate-500">{event.entityId}</span>
                    </p>
                    <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Policy Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Active Policy Configuration</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Normal Deadline</p>
              <p className="text-lg font-bold text-slate-900">72 hours</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Emergency Deadline</p>
              <p className="text-lg font-bold text-red-700">24 hours</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Promotion Threshold</p>
              <p className="text-lg font-bold text-blue-700">10 upvotes</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Resolution Votes Required</p>
              <p className="text-lg font-bold text-green-700">3 solved votes</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Confirmation Window</p>
              <p className="text-lg font-bold text-purple-700">24 hours</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Normal Limit / Day</p>
              <p className="text-lg font-bold text-amber-700">1 per student</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Emergency Limit / Week</p>
              <p className="text-lg font-bold text-indigo-700">1 per student</p>
            </div>
            <div className="bg-pink-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Rating Scale</p>
              <p className="text-lg font-bold text-pink-700">1–3 stars</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Penalty per Miss</p>
              <p className="text-lg font-bold text-teal-700">−1 star</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
