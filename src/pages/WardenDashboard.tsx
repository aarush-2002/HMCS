import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Complaint, ComplaintStatus, Priority, Category, VoteType,
  isOverdue, getTimeRemaining,
} from '../shared/types';
import { POLICY } from '../shared/policy';
import {
  getStore, updateComplaintStatus, getUpvotesForComplaint,
  getResolutionVotesForComplaint, addResolutionVote, addWardenRating,
  getRatingsForWarden, getPenaltiesForWarden, getAuditForComplaint,
  getUserById, getNotificationsForUser, markNotificationRead,
  runSchedulers,
} from '../store/data';
import {
  Button, Card, Badge, StatusBadge, PriorityBadge, Tabs, Input, Textarea,
  Select, EmptyState, Countdown, StarRating, showToast,
} from '../components/ui';
import { v4 as uuid } from 'uuid';
import {
  Shield, LogOut, Building2, Clock, AlertTriangle, CheckCircle,
  ArrowLeft, BarChart3, Star, List, Eye, Edit3, TrendingDown,
  Users, Search, Bell, Menu, X, Filter, ArrowUpDown, Zap,
  ThumbsUp, ThumbsDown, Info,
} from 'lucide-react';

type View = 'queue' | 'detail' | 'overdue' | 'performance' | 'notifications';
type SortOption = 'deadline' | 'priority' | 'newest';

