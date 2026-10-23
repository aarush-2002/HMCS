import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role, Complaint, ComplaintStatus, Priority, Category } from '../shared/types';
import { POLICY } from '../shared/policy';
import {
  getStore, getUserById, updateComplaint, getRatingsForWarden, getPenaltiesForWarden,
} from '../store/data';
import { AuditService } from '../services/AuditService';
import { Card, Badge, Button, Input, Select, EmptyState, StarRating, showToast } from '../components/ui';
import { AuditTimeline } from '../components/ui/AuditTimeline';
import {
  Building2, LogOut, Users, Shield, AlertTriangle, BarChart3, BookOpen, Menu, X,
  FileText, Settings, ClipboardList, Search, Plus, Edit3, Trash2, Download,
  Upload, CheckCircle, XCircle, Star, TrendingDown, Eye, ArrowRight,
} from 'lucide-react';

type View = 'overview' | 'users' | 'hostels' | 'policy' | 'complaints' | 'scores' | 'audit';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;
  const store = getStore();

  const wardens = store.users.filter(u => u.role === Role.WARDEN);
  const students = store.users.filter(u => u.role === Role.STUDENT);
  const overdueComplaints = store.complaints.filter(c => {
    if (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) return false;
    return new Date() > new Date(c.deadlineAt);
  }).length;

  const navItems = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { key: 'hostels', label: 'Hostels', icon: <Building2 className="w-5 h-5" /> },
    { key: 'policy', label: 'Policy', icon: <Settings className="w-5 h-5" /> },
    { key: 'complaints', label: 'Exceptions', icon: <FileText className="w-5 h-5" /> },
    { key: 'scores', label: 'Scores', icon: <Star className="w-5 h-5" /> },
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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
          <div className="max-w-6xl mx-auto">
            {view === 'overview' && <OverviewView students={students} wardens={wardens} overdueComplaints={overdueComplaints} />}
            {view === 'users' && <UsersView />}
            {view === 'hostels' && <HostelsView />}
            {view === 'policy' && <PolicyView />}
            {view === 'complaints' && <ComplaintsView />}
            {view === 'scores' && <ScoresView wardens={wardens} />}
            {view === 'audit' && <AuditView />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Overview ──────────────────────────────────────────────────────────────────
function OverviewView({ students, wardens, overdueComplaints }: any) {
  const store = getStore();
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
    </div>
  );
}

