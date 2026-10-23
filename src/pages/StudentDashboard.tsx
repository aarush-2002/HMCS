import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Complaint, ComplaintStatus, Priority, Category, VoteType,
  calculateDeadline, isOverdue,
} from '../shared/types';
import { POLICY } from '../shared/policy';
import {
  getStore, addComplaint, updateComplaint, addUpvote, removeUpvote,
  addResolutionVote, addWardenRating, addNotification, addAuditEvent,
  getUpvotesForComplaint, getResolutionVotesForComplaint,
  getStudentComplaintsToday, getStudentEmergencyThisWeek,
  getNotificationsForUser, markNotificationRead, getAuditForComplaint,
  checkAndPromote, processResolutionVote, runSchedulers,
} from '../store/data';
import {
  Button, Card, Badge, StatusBadge, PriorityBadge, Tabs, Input, Textarea,
  Select, FileDropzone, EmptyState, Countdown, StarRating, showToast,
} from '../components/ui';
import { v4 as uuid } from 'uuid';
import {
  Plus, AlertTriangle, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Star, Bell,
  Clock, LogOut, Building2, Search, Send, ArrowLeft, Home, FileText,
  Filter, Zap, ArrowUpDown,
} from 'lucide-react';

type View = 'feed' | 'new' | 'detail' | 'history' | 'notifications';
type SortOption = 'newest' | 'upvotes' | 'deadline';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('feed');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [, setRefresh] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Run schedulers on mount
  useEffect(() => {
    runSchedulers();
  }, []);

  // URL state for filters
  const searchQuery = searchParams.get('q') || '';
  const filterStatus = (searchParams.get('status') || 'ALL') as ComplaintStatus | 'ALL';
  const filterPriority = (searchParams.get('priority') || 'ALL') as Priority | 'ALL';
  const filterCategory = (searchParams.get('category') || 'ALL') as Category | 'ALL';
  const sortBy = (searchParams.get('sort') || 'newest') as SortOption;

  if (!user) return null;
  const store = getStore();
  const forceRefresh = () => setRefresh(r => r + 1);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'ALL' || value === 'newest') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  const activeComplaints = useMemo(() => {
    let list = store.complaints.filter(c => c.hostelId === user.hostelId && c.isActive);
    
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus);
    if (filterPriority !== 'ALL') list = list.filter(c => c.priority === filterPriority);
    if (filterCategory !== 'ALL') list = list.filter(c => c.category === filterCategory);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    // Sort
    switch (sortBy) {
      case 'upvotes':
        list = list.sort((a, b) => {
          const aVotes = getUpvotesForComplaint(a.id).length;
          const bVotes = getUpvotesForComplaint(b.id).length;
          return bVotes - aVotes;
        });
        break;
      case 'deadline':
        list = list.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
        break;
      default: // newest
        list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Emergency first
    list = list.sort((a, b) => {
      if (a.priority === Priority.EMERGENCY && b.priority !== Priority.EMERGENCY) return -1;
      if (b.priority === Priority.EMERGENCY && a.priority !== Priority.EMERGENCY) return 1;
      return 0;
    });

    return list;
  }, [store.complaints, filterStatus, filterPriority, filterCategory, searchQuery, sortBy, user.hostelId]);

  const myComplaints = store.complaints.filter(c => c.submitterId === user.id);
  const unreadNotifications = getNotificationsForUser(user.id).filter(n => !n.read);

  const openDetail = (id: string) => {
    setSelectedComplaint(id);
    setView('detail');
  };

  const tabs = [
    { key: 'feed', label: 'Hostel Feed', icon: <Home className="w-5 h-5" /> },
    { key: 'new', label: 'New', icon: <Plus className="w-5 h-5" /> },
    { key: 'history', label: 'My Complaints', icon: <FileText className="w-5 h-5" /> },
    { key: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, count: unreadNotifications.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--stone-50)] pb-20 md:pb-0">
      {/* Top Bar */}
      <header className="bg-white border-b border-[var(--stone-200)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--accent-700)] rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-[var(--stone-900)] font-heading">HMCS</h1>
              <p className="text-xs text-[var(--stone-500)]">{store.hostel.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--stone-600)] hidden sm:block">{user.name}</span>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-[var(--stone-100)] transition" title="Logout" aria-label="Logout">
              <LogOut className="w-5 h-5 text-[var(--stone-600)]" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Tabs */}
      <nav className="bg-white border-b border-[var(--stone-200)] hidden md:block">
        <div className="max-w-6xl mx-auto px-4">
          <Tabs
            tabs={tabs}
            activeTab={view === 'detail' ? 'feed' : view}
            onChange={(key) => setView(key as View)}
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'feed' && (
          <FeedView
            complaints={activeComplaints}
            user={user}
            searchQuery={searchQuery}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            filterCategory={filterCategory}
            sortBy={sortBy}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            updateFilter={updateFilter}
            onOpenDetail={openDetail}
            onRefresh={forceRefresh}
          />
        )}
        {view === 'new' && (
          <NewComplaintForm
            user={user}
            onSubmit={() => { forceRefresh(); setView('feed'); }}
          />
        )}
        {view === 'detail' && selectedComplaint && (
          <ComplaintDetail
            complaintId={selectedComplaint}
            user={user}
            onBack={() => setView('feed')}
            onRefresh={forceRefresh}
          />
        )}
        {view === 'history' && (
          <HistoryView complaints={myComplaints} onOpenDetail={openDetail} />
        )}
        {view === 'notifications' && (
          <NotificationsView userId={user.id} onRefresh={forceRefresh} />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[var(--stone-200)] md:hidden z-30">
        <div className="flex items-center justify-around py-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as View)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition ${
                view === tab.key ? 'text-[var(--accent-700)]' : 'text-[var(--stone-500)]'
              }`}
              aria-label={tab.label}
            >
              <div className="relative">
                {tab.icon}
                {tab.count && tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ─── Feed View ─────────────────────────────────────────────────────────────────
function FeedView({ complaints, user, searchQuery, filterStatus, filterPriority, filterCategory, sortBy, showFilters, setShowFilters, updateFilter, onOpenDetail, onRefresh }: any) {
  const store = getStore();
  const normalUsedToday = getStudentComplaintsToday(user.id);
  const emergencyUsedWeek = getStudentEmergencyThisWeek(user.id);

  const handleUpvote = (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existing = store.upvotes.find(u => u.complaintId === complaintId && u.userId === user.id);
    const complaint = store.complaints.find(c => c.id === complaintId);
    
    if (existing) {
      // Remove upvote (only if still NORMAL)
      if (complaint && complaint.priority === Priority.NORMAL) {
        removeUpvote(complaintId, user.id);
        showToast('info', 'Upvote removed');
      } else {
        showToast('error', 'Cannot remove upvote from emergency complaints');
      }
    } else {
      // Add upvote
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
      
      // Check for promotion
      const promoted = checkAndPromote(complaintId);
      if (promoted) {
        showToast('success', '🚨 Complaint promoted to Emergency!');
      } else {
        showToast('success', 'Upvote added');
      }
    }
    onRefresh();
  };

  const hasActiveFilters = filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterCategory !== 'ALL' || searchQuery;

  return (
    <div className="space-y-4">
      {/* Allowance Summary */}
      <div className="bg-white rounded-xl border border-[var(--stone-200)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--stone-800)]">Your Allowance</h3>
          <Button size="sm" variant="outline" onClick={() => window.location.hash = '#/student?view=new'} icon={<Plus className="w-4 h-4" />}>
            New Complaint
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 border ${normalUsedToday < POLICY.normalComplaintsPerDay ? 'bg-[var(--accent-50)] border-[var(--accent-200)]' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-[var(--stone-600)]">Normal (today)</p>
            <p className={`text-lg font-bold font-heading ${normalUsedToday < POLICY.normalComplaintsPerDay ? 'text-[var(--accent-800)]' : 'text-red-700'}`}>
              {POLICY.normalComplaintsPerDay - normalUsedToday}/{POLICY.normalComplaintsPerDay}
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${emergencyUsedWeek < POLICY.emergencyComplaintsPerWeek ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-[var(--stone-600)]">Emergency (week)</p>
            <p className={`text-lg font-bold font-heading ${emergencyUsedWeek < POLICY.emergencyComplaintsPerWeek ? 'text-amber-800' : 'text-red-700'}`}>
              {POLICY.emergencyComplaintsPerWeek - emergencyUsedWeek}/{POLICY.emergencyComplaintsPerWeek}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-[var(--stone-200)] p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => updateFilter('q', e.target.value)}
              placeholder="Search complaints..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--stone-300)] focus:border-[var(--accent-600)] focus:ring-2 focus:ring-[var(--accent-100)] outline-none text-sm bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition flex items-center gap-2 ${
              showFilters || hasActiveFilters ? 'bg-[var(--accent-50)] border-[var(--accent-300)] text-[var(--accent-800)]' : 'border-[var(--stone-300)] text-[var(--stone-700)] hover:bg-[var(--stone-50)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 bg-[var(--accent-600)] rounded-full" />}
          </button>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--stone-100)]">
            <select
              value={filterStatus}
              onChange={e => updateFilter('status', e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(ComplaintStatus).map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <select
              value={filterPriority}
              onChange={e => updateFilter('priority', e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
            >
              <option value="ALL">All Priorities</option>
              <option value={Priority.NORMAL}>Normal</option>
              <option value={Priority.EMERGENCY}>Emergency</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => updateFilter('category', e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
            >
              <option value="ALL">All Categories</option>
              {Object.values(Category).map(c => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sort */}
        <div className="flex items-center gap-2 pt-3 border-t border-[var(--stone-100)]">
          <ArrowUpDown className="w-4 h-4 text-[var(--stone-500)]" />
          <span className="text-sm text-[var(--stone-600)]">Sort:</span>
          <div className="flex gap-1">
            {[
              { key: 'newest', label: 'Newest' },
              { key: 'upvotes', label: 'Most Upvoted' },
              { key: 'deadline', label: 'Nearest Deadline' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => updateFilter('sort', opt.key)}
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-xl font-bold text-[var(--stone-900)] font-heading">{complaints.length}</p>
          <p className="text-xs text-[var(--stone-500)]">Active</p>
        </Card>
        <Card className="text-center bg-red-50 border-red-200">
          <p className="text-xl font-bold text-red-700 font-heading">{complaints.filter((c: Complaint) => c.priority === Priority.EMERGENCY).length}</p>
          <p className="text-xs text-red-600">Emergency</p>
        </Card>
        <Card className="text-center bg-[var(--accent-50)] border-[var(--accent-200)]">
          <p className="text-xl font-bold text-[var(--accent-800)] font-heading">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.MARKED_RESOLVED).length}</p>
          <p className="text-xs text-[var(--accent-700)]">Confirm</p>
        </Card>
      </div>

      {/* Complaint List */}
      {complaints.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No complaints found"
          description={hasActiveFilters ? "Try adjusting your filters." : "No active complaints in your hostel."}
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => {
            const upvoteCount = getUpvotesForComplaint(c.id).length;
            const hasVoted = getUpvotesForComplaint(c.id).some(u => u.userId === user.id);
            const overdue = isOverdue(c);
            const isMine = c.submitterId === user.id;

            return (
              <ComplaintCard
                key={c.id}
                complaint={c}
                upvoteCount={upvoteCount}
                hasVoted={hasVoted}
                overdue={overdue}
                isMine={isMine}
                onUpvote={(e: React.MouseEvent) => handleUpvote(c.id, e)}
                onClick={() => onOpenDetail(c.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── New Complaint Form ────────────────────────────────────────────────────────
function NewComplaintForm({ user, onSubmit }: any) {
  const normalUsedToday = getStudentComplaintsToday(user.id);
  const emergencyUsedWeek = getStudentEmergencyThisWeek(user.id);
  const canSubmitNormal = normalUsedToday < POLICY.normalComplaintsPerDay;
  const canSubmitEmergency = emergencyUsedWeek < POLICY.emergencyComplaintsPerWeek;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(Category.OTHER);
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (title.length < 5) errs.title = 'Title must be at least 5 characters';
    if (title.length > 120) errs.title = 'Title must be 120 characters or less';
    if (description.length < 20) errs.description = 'Description must be at least 20 characters';
    if (description.length > 2000) errs.description = 'Description must be 2000 characters or less';
    if (priority === Priority.NORMAL && !canSubmitNormal) errs.priority = 'Daily normal complaint limit reached';
    if (priority === Priority.EMERGENCY && !canSubmitEmergency) errs.priority = 'Weekly emergency complaint limit reached';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      const complaint: Complaint = {
        id: `C-${uuid().slice(0, 8).toUpperCase()}`,
        title, description, category, priority,
        status: ComplaintStatus.SUBMITTED,
        submitterId: user.id, hostelId: user.hostelId,
        assignedWardenId: Math.random() > 0.5 ? 'warden-1' : 'warden-2',
        deadlineAt: calculateDeadline(priority, now),
        promotedAt: null, markedResolvedAt: null, resolvedAt: null,
        resolutionNote: null, resolutionRound: 1, isActive: true,
        confirmationWindowStart: null, confirmationWindowEnd: null,
        createdAt: now, updatedAt: now,
      };
      addComplaint(complaint);
      addAuditEvent({
        id: uuid(), actorId: user.id, action: 'COMPLAINT_CREATED',
        entityType: 'Complaint', entityId: complaint.id,
        before: null, after: { status: 'SUBMITTED', priority },
        createdAt: now,
      });
      setSubmitted(complaint);
      setSubmitting(false);
      showToast('success', 'Complaint submitted successfully!');
    }, 800);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-2">Complaint Submitted</h2>
          <p className="text-sm text-[var(--stone-600)] mb-6">Your complaint has been recorded and assigned to a warden.</p>
          <div className="bg-[var(--stone-50)] rounded-xl p-4 text-left space-y-2.5 border border-[var(--stone-200)]">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--stone-500)]">Complaint ID</span>
              <span className="text-sm font-mono font-medium">{submitted.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--stone-500)]">Priority</span>
              <PriorityBadge priority={submitted.priority} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--stone-500)]">Deadline</span>
              <span className="text-sm font-medium">{new Date(submitted.deadlineAt).toLocaleString()}</span>
            </div>
          </div>
          <Button onClick={onSubmit} className="w-full mt-6">Back to Feed</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-1">File a Complaint</h2>
        <p className="text-sm text-[var(--stone-500)] mb-6">Describe the issue clearly for faster resolution.</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Brief summary" error={errors.title} maxLength={120} required />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem in detail..." error={errors.description} showCount maxLength={2000} rows={5} required />
          <Select label="Category" value={category} onChange={v => setCategory(v as Category)} options={Object.values(Category).map(c => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }))} />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--stone-700)]">Priority</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPriority(Priority.NORMAL)} disabled={!canSubmitNormal}
                className={`p-4 rounded-xl border-2 text-left transition ${priority === Priority.NORMAL ? 'border-[var(--accent-600)] bg-[var(--accent-50)]' : 'border-[var(--stone-200)] hover:border-[var(--stone-300)]'} disabled:opacity-50`}>
                <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4" /><span className="text-sm font-semibold">Normal</span></div>
                <p className="text-xs text-[var(--stone-500)]">{POLICY.normalDeadlineHours}h deadline</p>
              </button>
              <button type="button" onClick={() => canSubmitEmergency && setPriority(Priority.EMERGENCY)} disabled={!canSubmitEmergency}
                className={`p-4 rounded-xl border-2 text-left transition ${priority === Priority.EMERGENCY ? 'border-red-500 bg-red-50' : 'border-[var(--stone-200)] hover:border-[var(--stone-300)]'} disabled:opacity-50`}>
                <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-sm font-semibold">Emergency</span></div>
                <p className="text-xs text-[var(--stone-500)]">{POLICY.emergencyDeadlineHours}h deadline</p>
              </button>
            </div>
          </div>
          <FileDropzone label="Photos (optional)" files={photos} onFilesChange={setPhotos} maxFiles={4} maxSizeMB={5} />
          <Button type="submit" className="w-full" loading={submitting} icon={<Send className="w-4 h-4" />} size="lg">Submit Complaint</Button>
        </form>
      </Card>
    </div>
  );
}

// ─── Complaint Detail ──────────────────────────────────────────────────────────
function ComplaintDetail({ complaintId, user, onBack, onRefresh }: any) {
  const store = getStore();
  const complaint = store.complaints.find((c: Complaint) => c.id === complaintId);
  const upvotes = getUpvotesForComplaint(complaintId);
  const hasVoted = upvotes.some(u => u.userId === user.id);
  const resVotes = getResolutionVotesForComplaint(complaintId, complaint?.resolutionRound || 1);
  const solvedVotes = resVotes.filter(v => v.voteType === VoteType.SOLVED).length;
  const notSolvedVotes = resVotes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
  const hasResolutionVoted = resVotes.some(v => v.userId === user.id);
  const auditEvents = getAuditForComplaint(complaintId);
  const isMyComplaint = complaint?.submitterId === user.id;
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (!complaint) return <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Complaint not found" />;

  const overdue = isOverdue(complaint);
  const canRate = isMyComplaint && complaint.status === ComplaintStatus.RESOLVED && !store.wardenRatings.find(r => r.complaintId === complaintId && r.studentId === user.id);

  const handleUpvote = () => {
    if (isMyComplaint) return;
    if (hasVoted) {
      if (complaint.priority === Priority.NORMAL) {
        removeUpvote(complaintId, user.id);
        showToast('info', 'Upvote removed');
      }
    } else {
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
      const promoted = checkAndPromote(complaintId);
      if (promoted) showToast('success', '🚨 Promoted to Emergency!');
      else showToast('success', 'Upvote added');
    }
    onRefresh();
  };

  const handleResolutionVote = (voteType: VoteType.SOLVED | VoteType.NOT_SOLVED) => {
    // Check if window is still open
    if (complaint.confirmationWindowEnd && new Date(complaint.confirmationWindowEnd) < new Date()) {
      showToast('error', 'Confirmation window has closed');
      return;
    }
    
    addResolutionVote({ id: uuid(), complaintId, userId: user.id, voteType, round: complaint.resolutionRound, createdAt: new Date().toISOString() });
    
    // Process the vote (check thresholds)
    processResolutionVote(complaintId);
    
    if (voteType === VoteType.SOLVED) {
      showToast('success', 'Vote recorded: Solved');
    } else {
      showToast('info', 'Vote recorded: Not Solved');
    }
    onRefresh();
  };

  const handleRating = () => {
    if (rating < 1 || !complaint.assignedWardenId) return;
    addWardenRating({ id: uuid(), complaintId, wardenId: complaint.assignedWardenId, studentId: user.id, stars: rating, createdAt: new Date().toISOString() });
    setRatingSubmitted(true);
    showToast('success', 'Rating submitted!');
    onRefresh();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-[var(--stone-600)] hover:text-[var(--stone-900)] mb-4 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Promoted Banner */}
      {complaint.promotedAt && (
        <div className="bg-[var(--accent-50)] border border-[var(--accent-200)] rounded-xl p-4 mb-4 flex items-center gap-3">
          <Zap className="w-5 h-5 text-[var(--accent-700)] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--accent-800)]">Promoted to Emergency</p>
            <p className="text-xs text-[var(--accent-700)]">This complaint was promoted after receiving {POLICY.promotionThreshold} upvotes. New deadline: 24 hours from promotion.</p>
          </div>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        {/* Header */}
        <div className={`p-5 sm:p-6 ${complaint.priority === Priority.EMERGENCY ? 'bg-red-50 border-b border-red-200' : 'bg-[var(--stone-50)] border-b border-[var(--stone-200)]'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <PriorityBadge priority={complaint.priority} />
                <StatusBadge status={complaint.status} />
                {overdue && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue</Badge>}
              </div>
              <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading">{complaint.title}</h2>
              <p className="text-xs text-[var(--stone-500)] mt-1">{complaint.id} • {complaint.category}</p>
            </div>
            <button
              onClick={handleUpvote}
              disabled={isMyComplaint}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition shrink-0 ${
                isMyComplaint ? 'opacity-50 cursor-not-allowed bg-[var(--stone-100)]' :
                hasVoted ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'bg-[var(--stone-100)] text-[var(--stone-500)] hover:bg-[var(--accent-50)]'
              }`}
              aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
              title={isMyComplaint ? "You can't upvote your own complaint" : undefined}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-bold">{upvotes.length}</span>
              {complaint.priority === Priority.NORMAL && !isMyComplaint && (
                <span className="text-[9px] text-[var(--stone-500)]">{upvotes.length}/{POLICY.promotionThreshold}</span>
              )}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-[var(--stone-700)] mb-2">Description</h3>
            <p className="text-sm text-[var(--stone-800)] leading-relaxed">{complaint.description}</p>
          </div>

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
              <p className="text-xs text-[var(--stone-500)]">Filed by</p>
              <p className="text-sm font-medium">{isMyComplaint ? 'You' : 'Anonymous'}</p>
            </div>
          </div>

          {complaint.resolutionNote && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-800 mb-1">Resolution Note</h3>
              <p className="text-sm text-green-700">{complaint.resolutionNote}</p>
            </div>
          )}

          {/* Resolution Confirmation */}
          {complaint.status === ComplaintStatus.MARKED_RESOLVED && (
            <div className="bg-[var(--accent-50)] border border-[var(--accent-200)] rounded-xl p-4">
              <h3 className="text-sm font-medium text-[var(--accent-800)] mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Confirm Resolution
              </h3>
              {complaint.resolutionNote && (
                <p className="text-sm text-[var(--accent-700)] mb-3 italic">"{complaint.resolutionNote}"</p>
              )}
              <p className="text-sm text-[var(--accent-700)] mb-3">Does this issue appear to be resolved?</p>
              
              {/* Tally */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-600">Solved</p>
                  <p className="text-lg font-bold text-green-700">{solvedVotes}/{POLICY.resolutionVotesRequired}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600">Not Solved</p>
                  <p className="text-lg font-bold text-red-700">{notSolvedVotes}/{POLICY.resolutionVotesRequired}</p>
                </div>
              </div>
              
              {/* Window countdown */}
              {complaint.confirmationWindowEnd && (
                <div className="flex items-center gap-2 text-sm text-[var(--accent-700)] mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Window closes: <Countdown deadlineAt={complaint.confirmationWindowEnd} /></span>
                </div>
              )}
              
              {/* Vote buttons */}
              {!hasResolutionVoted ? (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResolutionVote(VoteType.SOLVED)} icon={<ThumbsUp className="w-4 h-4" />}>Yes, fixed</Button>
                  <Button size="sm" variant="danger" onClick={() => handleResolutionVote(VoteType.NOT_SOLVED)} icon={<ThumbsDown className="w-4 h-4" />}>No, still a problem</Button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-[var(--accent-200)]">
                  <p className="text-sm text-[var(--accent-700)] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Your vote: {resVotes.find(v => v.userId === user.id)?.voteType === VoteType.SOLVED ? '✅ Yes, fixed' : '❌ No, still a problem'}
                  </p>
                  {complaint.confirmationWindowEnd && new Date(complaint.confirmationWindowEnd) > new Date() && (
                    <p className="text-xs text-[var(--stone-500)] mt-1">You can change your vote while the window is open.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          {canRate && !ratingSubmitted && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" /> Rate the Warden
              </h3>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && <Button size="sm" onClick={handleRating}>Submit</Button>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-medium text-[var(--stone-700)] mb-3">Timeline</h3>
            <div className="space-y-0">
              {/* Created */}
              <TimelineItem icon={<FileText className="w-4 h-4" />} title="Complaint Submitted" time={complaint.createdAt} color="blue" />
              
              {/* Promoted */}
              {complaint.promotedAt && (
                <TimelineItem icon={<Zap className="w-4 h-4" />} title="Promoted to Emergency" subtitle={`Reached ${POLICY.promotionThreshold} upvotes`} time={complaint.promotedAt} color="amber" />
              )}
              
              {/* Audit events */}
              {auditEvents.filter(e => e.action === 'STATUS_CHANGED').map(event => (
                <TimelineItem
                  key={event.id}
                  icon={<CheckCircle className="w-4 h-4" />}
                  title={`Status → ${String(event.after?.status || '').replace(/_/g, ' ')}`}
                  time={event.createdAt}
                  color="green"
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TimelineItem({ icon, title, subtitle, time, color }: { icon: React.ReactNode; title: string; subtitle?: string; time: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    stone: 'bg-[var(--stone-100)] text-[var(--stone-600)] border-[var(--stone-200)]',
  };
  return (
    <div className="flex gap-3 pb-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${colors[color] || colors.stone}`}>
          {icon}
        </div>
        <div className="w-px flex-1 bg-[var(--stone-200)] mt-1" />
      </div>
      <div className="pb-2">
        <p className="text-sm font-medium text-[var(--stone-800)]">{title}</p>
        {subtitle && <p className="text-xs text-[var(--stone-500)]">{subtitle}</p>}
        <p className="text-xs text-[var(--stone-400)] mt-0.5">{new Date(time).toLocaleString()}</p>
      </div>
    </div>
  );
}

