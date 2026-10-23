import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Complaint, ComplaintStatus, Priority,
  getStatusColor, getPriorityColor, getTimeRemaining, isOverdue,
} from '../shared/types';
import { POLICY } from '../shared/policy';
import {
  getStore, updateComplaint, addNotification, addAuditEvent,
  getUpvotesForComplaint, getRatingsForWarden, getPenaltiesForWarden,
  getAuditForComplaint, getUserById,
} from '../store/data';
import { v4 as uuid } from 'uuid';
import {
  Shield, LogOut, Building2, Clock, AlertTriangle, CheckCircle,
  ChevronDown, ArrowLeft, BarChart3, Star, Filter, Search,
  List, Eye, Edit3, TrendingDown, Users,
} from 'lucide-react';

type View = 'queue' | 'detail' | 'overdue' | 'performance';

export default function WardenDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('queue');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [, setRefresh] = useState(0);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;
  const store = getStore();
  const forceRefresh = () => setRefresh(r => r + 1);

  const myComplaints = useMemo(() => {
    let list = store.complaints.filter(c => c.hostelId === user.hostelId && c.assignedWardenId === user.id);
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus);
    if (filterPriority !== 'ALL') list = list.filter(c => c.priority === filterPriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      // Emergency first, then overdue, then by deadline
      if (a.priority === Priority.EMERGENCY && b.priority !== Priority.EMERGENCY) return -1;
      if (b.priority === Priority.EMERGENCY && a.priority !== Priority.EMERGENCY) return 1;
      const aOverdue = isOverdue(a) ? 0 : 1;
      const bOverdue = isOverdue(b) ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
    });
  }, [store.complaints, filterStatus, filterPriority, searchQuery, user]);

  const overdueComplaints = myComplaints.filter(c => isOverdue(c));
  const ratings = getRatingsForWarden(user.id);
  const penalties = getPenaltiesForWarden(user.id);
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : 0;

  const openDetail = (id: string) => {
    setSelectedComplaint(id);
    setView('detail');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">HMCS — Warden</h1>
              <p className="text-xs text-slate-500">{user.name} • {store.hostel.name}</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 rounded-lg hover:bg-slate-100 transition" title="Logout">
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { key: 'queue', label: 'Queue', icon: List, count: myComplaints.filter(c => c.isActive).length },
            { key: 'overdue', label: 'Overdue', icon: AlertTriangle, count: overdueComplaints.length },
            { key: 'performance', label: 'Performance', icon: BarChart3 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as View)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                view === tab.key
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab.key === 'overdue' && tab.count > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'queue' && (
          <QueueView
            complaints={myComplaints}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            setFilterStatus={setFilterStatus}
            setFilterPriority={setFilterPriority}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenDetail={openDetail}
          />
        )}
        {view === 'detail' && selectedComplaint && (
          <WardenComplaintDetail
            complaintId={selectedComplaint}
            wardenId={user.id}
            onBack={() => setView('queue')}
            onRefresh={forceRefresh}
          />
        )}
        {view === 'overdue' && (
          <OverdueView complaints={overdueComplaints} onOpenDetail={openDetail} />
        )}
        {view === 'performance' && (
          <PerformanceView
            ratings={ratings}
            penalties={penalties}
            avgRating={avgRating}
            complaints={myComplaints}
          />
        )}
      </main>
    </div>
  );
}