// ─── Users Management ──────────────────────────────────────────────────────────
function UsersView() {
  const store = getStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');

  const filteredUsers = useMemo(() => {
    let users = store.users;
    if (filterRole !== 'ALL') users = users.filter(u => u.role === filterRole);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return users;
  }, [store.users, filterRole, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Users</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />}>Import CSV</Button>
          <Button size="sm" icon={<Plus className="w-4 h-4" />}>Add User</Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
            />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as any)} className="px-3 py-2.5 rounded-lg border border-[var(--stone-300)] text-sm bg-white">
            <option value="ALL">All Roles</option>
            <option value={Role.STUDENT}>Students</option>
            <option value={Role.WARDEN}>Wardens</option>
            <option value={Role.ADMIN}>Admins</option>
          </select>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredUsers.map(u => (
            <div key={u.id} className="flex items-center gap-3 py-3 border-b border-[var(--stone-100)] last:border-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                u.role === Role.WARDEN ? 'bg-amber-100' : u.role === Role.ADMIN ? 'bg-purple-100' : 'bg-[var(--accent-100)]'
              }`}>
                <span className={`text-sm font-bold ${
                  u.role === Role.WARDEN ? 'text-amber-800' : u.role === Role.ADMIN ? 'text-purple-800' : 'text-[var(--accent-800)]'
                }`}>{u.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--stone-900)]">{u.name}</p>
                <p className="text-xs text-[var(--stone-500)]">{u.email}</p>
              </div>
              <Badge variant={u.role === Role.WARDEN ? 'warning' : u.role === Role.ADMIN ? 'accent' : 'info'}>
                {u.role}
              </Badge>
              <div className="flex gap-1">
                <button className="p-1.5 rounded hover:bg-[var(--stone-100)]" aria-label="Edit"><Edit3 className="w-4 h-4 text-[var(--stone-500)]" /></button>
                <button className="p-1.5 rounded hover:bg-[var(--stone-100)]" aria-label="More"><X className="w-4 h-4 text-[var(--stone-500)]" /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Hostels & Assignments ─────────────────────────────────────────────────────
function HostelsView() {
  const store = getStore();
  const wardens = store.users.filter(u => u.role === Role.WARDEN);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Hostels & Assignments</h2>
        <Button size="sm" icon={<Plus className="w-4 h-4" />}>Add Hostel</Button>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--stone-900)]">{store.hostel.name}</h3>
            <p className="text-sm text-[var(--stone-500)]">{store.hostel.building} • Timezone: {POLICY.defaultTimezone}</p>
          </div>
        </div>

        <h4 className="font-medium text-[var(--stone-800)] mb-3">Assigned Wardens</h4>
        <div className="space-y-2">
          {wardens.map(w => (
            <div key={w.id} className="flex items-center gap-3 py-2 border-b border-[var(--stone-100)] last:border-0">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-amber-800">{w.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-xs text-[var(--stone-500)]">{w.email}</p>
              </div>
              <Button variant="ghost" size="sm">Reassign</Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Policy Configuration ──────────────────────────────────────────────────────
function PolicyView() {
  const policies = [
    { label: 'Normal Deadline (hours)', value: POLICY.normalDeadlineHours, key: 'normalDeadlineHours' },
    { label: 'Emergency Deadline (hours)', value: POLICY.emergencyDeadlineHours, key: 'emergencyDeadlineHours' },
    { label: 'Promotion Threshold (upvotes)', value: POLICY.promotionThreshold, key: 'promotionThreshold' },
    { label: 'Resolution Votes Required', value: POLICY.resolutionVotesRequired, key: 'resolutionVotesRequired' },
    { label: 'Confirmation Window (hours)', value: POLICY.confirmationWindowHours, key: 'confirmationWindowHours' },
    { label: 'Normal Complaints/Day', value: POLICY.normalComplaintsPerDay, key: 'normalComplaintsPerDay' },
    { label: 'Emergency Complaints/Week', value: POLICY.emergencyComplaintsPerWeek, key: 'emergencyComplaintsPerWeek' },
    { label: 'Rating Min', value: POLICY.ratingMin, key: 'ratingMin' },
    { label: 'Rating Max', value: POLICY.ratingMax, key: 'ratingMax' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Policy Configuration</h2>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Changes affect future complaints only</p>
          <p className="text-xs text-amber-700 mt-1">Existing complaints retain their original deadlines and thresholds. All changes are audited.</p>
        </div>
      </div>

      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          {policies.map(p => (
            <div key={p.key} className="bg-[var(--stone-50)] rounded-xl p-4">
              <label className="block text-xs text-[var(--stone-500)] mb-2">{p.label}</label>
              <input
                type="number"
                defaultValue={p.value}
                className="w-full px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Complaint Exceptions ──────────────────────────────────────────────────────
function ComplaintsView() {
  const store = getStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const filtered = useMemo(() => {
    if (!searchQuery) return store.complaints.slice(0, 50);
    const q = searchQuery.toLowerCase();
    return store.complaints.filter(c =>
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [store.complaints, searchQuery]);

  if (selectedComplaint) {
    const auditEvents = AuditService.getForEntity(selectedComplaint.id);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedComplaint(null)} className="text-sm text-[var(--stone-600)] hover:text-[var(--stone-900)] flex items-center gap-1">
          ← Back to list
        </button>
        <Card>
          <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-2">{selectedComplaint.title}</h2>
          <p className="text-sm text-[var(--stone-500)] mb-4">{selectedComplaint.id} • {selectedComplaint.category}</p>
          <p className="text-sm text-[var(--stone-800)] mb-6">{selectedComplaint.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Status</p>
              <p className="text-sm font-medium">{selectedComplaint.status.replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Priority</p>
              <p className="text-sm font-medium">{selectedComplaint.priority}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Created</p>
              <p className="text-sm font-medium">{new Date(selectedComplaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Deadline</p>
              <p className="text-sm font-medium">{new Date(selectedComplaint.deadlineAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm" icon={<Edit3 className="w-4 h-4" />}>Reclassify</Button>
            <Button variant="outline" size="sm" icon={<ArrowRight className="w-4 h-4" />}>Merge Duplicate</Button>
            <Button variant="danger" size="sm" icon={<XCircle className="w-4 h-4" />}>Reject</Button>
          </div>

          <h3 className="font-bold text-[var(--stone-900)] mb-3">Audit Timeline</h3>
          <AuditTimeline events={auditEvents} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Complaint Exceptions</h2>
      <Card>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, title, or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
          />
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedComplaint(c)}
              className="flex items-center gap-3 py-3 border-b border-[var(--stone-100)] last:border-0 cursor-pointer hover:bg-[var(--stone-50)] rounded-lg px-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--stone-900)] truncate">{c.title}</p>
                <p className="text-xs text-[var(--stone-500)]">{c.id} • {c.status.replace(/_/g, ' ')} • {c.priority}</p>
              </div>
              <Eye className="w-4 h-4 text-[var(--stone-400)]" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Score Review ──────────────────────────────────────────────────────────────
function ScoresView({ wardens }: any) {
  const store = getStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Warden Scores</h2>

      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">All Wardens</h3>
        <div className="space-y-4">
          {wardens.map((w: any) => {
            const ratings = getRatingsForWarden(w.id);
            const penalties = getPenaltiesForWarden(w.id);
            const avg = ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.stars, 0) / ratings.length : 0;
            return (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-[var(--stone-100)] last:border-0">
                <div>
                  <p className="font-medium text-[var(--stone-900)]">{w.name}</p>
                  <p className="text-xs text-[var(--stone-500)]">{w.email}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-amber-400 fill-current' : 'text-[var(--stone-300)]'}`} />)}
                    </div>
                    <p className="text-xs text-[var(--stone-500)]">{avg.toFixed(1)} ({ratings.length})</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${penalties.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {penalties.length > 0 ? `-${penalties.length}` : '0'}
                    </p>
                    <p className="text-xs text-[var(--stone-500)]">Penalties</p>
                  </div>
                  <Button variant="outline" size="sm">Review</Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Flagged Ratings</h3>
        <EmptyState icon={<Star className="w-8 h-8" />} title="No flagged ratings" description="All ratings are within acceptable bounds." />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Disputed Penalties</h3>
        <EmptyState icon={<TrendingDown className="w-8 h-8" />} title="No disputed penalties" description="All penalties are accepted." />
      </Card>
    </div>
  );
}

// ─── Audit Log ─────────────────────────────────────────────────────────────────
function AuditView() {
  const recentEvents = AuditService.getRecent(100);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Audit Log</h2>
      <Card>
        <div className="bg-[var(--stone-50)] border border-[var(--stone-200)] rounded-lg p-3 mb-4 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--stone-500)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--stone-600)]">
            This is an append-only log. No entries can be edited or deleted. The database user for this application should not have DELETE privileges on the audit_events table.
          </p>
        </div>
        <AuditTimeline events={recentEvents} showActor={true} />
      </Card>
    </div>
  );
}