// ─── History View ──────────────────────────────────────────────────────────────
function HistoryView({ complaints, onOpenDetail }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-4">My Complaints</h2>
      {complaints.length === 0 ? (
        <EmptyState icon={<FileText className="w-8 h-8" />} title="No complaints yet" description="File your first complaint from the Feed tab." />
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => (
            <Card key={c.id} hover onClick={() => onOpenDetail(c.id)}>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <PriorityBadge priority={c.priority} />
                <StatusBadge status={c.status} />
              </div>
              <h3 className="font-semibold text-[var(--stone-900)] text-sm">{c.title}</h3>
              <p className="text-xs text-[var(--stone-500)] mt-1">{new Date(c.createdAt).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Notifications View ────────────────────────────────────────────────────────
function NotificationsView({ userId, onRefresh }: any) {
  const notifications = getNotificationsForUser(userId);
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-4">Notifications</h2>
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

// ─── Complaint Card ────────────────────────────────────────────────────────────
function ComplaintCard({ complaint, upvoteCount, hasVoted, overdue, isMine, onUpvote, onClick }: any) {
  const c = complaint as Complaint;
  const categoryIcons: Record<Category, React.ReactNode> = {
    [Category.PLUMBING]: <span className="text-lg">🔧</span>,
    [Category.ELECTRICAL]: <span className="text-lg">⚡</span>,
    [Category.CLEANLINESS]: <span className="text-lg">🧹</span>,
    [Category.FURNITURE]: <span className="text-lg">🪑</span>,
    [Category.INTERNET]: <span className="text-lg">📶</span>,
    [Category.OTHER]: <span className="text-lg">📋</span>,
  };

  return (
    <Card hover onClick={onClick} className={overdue ? 'border-red-200 bg-red-50/30' : ''}>
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div className="w-10 h-10 bg-[var(--stone-100)] rounded-lg flex items-center justify-center shrink-0">
          {categoryIcons[c.category]}
        </div>

        {/* Upvote Button */}
        <button
          onClick={onUpvote}
          disabled={isMine}
          className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition shrink-0 ${
            isMine ? 'opacity-50 cursor-not-allowed' :
            hasVoted ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'bg-[var(--stone-100)] text-[var(--stone-500)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]'
          }`}
          aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
          title={isMine ? "You can't upvote your own complaint" : hasVoted ? 'Remove upvote' : 'Upvote'}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="text-xs font-bold">{upvoteCount}</span>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <PriorityBadge priority={c.priority} />
            <StatusBadge status={c.status} />
            {overdue && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue</Badge>}
            {c.promotedAt && <Badge variant="accent" icon={<Zap className="w-3 h-3" />}>Promoted</Badge>}
          </div>
          <h3 className="font-semibold text-[var(--stone-900)] text-sm line-clamp-1">{c.title}</h3>
          <p className="text-xs text-[var(--stone-500)] mt-0.5 line-clamp-2">{c.description}</p>
          
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--stone-500)]">
            <Countdown deadlineAt={c.deadlineAt} compact />
            <span>{c.category}</span>
            {c.priority === Priority.NORMAL && upvoteCount > 0 && (
              <span className="text-[var(--accent-700)] font-medium">
                {upvoteCount} of {POLICY.promotionThreshold} to escalate
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