// Queue View
function QueueView({ complaints, filterStatus, filterPriority, setFilterStatus, setFilterPriority, searchQuery, setSearchQuery, onOpenDetail }: any) {
  return (
    <div>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(ComplaintStatus).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
          >
            <option value="ALL">All Priorities</option>
            <option value={Priority.NORMAL}>Normal</option>
            <option value={Priority.EMERGENCY}>Emergency</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{complaints.filter((c: Complaint) => c.isActive).length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{complaints.filter((c: Complaint) => isOverdue(c)).length}</p>
          <p className="text-xs text-red-600">Overdue</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.IN_PROGRESS).length}</p>
          <p className="text-xs text-yellow-600">In Progress</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
          <p className="text-2xl font-bold text-purple-700">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.MARKED_RESOLVED).length}</p>
          <p className="text-xs text-purple-600">Awaiting Confirm</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.RESOLVED).length}</p>
          <p className="text-xs text-green-600">Resolved</p>
        </div>
      </div>

      {/* Complaint List */}
      <div className="space-y-3">
        {complaints.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No complaints match your filters.</p>
          </div>
        )}
        {complaints.map((c: Complaint) => {
          const upvoteCount = getUpvotesForComplaint(c.id).length;
          const overdue = isOverdue(c);

          return (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${
                overdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)}`}>
                      {c.priority === Priority.EMERGENCY && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                      {c.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    {overdue && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠ OVERDUE</span>}
                    <span className="text-xs text-slate-400">{c.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {overdue ? <span className="text-red-600 font-medium">OVERDUE</span> : `${getTimeRemaining(c.deadlineAt)} left`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {upvoteCount} upvotes
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Eye className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Warden Complaint Detail
function WardenComplaintDetail({ complaintId, wardenId, onBack, onRefresh }: any) {
  const store = getStore();
  const complaint = store.complaints.find((c: Complaint) => c.id === complaintId);
  const upvotes = getUpvotesForComplaint(complaintId);
  const auditEvents = getAuditForComplaint(complaintId);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint?.status || ComplaintStatus.SUBMITTED);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showUpdate, setShowUpdate] = useState(false);

  if (!complaint) return <div className="text-center py-12 text-slate-500">Complaint not found.</div>;

  const overdue = isOverdue(complaint);
  const submitterName = getUserById(complaint.submitterId)?.name || 'Anonymous';

  const handleStatusUpdate = () => {
    const updates: Partial<Complaint> = { status: newStatus };

    if (newStatus === ComplaintStatus.MARKED_RESOLVED) {
      updates.markedResolvedAt = new Date().toISOString();
      updates.resolutionNote = resolutionNote || 'Issue has been addressed.';
      updates.confirmationWindowStart = new Date().toISOString();
      // Notify submitter
      addNotification({
        id: uuid(), userId: complaint.submitterId,
        message: `Your complaint "${complaint.title}" has been marked resolved. Please confirm.`,
        read: false, createdAt: new Date().toISOString(),
      });
    }

    if (newStatus === ComplaintStatus.ACKNOWLEDGED && complaint.status === ComplaintStatus.SUBMITTED) {
      addNotification({
        id: uuid(), userId: complaint.submitterId,
        message: `Your complaint "${complaint.title}" has been acknowledged by the warden.`,
        read: false, createdAt: new Date().toISOString(),
      });
    }

    updateComplaint(complaintId, updates);
    addAuditEvent({
      id: uuid(), actorId: wardenId, action: 'STATUS_CHANGED',
      entityType: 'Complaint', entityId: complaintId,
      before: { status: complaint.status }, after: { status: newStatus },
      createdAt: new Date().toISOString(),
    });
    setShowUpdate(false);
    onRefresh();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to queue
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${complaint.priority === Priority.EMERGENCY ? 'bg-red-50 border-b border-red-200' : 'bg-slate-50 border-b border-slate-200'}`}>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority === Priority.EMERGENCY && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {complaint.priority}
            </span>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace(/_/g, ' ')}
            </span>
            {overdue && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">⚠ OVERDUE</span>}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{complaint.title}</h2>
          <p className="text-sm text-slate-500 mt-1">ID: {complaint.id} • {complaint.category} • Filed by: {submitterName}</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
            <p className="text-slate-900 text-sm leading-relaxed">{complaint.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Submitted</p>
              <p className="text-sm font-medium text-slate-900">{new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Deadline</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-slate-900'}`}>
                {new Date(complaint.deadlineAt).toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Time Remaining</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-slate-900'}`}>
                {getTimeRemaining(complaint.deadlineAt)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Upvotes</p>
              <p className="text-sm font-medium text-slate-900">{upvotes.length}</p>
            </div>
          </div>

          {/* Resolution note */}
          {complaint.resolutionNote && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-800 mb-1">Resolution Note</h3>
              <p className="text-sm text-green-700">{complaint.resolutionNote}</p>
            </div>
          )}

          {/* Status Update */}
          {complaint.status !== ComplaintStatus.RESOLVED && complaint.status !== ComplaintStatus.CLOSED && (
            <div className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  Update Status
                </h3>
                <button
                  onClick={() => setShowUpdate(!showUpdate)}
                  className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                >
                  {showUpdate ? 'Cancel' : 'Update'}
                </button>
              </div>

              {showUpdate && (
                <div className="space-y-3">
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as ComplaintStatus)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm"
                  >
                    {Object.values(ComplaintStatus).map(s => (
                      <option key={s} value={s} disabled={s === ComplaintStatus.RESOLVED || s === ComplaintStatus.CLOSED}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>

                  {(newStatus === ComplaintStatus.MARKED_RESOLVED) && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Resolution Note</label>
                      <textarea
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm resize-none"
                        rows={3}
                        placeholder="Describe what was done to resolve the issue..."
                      />
                    </div>
                  )}

                  <button
                    onClick={handleStatusUpdate}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Save Update
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Activity Log</h3>
            <div className="space-y-2">
              {auditEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-700">
                      <span className="font-medium">{event.action.replace(/_/g, ' ')}</span>
                      {event.after?.status ? ` → ${String(event.after.status).replace(/_/g, ' ')}` : null}
                      {event.after?.priority ? ` → ${String(event.after.priority)}` : null}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Overdue View
function OverdueView({ complaints, onOpenDetail }: any) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        Overdue Complaints ({complaints.length})
      </h2>
      {complaints.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="text-green-600 font-medium">No overdue complaints! Great work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c.id)}
              className="bg-white rounded-xl border border-red-200 p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">OVERDUE</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Deadline was: {new Date(c.deadlineAt).toLocaleString()} • {c.category}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Performance View
function PerformanceView({ ratings, penalties, avgRating, complaints }: any) {
  const resolved = complaints.filter((c: Complaint) => c.status === ComplaintStatus.RESOLVED);
  const total = complaints.length;
  const resolvedOnTime = resolved.filter((c: Complaint) => {
    if (!c.markedResolvedAt) return false;
    return new Date(c.markedResolvedAt) <= new Date(c.deadlineAt);
  }).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Performance Summary</h2>

      {/* Score Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3].map(star => (
                <Star key={star} className={`w-6 h-6 ${star <= Math.round(avgRating) ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
              ))}
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgRating.toFixed(1)}/3.0</p>
            <p className="text-sm text-slate-500">Student Rating ({ratings.length} ratings)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{penalties.length}</p>
            <p className="text-sm text-slate-500">Deadline Penalties</p>
            <p className="text-xs text-slate-400 mt-1">Each penalty = −1 star</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{total > 0 ? Math.round((resolvedOnTime / total) * 100) : 0}%</p>
            <p className="text-sm text-slate-500">On-time Resolution</p>
            <p className="text-xs text-slate-400 mt-1">{resolvedOnTime}/{total} complaints</p>
          </div>
        </div>
      </div>

      {/* Ratings List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Recent Ratings</h3>
        {ratings.length === 0 ? (
          <p className="text-sm text-slate-500">No ratings received yet.</p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r: any) => {
              const complaint = complaints.find((c: Complaint) => c.id === r.complaintId);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{complaint?.title || r.complaintId}</p>
                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= r.stars ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Penalties List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          Penalty Events
        </h3>
        {penalties.length === 0 ? (
          <p className="text-sm text-green-600">No penalties — all deadlines met!</p>
        ) : (
          <div className="space-y-3">
            {penalties.map((p: any) => {
              const complaint = complaints.find((c: Complaint) => c.id === p.complaintId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{complaint?.title || p.complaintId}</p>
                    <p className="text-xs text-slate-500">
                      {p.deadlineType} deadline • {new Date(p.deadlineAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600">−1 ★</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