export default function WardenDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('queue');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [, setRefresh] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<Category | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('deadline');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) return null;
  const store = getStore();
  const forceRefresh = () => setRefresh(r => r + 1);

  // Run schedulers on mount
  useEffect(() => {
    runSchedulers();
  }, []);

  const myComplaints = useMemo(() => {
    let list = store.complaints.filter(c => c.hostelId === user.hostelId && c.assignedWardenId === user.id);
    
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus);
    if (filterPriority !== 'ALL') list = list.filter(c => c.priority === filterPriority);
    if (filterCategory !== 'ALL') list = list.filter(c => c.category === filterCategory);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    // Sort
    switch (sortBy) {
      case 'priority':
        list = list.sort((a, b) => {
          if (a.priority === Priority.EMERGENCY && b.priority !== Priority.EMERGENCY) return -1;
          if (b.priority === Priority.EMERGENCY && a.priority !== Priority.EMERGENCY) return 1;
          return 0;
        });
        break;
      case 'newest':
        list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default: // deadline
        list = list.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
    }

    return list;
  }, [store.complaints, filterStatus, filterPriority, filterCategory, sortBy, searchQuery, user]);

  const overdueComplaints = myComplaints.filter(c => isOverdue(c));
  const awaitingConfirmation = myComplaints.filter(c => c.status === ComplaintStatus.MARKED_RESOLVED);
  const ratings = getRatingsForWarden(user.id);
  const penalties = getPenaltiesForWarden(user.id);
  const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : 0;

  const openDetail = (id: string) => {
    setSelectedComplaint(id);
    setView('detail');
    setSidebarOpen(false);
  };

  const navItems = [
    { key: 'queue', label: 'Queue', icon: <List className="w-5 h-5" />, count: myComplaints.filter(c => c.isActive).length },
    { key: 'overdue', label: 'Overdue', icon: <AlertTriangle className="w-5 h-5" />, count: overdueComplaints.length, danger: true },
    { key: 'performance', label: 'Performance', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--stone-50)] flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-[var(--stone-200)] flex-col shrink-0">
        <div className="p-5 border-b border-[var(--stone-200)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</h1>
              <p className="text-xs text-[var(--stone-500)]">Warden</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key as View)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                view === item.key
                  ? 'bg-[var(--accent-50)] text-[var(--accent-800)]'
                  : 'text-[var(--stone-600)] hover:bg-[var(--stone-100)]'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  item.danger && item.count > 0 ? 'bg-red-100 text-red-700' : 'bg-[var(--stone-100)] text-[var(--stone-600)]'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--stone-200)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-amber-800">{user.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--stone-900)] truncate">{user.name}</p>
              <p className="text-xs text-[var(--stone-500)] truncate">{store.hostel.name}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--stone-600)] hover:bg-[var(--stone-100)] transition">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="p-5 border-b border-[var(--stone-200)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setView(item.key as View); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    view === item.key ? 'bg-[var(--accent-50)] text-[var(--accent-800)]' : 'text-[var(--stone-600)] hover:bg-[var(--stone-100)]'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--stone-100)]">{item.count}</span>}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="bg-white border-b border-[var(--stone-200)] sticky top-0 z-20 md:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--stone-100)]" aria-label="Open menu">
              <Menu className="w-5 h-5 text-[var(--stone-700)]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-[var(--stone-100)]" aria-label="Logout">
              <LogOut className="w-5 h-5 text-[var(--stone-600)]" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {view === 'queue' && (
              <QueueView
                complaints={myComplaints}
                filterStatus={filterStatus}
                filterPriority={filterPriority}
                filterCategory={filterCategory}
                sortBy={sortBy}
                searchQuery={searchQuery}
                setFilterStatus={setFilterStatus}
                setFilterPriority={setFilterPriority}
                setFilterCategory={setFilterCategory}
                setSortBy={setSortBy}
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
            {view === 'overdue' && <OverdueView complaints={overdueComplaints} onOpenDetail={openDetail} />}
            {view === 'performance' && (
              <PerformanceView ratings={ratings} penalties={penalties} avgRating={avgRating} complaints={myComplaints} wardenId={user.id} />
            )}
            {view === 'notifications' && <NotificationsView userId={user.id} onRefresh={forceRefresh} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Queue View ────────────────────────────────────────────────────────────────
function QueueView({ complaints, filterStatus, filterPriority, filterCategory, sortBy, searchQuery, setFilterStatus, setFilterPriority, setFilterCategory, setSortBy, setSearchQuery, onOpenDetail }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Complaint Queue</h2>

      {/* Filters */}
      <Card>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--stone-300)] text-sm bg-white focus:border-[var(--accent-600)] focus:ring-2 focus:ring-[var(--accent-100)] outline-none"
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white">
              <option value="ALL">All Statuses</option>
              {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white">
              <option value="ALL">All Priorities</option>
              <option value={Priority.NORMAL}>Normal</option>
              <option value={Priority.EMERGENCY}>Emergency</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white">
              <option value="ALL">All Categories</option>
              {Object.values(Category).map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-[var(--stone-100)]">
            <ArrowUpDown className="w-4 h-4 text-[var(--stone-500)]" />
            <span className="text-sm text-[var(--stone-600)]">Sort:</span>
            <div className="flex gap-1">
              {[
                { key: 'deadline', label: 'Deadline' },
                { key: 'priority', label: 'Priority' },
                { key: 'newest', label: 'Newest' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setSortBy(opt.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    sortBy === opt.key ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'text-[var(--stone-600)] hover:bg-[var(--stone-100)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Complaint List */}
      {complaints.length === 0 ? (
        <EmptyState icon={<CheckCircle className="w-8 h-8" />} title="No complaints" description="All caught up!" />
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => {
            const upvoteCount = getUpvotesForComplaint(c.id).length;
            const overdue = isOverdue(c);
            const submitter = getUserById(c.submitterId);
            return (
              <Card key={c.id} hover onClick={() => onOpenDetail(c.id)} className={overdue ? 'border-red-200 bg-red-50/30' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                      {overdue && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue</Badge>}
                    </div>
                    <h3 className="font-semibold text-[var(--stone-900)] text-sm">{c.title}</h3>
                    <p className="text-xs text-[var(--stone-500)] mt-0.5 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--stone-500)]">
                      <Countdown deadlineAt={c.deadlineAt} compact />
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{upvoteCount}</span>
                      <span>{c.category}</span>
                      {submitter && <span>by {submitter.name}</span>}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-[var(--stone-400)] shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Warden Complaint Detail ───────────────────────────────────────────────────
function WardenComplaintDetail({ complaintId, wardenId, onBack, onRefresh }: any) {
  const store = getStore();
  const complaint = store.complaints.find((c: Complaint) => c.id === complaintId);
  const upvotes = getUpvotesForComplaint(complaintId);
  const auditEvents = getAuditForComplaint(complaintId);
  const resVotes = complaint ? getResolutionVotesForComplaint(complaintId, complaint.resolutionRound) : [];
  const solvedVotes = resVotes.filter(v => v.voteType === VoteType.SOLVED).length;
  const notSolvedVotes = resVotes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
  
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(complaint?.status || ComplaintStatus.SUBMITTED);
  const [resolutionNote, setResolutionNote] = useState('');
  const [showUpdate, setShowUpdate] = useState(false);
  const [error, setError] = useState('');

  if (!complaint) return <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Not found" />;
  const overdue = isOverdue(complaint);
  const submitter = getUserById(complaint.submitterId);

  // Get valid next statuses
  const validNextStatuses = useMemo(() => {
    const transitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      [ComplaintStatus.SUBMITTED]: [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.REJECTED],
      [ComplaintStatus.ACKNOWLEDGED]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.REJECTED],
      [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.MARKED_RESOLVED, ComplaintStatus.REJECTED],
      [ComplaintStatus.MARKED_RESOLVED]: [],
      [ComplaintStatus.RESOLVED]: [],
      [ComplaintStatus.REOPENED]: [ComplaintStatus.IN_PROGRESS],
      [ComplaintStatus.CLOSED]: [],
      [ComplaintStatus.REJECTED]: [],
    };
    return transitions[complaint.status] || [];
  }, [complaint.status]);

  const handleStatusUpdate = () => {
    setError('');
    const result = updateComplaintStatus(
      complaintId,
      newStatus,
      wardenId,
      newStatus === ComplaintStatus.MARKED_RESOLVED ? resolutionNote : undefined
    );
    
    if (!result.success) {
      setError(result.error || 'Update failed');
      return;
    }
    
    setShowUpdate(false);
    showToast('success', 'Status updated');
    onRefresh();
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--stone-600)] hover:text-[var(--stone-900)] mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to queue
      </button>

      <Card padding="none" className="overflow-hidden">
        <div className={`p-5 sm:p-6 ${complaint.priority === Priority.EMERGENCY ? 'bg-red-50 border-b border-red-200' : 'bg-[var(--stone-50)] border-b border-[var(--stone-200)]'}`}>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
            {overdue && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue</Badge>}
          </div>
          <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">{complaint.title}</h2>
          <p className="text-xs text-[var(--stone-500)] mt-1">{complaint.id} • {complaint.category} • Filed by: {submitter?.name || 'Unknown'}</p>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <p className="text-sm text-[var(--stone-800)] leading-relaxed">{complaint.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Submitted</p>
              <p className="text-sm font-medium">{new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Deadline</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-700' : ''}`}>{new Date(complaint.deadlineAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Remaining</p>
              <Countdown deadlineAt={complaint.deadlineAt} />
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Upvotes</p>
              <p className="text-sm font-medium">{upvotes.length}</p>
            </div>
          </div>

          {complaint.resolutionNote && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Resolution Note</p>
              <p className="text-sm text-green-700">{complaint.resolutionNote}</p>
            </div>
          )}

          {/* Resolution Confirmation Status */}
          {complaint.status === ComplaintStatus.MARKED_RESOLVED && complaint.confirmationWindowEnd && (
            <div className="bg-[var(--accent-50)] border border-[var(--accent-200)] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[var(--accent-800)] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Resolution Confirmation
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-[var(--stone-600)]">Solved</p>
                  <p className="text-lg font-bold text-green-700">{solvedVotes}/{POLICY.resolutionVotesRequired}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--stone-600)]">Not Solved</p>
                  <p className="text-lg font-bold text-red-700">{notSolvedVotes}/{POLICY.resolutionVotesRequired}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--accent-700)]">
                <Clock className="w-4 h-4" />
                <span>Window closes: <Countdown deadlineAt={complaint.confirmationWindowEnd} /></span>
              </div>
            </div>
          )}

          {/* Status Update */}
          {validNextStatuses.length > 0 && (
            <div className="border border-[var(--stone-200)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[var(--stone-700)] flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Update Status
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setShowUpdate(!showUpdate)}>
                  {showUpdate ? 'Cancel' : 'Update'}
                </Button>
              </div>
              {showUpdate && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-[var(--stone-700)] mb-2">Valid next statuses:</label>
                    <div className="flex flex-wrap gap-2">
                      {validNextStatuses.map(status => (
                        <button
                          key={status}
                          onClick={() => setNewStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                            newStatus === status ? 'bg-[var(--accent-100)] text-[var(--accent-800)] border-2 border-[var(--accent-300)]' : 'bg-[var(--stone-100)] text-[var(--stone-700)] border-2 border-transparent hover:border-[var(--stone-300)]'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                  {newStatus === ComplaintStatus.MARKED_RESOLVED && (
                    <Textarea
                      label="Resolution Note (min 10 chars)"
                      value={resolutionNote}
                      onChange={e => setResolutionNote(e.target.value)}
                      placeholder="What was done to resolve this?"
                      rows={3}
                      showCount
                      maxLength={500}
                    />
                  )}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <Button onClick={handleStatusUpdate} size="sm">Save Update</Button>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-[var(--stone-700)] mb-3">Activity Log</h3>
            <div className="space-y-2">
              {auditEvents.map(event => (
                <div key={event.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-[var(--stone-700)]">{event.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[var(--stone-500)]">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Overdue View ──────────────────────────────────────────────────────────────
function OverdueView({ complaints, onOpenDetail }: any) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600" /> Overdue ({complaints.length})
      </h2>
      {complaints.length === 0 ? (
        <EmptyState icon={<CheckCircle className="w-8 h-8" />} title="No overdue complaints" description="Great work keeping everything on time!" />
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => {
            const overdueBy = Math.floor((Date.now() - new Date(c.deadlineAt).getTime()) / 3600000);
            return (
              <Card key={c.id} hover onClick={() => onOpenDetail(c.id)} className="border-red-200">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <PriorityBadge priority={c.priority} />
                  <StatusBadge status={c.status} />
                  <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue by {overdueBy}h</Badge>
                </div>
                <h3 className="font-semibold text-[var(--stone-900)] text-sm">{c.title}</h3>
                <p className="text-xs text-[var(--stone-500)] mt-1">Deadline was: {new Date(c.deadlineAt).toLocaleString()}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Performance View ──────────────────────────────────────────────────────────
function PerformanceView({ ratings, penalties, avgRating, complaints, wardenId }: any) {
  const resolved = complaints.filter((c: Complaint) => c.status === ComplaintStatus.RESOLVED);
  const resolvedOnTime = resolved.filter((c: Complaint) => c.markedResolvedAt && new Date(c.markedResolvedAt) <= new Date(c.deadlineAt)).length;
  const normalComplaints = complaints.filter((c: Complaint) => c.priority === Priority.NORMAL);
  const emergencyComplaints = complaints.filter((c: Complaint) => c.priority === Priority.EMERGENCY);
  const normalOnTime = normalComplaints.filter((c: Complaint) => c.markedResolvedAt && new Date(c.markedResolvedAt) <= new Date(c.deadlineAt)).length;
  const emergencyOnTime = emergencyComplaints.filter((c: Complaint) => c.markedResolvedAt && new Date(c.markedResolvedAt) <= new Date(c.deadlineAt)).length;

  // Median resolution time
  const resolutionTimes = resolved
    .filter((c: Complaint) => c.markedResolvedAt)
    .map((c: Complaint) => new Date(c.markedResolvedAt!).getTime() - new Date(c.createdAt).getTime())
    .sort((a: number, b: number) => a - b);
  const medianTime = resolutionTimes.length > 0 ? resolutionTimes[Math.floor(resolutionTimes.length / 2)] : 0;
  const medianHours = Math.floor(medianTime / 3600000);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Performance</h2>

      {/* Score Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3].map(s => <Star key={s} className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-current' : 'text-[var(--stone-300)]'}`} />)}
          </div>
          <p className="text-2xl font-bold text-[var(--stone-900)] font-heading">{avgRating.toFixed(1)}/3.0</p>
          <p className="text-xs text-[var(--stone-500)]">Student Rating ({ratings.length})</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600 font-heading">{penalties.length}</p>
          <p className="text-xs text-[var(--stone-500)]">Penalty Points</p>
          <p className="text-xs text-[var(--stone-400)] mt-0.5">Separate from star rating</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600 font-heading">{complaints.length > 0 ? Math.round((resolvedOnTime / complaints.length) * 100) : 0}%</p>
          <p className="text-xs text-[var(--stone-500)]">On-time Rate</p>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Breakdown</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[var(--stone-50)] rounded-lg p-4">
            <p className="text-xs text-[var(--stone-500)] mb-1">Normal Complaints</p>
            <p className="text-lg font-bold text-[var(--stone-900)]">{normalOnTime}/{normalComplaints.length} on time</p>
            <p className="text-xs text-[var(--stone-500)]">{normalComplaints.length > 0 ? Math.round((normalOnTime / normalComplaints.length) * 100) : 0}%</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-xs text-red-600 mb-1">Emergency Complaints</p>
            <p className="text-lg font-bold text-red-800">{emergencyOnTime}/{emergencyComplaints.length} on time</p>
            <p className="text-xs text-red-600">{emergencyComplaints.length > 0 ? Math.round((emergencyOnTime / emergencyComplaints.length) * 100) : 0}%</p>
          </div>
          <div className="bg-[var(--stone-50)] rounded-lg p-4 sm:col-span-2">
            <p className="text-xs text-[var(--stone-500)] mb-1">Median Resolution Time</p>
            <p className="text-lg font-bold text-[var(--stone-900)]">{medianHours}h</p>
          </div>
        </div>
      </Card>

      {/* How Score is Calculated */}
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--accent-600)]" /> How is my score calculated?
        </h3>
        <div className="space-y-2 text-sm text-[var(--stone-700)]">
          <p><strong>Star Rating:</strong> Average of student ratings (1-3 stars) after resolution. Anonymous to wardens.</p>
          <p><strong>Penalty Points:</strong> −1 point for each missed deadline. Separate from star rating.</p>
          <p><strong>On-time Rate:</strong> Percentage of complaints marked resolved before deadline.</p>
        </div>
      </Card>

      {/* Recent Ratings */}
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4">Recent Ratings</h3>
        {ratings.length === 0 ? <p className="text-sm text-[var(--stone-500)]">No ratings yet.</p> : (
          <div className="space-y-3">
            {ratings.slice(0, 10).map((r: any) => {
              const c = complaints.find((c: Complaint) => c.id === r.complaintId);
              return (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[var(--stone-100)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--stone-900)]">{c?.title || r.complaintId}</p>
                    <p className="text-xs text-[var(--stone-500)]">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <StarRating value={r.stars} readonly size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Penalty Events */}
      <Card>
        <h3 className="font-bold text-[var(--stone-900)] mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-600" /> Penalty Events
        </h3>
        {penalties.length === 0 ? <p className="text-sm text-green-600">No penalties — all deadlines met!</p> : (
          <div className="space-y-3">
            {penalties.map((p: any) => {
              const c = complaints.find((c: Complaint) => c.id === p.complaintId);
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[var(--stone-100)] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-[var(--stone-900)]">{c?.title || p.complaintId}</p>
                    <p className="text-xs text-[var(--stone-500)]">{p.deadlineType} • {new Date(p.deadlineAt).toLocaleString()}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">−1 pt</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Notifications View ────────────────────────────────────────────────────────
function NotificationsView({ userId, onRefresh }: any) {
  const notifications = getNotificationsForUser(userId);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">Notifications</h2>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={n.read ? '' : 'border-[var(--accent-200)] bg-[var(--accent-50)]/30'}>
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-[var(--stone-300)]' : 'bg-[var(--accent-500)]'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${n.read ? 'text-[var(--stone-600)]' : 'text-[var(--stone-900)] font-medium'}`}>{n.message}</p>
                  <p className="text-xs text-[var(--stone-500)] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button onClick={() => { markNotificationRead(n.id); onRefresh(); }} className="text-xs text-[var(--accent-700)] hover:text-[var(--accent-800)] font-medium shrink-0">
                    Mark read
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
