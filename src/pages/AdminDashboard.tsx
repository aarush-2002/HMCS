import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ComplaintStatus, Priority, Complaint } from '../shared/types';
import { getStore, getRatingsForWarden, getPenaltiesForWarden, getUserById } from '../store/data';
import { Card, Badge, StarRating, EmptyState } from '../components/ui';
import { Building2, LogOut, Users, Shield, AlertTriangle, BarChart3, BookOpen, Menu, X, FileText, Settings, ClipboardList } from 'lucide-react';

type View = 'overview' | 'users' | 'policies' | 'audit';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;
  const store = getStore();

  const wardens = store.users.filter(u => u.role === 'WARDEN');
  const students = store.users.filter(u => u.role === 'STUDENT');
  const overdueComplaints = store.complaints.filter(c => {
    if (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) return false;
    return new Date() > new Date(c.deadlineAt);
  }).length;

  const navItems = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { key: 'policies', label: 'Policies', icon: <Settings className="w-5 h-5" /> },
    { key: 'audit', label: 'Audit Log', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[var(--stone-200)] flex-col shrink-0">
        <div className="p-5 border-b border-[var(--stone-200)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-700 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</h1>
              <p className="text-xs text-[var(--stone-500)]">Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key as View)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                view === item.key ? 'bg-purple-50 text-purple-800' : 'text-[var(--stone-600)] hover:bg-[var(--stone-100)]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--stone-200)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-purple-800">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--stone-900)] truncate">{user.name}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--stone-600)] hover:bg-[var(--stone-100)]">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="p-5 border-b border-[var(--stone-200)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-700 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold font-heading">HMCS Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]"><X className="w-5 h-5" /></button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(item => (
                <button key={item.key} onClick={() => { setView(item.key as View); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    view === item.key ? 'bg-purple-50 text-purple-800' : 'text-[var(--stone-600)] hover:bg-[var(--stone-100)]'
                  }`}>
                  {item.icon}{item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-[var(--stone-200)] sticky top-0 z-20 md:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--stone-100)]" aria-label="Menu">
              <Menu className="w-5 h-5 text-[var(--stone-700)]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold font-heading">HMCS</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-[var(--stone-100)]" aria-label="Logout">
              <LogOut className="w-5 h-5 text-[var(--stone-600)]" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {view === 'overview' && <OverviewView store={store} students={students} wardens={wardens} overdueComplaints={overdueComplaints} />}
            {view === 'users' && <UsersView students={students} wardens={wardens} />}
            {view === 'policies' && <PoliciesView />}
            {view === 'audit' && <AuditView store={store} />}
          </div>
        </main>
      </div>
    </div>
  );
}

function OverviewView({ store, students, wardens, overdueComplaints }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">System Overview</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><p className="text-xs text-[var(--stone-500)]">Students</p><p className="text-2xl font-bold font-heading">{students.length}</p></Card>
        <Card><p className="text-xs text-[var(--stone-500)]">Wardens</p><p className="text-2xl font-bold font-heading">{wardens.length}</p></Card>
        <Card><p className="text-xs text-[var(--stone-500)]">Complaints</p><p className="text-2xl font-bold font-heading">{store.complaints.length}</p></Card>
        <Card><p className="text-xs text-[var(--stone-500)]">Overdue</p><p className="text-2xl font-bold text-red-600 font-heading">{overdueComplaints}</p></Card>
      </div>

      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Status Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.values(ComplaintStatus).map(status => {
            const count = store.complaints.filter((c: Complaint) => c.status === status).length;
            return (
              <div key={status} className="bg-[var(--stone-50)] rounded-lg p-3 text-center">
                <p className="text-lg font-bold font-heading">{count}</p>
                <p className="text-xs text-[var(--stone-500)]">{status.replace(/_/g, ' ')}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Warden Performance</h3>
        <div className="space-y-4">
          {wardens.map((w: any) => {
            const ratings = getRatingsForWarden(w.id);
            const penalties = getPenaltiesForWarden(w.id);
            const avg = ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.stars, 0) / ratings.length : 0;
            return (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-[var(--stone-100)] last:border-0">
                <div>
                  <p className="font-medium text-[var(--stone-900)]">{w.name}</p>
                  <p className="text-xs text-[var(--stone-500)]">{store.complaints.filter((c: Complaint) => c.assignedWardenId === w.id).length} assigned</p>
                </div>
                <div className="flex items-center gap-4">
                  <StarRating value={Math.round(avg)} readonly size="sm" />
                  <span className={`text-sm font-bold ${penalties.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{penalties.length > 0 ? `-${penalties.length}` : '0'} pen.</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function UsersView({ students, wardens }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Users</h2>
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Wardens ({wardens.length})</h3>
        <div className="space-y-2">
          {wardens.map((w: any) => (
            <div key={w.id} className="flex items-center gap-3 py-2 border-b border-[var(--stone-100)] last:border-0">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><span className="text-xs font-bold text-amber-800">{w.name.charAt(0)}</span></div>
              <div><p className="text-sm font-medium">{w.name}</p><p className="text-xs text-[var(--stone-500)]">{w.email}</p></div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Students ({students.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {students.map((s: any) => (
            <div key={s.id} className="flex items-center gap-3 py-2 border-b border-[var(--stone-100)] last:border-0">
              <div className="w-8 h-8 bg-[var(--accent-100)] rounded-full flex items-center justify-center"><span className="text-xs font-bold text-[var(--accent-800)]">{s.name.charAt(0)}</span></div>
              <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-[var(--stone-500)]">{s.email}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PoliciesView() {
  const policies = [
    { label: 'Normal Deadline', value: '72 hours', color: 'bg-[var(--stone-50)]' },
    { label: 'Emergency Deadline', value: '24 hours', color: 'bg-red-50' },
    { label: 'Promotion Threshold', value: '10 upvotes', color: 'bg-blue-50' },
    { label: 'Resolution Votes', value: '3 solved', color: 'bg-green-50' },
    { label: 'Confirmation Window', value: '24 hours', color: 'bg-purple-50' },
    { label: 'Normal Limit/Day', value: '1 per student', color: 'bg-amber-50' },
    { label: 'Emergency Limit/Week', value: '1 per student', color: 'bg-indigo-50' },
    { label: 'Rating Scale', value: '1–3 stars', color: 'bg-pink-50' },
    { label: 'Penalty per Miss', value: '−1 star', color: 'bg-teal-50' },
  ];
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Policy Configuration</h2>
      <Card>
        <div className="grid sm:grid-cols-3 gap-3">
          {policies.map(p => (
            <div key={p.label} className={`${p.color} rounded-xl p-4`}>
              <p className="text-xs text-[var(--stone-500)]">{p.label}</p>
              <p className="text-lg font-bold font-heading text-[var(--stone-900)]">{p.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AuditView({ store }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Audit Log</h2>
      <Card>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {store.auditEvents.slice(0, 50).map((event: any) => {
            const actor = getUserById(event.actorId);
            return (
              <div key={event.id} className="flex items-start gap-3 text-sm py-2 border-b border-[var(--stone-50)] last:border-0">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 shrink-0" />
                <div>
                  <p className="text-[var(--stone-700)]">
                    <span className="font-medium">{actor?.name || event.actorId}</span> — {event.action.replace(/_/g, ' ')}
                    <span className="text-[var(--stone-500)]"> on {event.entityId}</span>
                  </p>
                  <p className="text-xs text-[var(--stone-500)]">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
