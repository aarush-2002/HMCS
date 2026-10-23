import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Complaint, ComplaintStatus, Priority, Category, VoteType,
  getStatusColor, getPriorityColor, getTimeRemaining, isOverdue, calculateDeadline,
} from '../shared/types';
import { POLICY } from '../shared/policy';
import {
  getStore, addComplaint, updateComplaint, addUpvote, removeUpvote,
  addResolutionVote, addWardenRating, addNotification, addAuditEvent,
  getUpvotesForComplaint, getResolutionVotesForComplaint, getUserById,
  getStudentComplaintsToday, getStudentEmergencyThisWeek,
  getNotificationsForUser, markNotificationRead, getRatingsForWarden,
  getAuditForComplaint,
} from '../store/data';
import { v4 as uuid } from 'uuid';
import {
  Plus, AlertTriangle, ThumbsUp, CheckCircle, XCircle, Star, Bell,
  Filter, Clock, ChevronDown, ChevronUp, LogOut, Building2, Search,
  Image, Send, ArrowLeft, RefreshCw,
} from 'lucide-react';

type View = 'feed' | 'new' | 'detail' | 'history' | 'notifications';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('feed');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [, setRefresh] = useState(0);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  if (!user) return null;
  const store = getStore();
  const forceRefresh = () => setRefresh(r => r + 1);

  // Complaint feed
  const activeComplaints = useMemo(() => {
    let list = store.complaints.filter(c => c.hostelId === user.hostelId && c.isActive);
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus);
    if (filterPriority !== 'ALL') list = list.filter(c => c.priority === filterPriority);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (a.priority === Priority.EMERGENCY && b.priority !== Priority.EMERGENCY) return -1;
      if (b.priority === Priority.EMERGENCY && a.priority !== Priority.EMERGENCY) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [store.complaints, filterStatus, filterPriority, searchQuery, user.hostelId]);

  const myComplaints = store.complaints.filter(c => c.submitterId === user.id);
  const normalUsedToday = getStudentComplaintsToday(user.id);
  const emergencyUsedWeek = getStudentEmergencyThisWeek(user.id);
  const unreadNotifications = getNotificationsForUser(user.id).filter(n => !n.read);

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
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">HMCS</h1>
              <p className="text-xs text-slate-500">{user.name} • {store.hostel.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('notifications')}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-slate-100 transition" title="Logout">
              <LogOut className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { key: 'feed', label: 'Complaints', icon: Search },
            { key: 'new', label: 'New Complaint', icon: Plus },
            { key: 'history', label: 'My Complaints', icon: Clock },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as View)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                view === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'feed' && (
          <FeedView
            complaints={activeComplaints}
            user={user}
            filterStatus={filterStatus}
            filterPriority={filterPriority}
            setFilterStatus={setFilterStatus}
            setFilterPriority={setFilterPriority}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onOpenDetail={openDetail}
            onRefresh={forceRefresh}
          />
        )}
        {view === 'new' && (
          <NewComplaintForm
            user={user}
            normalUsedToday={normalUsedToday}
            emergencyUsedWeek={emergencyUsedWeek}
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
    </div>
  );
}

// Feed View
function FeedView({ complaints, user, filterStatus, filterPriority, setFilterStatus, setFilterPriority, searchQuery, setSearchQuery, showFilters, setShowFilters, onOpenDetail, onRefresh }: any) {
  const handleUpvote = (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const store = getStore();
    const existing = store.upvotes.find(u => u.complaintId === complaintId && u.userId === user.id);
    if (existing) {
      removeUpvote(complaintId, user.id);
    } else {
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
      // Check promotion
      const complaint = store.complaints.find(c => c.id === complaintId);
      if (complaint && complaint.priority === Priority.NORMAL) {
        const votes = getUpvotesForComplaint(complaintId);
        if (votes.length + 1 >= POLICY.promotionThreshold) {
          updateComplaint(complaintId, {
            priority: Priority.EMERGENCY,
            promotedAt: new Date().toISOString(),
            deadlineAt: calculateDeadline(Priority.EMERGENCY, new Date().toISOString()),
          });
          addAuditEvent({
            id: uuid(), actorId: 'system', action: 'PROMOTED_TO_EMERGENCY',
            entityType: 'Complaint', entityId: complaintId,
            before: { priority: 'NORMAL' }, after: { priority: 'EMERGENCY' },
            createdAt: new Date().toISOString(),
          });
          addNotification({
            id: uuid(), userId: complaint.submitterId,
            message: `Your complaint "${complaint.title}" has been promoted to EMERGENCY!`,
            read: false, createdAt: new Date().toISOString(),
          });
        }
      }
    }
    onRefresh();
  };

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
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm text-slate-700 transition"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4 p-4 bg-white rounded-xl border border-slate-200">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(ComplaintStatus).map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          >
            <option value="ALL">All Priorities</option>
            <option value={Priority.NORMAL}>Normal</option>
            <option value={Priority.EMERGENCY}>Emergency</option>
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-slate-200">
          <p className="text-2xl font-bold text-slate-900">{complaints.length}</p>
          <p className="text-xs text-slate-500">Active</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <p className="text-2xl font-bold text-red-700">{complaints.filter((c: Complaint) => c.priority === Priority.EMERGENCY).length}</p>
          <p className="text-xs text-red-600">Emergency</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">{complaints.filter((c: Complaint) => isOverdue(c)).length}</p>
          <p className="text-xs text-orange-600">Overdue</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 border border-green-200">
          <p className="text-2xl font-bold text-green-700">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.MARKED_RESOLVED).length}</p>
          <p className="text-xs text-green-600">Awaiting Confirm</p>
        </div>
      </div>

      {/* Complaint List */}
      <div className="space-y-3">
        {complaints.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No complaints match your filters.</p>
          </div>
        )}
        {complaints.map((c: Complaint) => {
          const upvoteCount = getUpvotesForComplaint(c.id).length;
          const hasVoted = getUpvotesForComplaint(c.id).some(u => u.userId === user.id);
          const overdue = isOverdue(c);

          return (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${
                overdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Upvote button */}
                <button
                  onClick={(e) => handleUpvote(c.id, e)}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition ${
                    hasVoted ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold">{upvoteCount}</span>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)}`}>
                      {c.priority === Priority.EMERGENCY && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                      {c.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{c.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm truncate">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {overdue ? <span className="text-red-600 font-medium">OVERDUE</span> : getTimeRemaining(c.deadlineAt)}
                    </span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// New Complaint Form
function NewComplaintForm({ user, normalUsedToday, emergencyUsedWeek, onSubmit }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);

  const canSubmitNormal = normalUsedToday < POLICY.normalComplaintsPerDay;
  const canSubmitEmergency = emergencyUsedWeek < POLICY.emergencyComplaintsPerWeek;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const complaint: Complaint = {
      id: uuid(),
      title,
      description,
      category,
      priority,
      status: ComplaintStatus.SUBMITTED,
      submitterId: user.id,
      hostelId: user.hostelId,
      assignedWardenId: Math.random() > 0.5 ? 'warden-1' : 'warden-2',
      deadlineAt: calculateDeadline(priority, now),
      promotedAt: null,
      markedResolvedAt: null,
      resolvedAt: null,
      resolutionNote: null,
      resolutionRound: 1,
      isActive: true,
      confirmationWindowStart: null,
      createdAt: now,
      updatedAt: now,
    };
    addComplaint(complaint);
    addAuditEvent({
      id: uuid(), actorId: user.id, action: 'COMPLAINT_CREATED',
      entityType: 'Complaint', entityId: complaint.id,
      before: null, after: { status: 'SUBMITTED', priority },
      createdAt: now,
    });
    setSubmitted(complaint);
    onSubmit();
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Complaint Submitted!</h2>
        <p className="text-slate-600 mb-4">Your complaint has been recorded successfully.</p>
        <div className="bg-slate-50 rounded-xl p-4 text-left max-w-sm mx-auto space-y-2">
          <p className="text-sm"><span className="font-medium">ID:</span> {submitted.id}</p>
          <p className="text-sm"><span className="font-medium">Priority:</span> {submitted.priority}</p>
          <p className="text-sm"><span className="font-medium">Deadline:</span> {new Date(submitted.deadlineAt).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">File a New Complaint</h2>
        <p className="text-sm text-slate-500 mb-6">Describe the issue clearly for faster resolution.</p>

        {/* Allowance info */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`rounded-xl p-3 border ${canSubmitNormal ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-medium text-slate-600">Normal (today)</p>
            <p className={`text-lg font-bold ${canSubmitNormal ? 'text-blue-700' : 'text-red-700'}`}>
              {normalUsedToday}/{POLICY.normalComplaintsPerDay}
            </p>
          </div>
          <div className={`rounded-xl p-3 border ${canSubmitEmergency ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs font-medium text-slate-600">Emergency (this week)</p>
            <p className={`text-lg font-bold ${canSubmitEmergency ? 'text-amber-700' : 'text-red-700'}`}>
              {emergencyUsedWeek}/{POLICY.emergencyComplaintsPerWeek}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="Brief summary of the issue"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              rows={4}
              placeholder="Describe the problem in detail. Include location, when it started, and any relevant context."
              required
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                {Object.values(Category).map(c => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority *</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                disabled={!canSubmitEmergency}
              >
                <option value={Priority.NORMAL}>Normal (72h deadline)</option>
                <option value={Priority.EMERGENCY} disabled={!canSubmitEmergency}>
                  Emergency (24h deadline){!canSubmitEmergency ? ' — limit reached' : ''}
                </option>
              </select>
            </div>
          </div>

          {/* Photo placeholder */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Photo (optional)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer">
              <Image className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">Click to upload a photo</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmitNormal && priority === Priority.NORMAL}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
}

// Complaint Detail
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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (!complaint) return <div className="text-center py-12 text-slate-500">Complaint not found.</div>;

  const overdue = isOverdue(complaint);
  const submitterName = getUserById(complaint.submitterId)?.name || 'Unknown';

  const handleUpvote = () => {
    if (hasVoted) {
      removeUpvote(complaintId, user.id);
    } else {
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
      // Check promotion
      if (complaint.priority === Priority.NORMAL && upvotes.length + 1 >= POLICY.promotionThreshold) {
        updateComplaint(complaintId, {
          priority: Priority.EMERGENCY,
          promotedAt: new Date().toISOString(),
          deadlineAt: calculateDeadline(Priority.EMERGENCY, new Date().toISOString()),
        });
        addAuditEvent({
          id: uuid(), actorId: 'system', action: 'PROMOTED_TO_EMERGENCY',
          entityType: 'Complaint', entityId: complaintId,
          before: { priority: 'NORMAL' }, after: { priority: 'EMERGENCY' },
          createdAt: new Date().toISOString(),
        });
      }
    }
    onRefresh();
  };

  const handleResolutionVote = (voteType: VoteType.SOLVED | VoteType.NOT_SOLVED) => {
    addResolutionVote({
      id: uuid(), complaintId, userId: user.id, voteType,
      round: complaint.resolutionRound, createdAt: new Date().toISOString(),
    });

    const newSolved = voteType === VoteType.SOLVED ? solvedVotes + 1 : solvedVotes;
    if (newSolved >= POLICY.resolutionVotesRequired) {
      updateComplaint(complaintId, {
        status: ComplaintStatus.RESOLVED,
        resolvedAt: new Date().toISOString(),
        isActive: false,
      });
      addAuditEvent({
        id: uuid(), actorId: 'system', action: 'RESOLVED_BY_CONFIRMATION',
        entityType: 'Complaint', entityId: complaintId,
        before: { status: 'MARKED_RESOLVED' }, after: { status: 'RESOLVED' },
        createdAt: new Date().toISOString(),
      });
    }
    onRefresh();
  };

  const handleRating = () => {
    if (rating < 1 || rating > 3) return;
    const wardenId = complaint.assignedWardenId;
    if (!wardenId) return;
    addWardenRating({
      id: uuid(), complaintId, wardenId, studentId: user.id,
      stars: rating, createdAt: new Date().toISOString(),
    });
    setRatingSubmitted(true);
    onRefresh();
  };

  const canRate = isMyComplaint && complaint.status === ComplaintStatus.RESOLVED && !store.wardenRatings.find(r => r.complaintId === complaintId && r.studentId === user.id);

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className={`p-6 ${complaint.priority === Priority.EMERGENCY ? 'bg-red-50 border-b border-red-200' : 'bg-slate-50 border-b border-slate-200'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority === Priority.EMERGENCY && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {complaint.priority}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace(/_/g, ' ')}
                </span>
                {overdue && <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">OVERDUE</span>}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{complaint.title}</h2>
              <p className="text-sm text-slate-500 mt-1">ID: {complaint.id} • {complaint.category}</p>
            </div>
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition ${
                hasVoted ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-blue-50'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-bold">{upvotes.length}</span>
              <span className="text-[10px]">upvotes</span>
            </button>
          </div>
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
                {new Date(complaint.deadlineAt).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Time Remaining</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-slate-900'}`}>
                {getTimeRemaining(complaint.deadlineAt)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">Filed by</p>
              <p className="text-sm font-medium text-slate-900">{isMyComplaint ? 'You' : 'Anonymous'}</p>
            </div>
          </div>

          {/* Resolution note */}
          {complaint.resolutionNote && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-green-800 mb-1">Resolution Note</h3>
              <p className="text-sm text-green-700">{complaint.resolutionNote}</p>
              {complaint.markedResolvedAt && (
                <p className="text-xs text-green-600 mt-1">Marked resolved: {new Date(complaint.markedResolvedAt).toLocaleString()}</p>
              )}
            </div>
          )}

          {/* Resolution Confirmation */}
          {complaint.status === ComplaintStatus.MARKED_RESOLVED && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Resolution Confirmation
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                Does this issue appear to be resolved? {POLICY.resolutionVotesRequired} "Solved" votes within 24 hours will close this complaint.
              </p>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-purple-700">
                  ✅ Solved: <strong>{solvedVotes}</strong>/{POLICY.resolutionVotesRequired}
                </span>
                <span className="text-sm text-purple-700">
                  ❌ Not Solved: <strong>{notSolvedVotes}</strong>
                </span>
              </div>
              {complaint.confirmationWindowStart && (
                <p className="text-xs text-purple-600 mb-3">
                  Window: {getTimeRemaining(new Date(new Date(complaint.confirmationWindowStart).getTime() + POLICY.confirmationWindowHours * 3600000).toISOString())} remaining
                </p>
              )}
              {!hasResolutionVoted && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolutionVote(VoteType.SOLVED)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    ✓ Solved
                  </button>
                  <button
                    onClick={() => handleResolutionVote(VoteType.NOT_SOLVED)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    ✗ Not Solved
                  </button>
                </div>
              )}
              {hasResolutionVoted && (
                <p className="text-sm text-purple-600 italic">You have already voted on this resolution.</p>
              )}
            </div>
          )}

          {/* Warden Rating */}
          {canRate && !ratingSubmitted && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Rate the Warden
              </h3>
              <p className="text-sm text-amber-700 mb-3">How would you rate the handling of this complaint?</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map(star => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
                {rating > 0 && (
                  <button
                    onClick={handleRating}
                    className="ml-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
                  >
                    Submit Rating
                  </button>
                )}
              </div>
            </div>
          )}
          {(ratingSubmitted || (!canRate && complaint.status === ComplaintStatus.RESOLVED && isMyComplaint)) && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <Star className="w-4 h-4 fill-current" />
                {ratingSubmitted ? 'Rating submitted! Thank you.' : 'You have already rated this complaint.'}
              </p>
            </div>
          )}

          {/* Audit Trail */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Activity Log</h3>
            <div className="space-y-2">
              {auditEvents.length === 0 && <p className="text-sm text-slate-500">No activity recorded yet.</p>}
              {auditEvents.map(event => (
                <div key={event.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 bg-slate-400 rounded-full mt-1.5 shrink-0" />
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

// History View
function HistoryView({ complaints, onOpenDetail }: any) {
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">My Complaints</h2>
      {complaints.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p>You haven't filed any complaints yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => (
            <div
              key={c.id}
              onClick={() => onOpenDetail(c.id)}
              className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getPriorityColor(c.priority)}`}>
                  {c.priority}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(c.status)}`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">{c.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Notifications View
function NotificationsView({ userId, onRefresh }: any) {
  const notifications = getNotificationsForUser(userId);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    onRefresh();
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-900 mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${
                n.read ? 'border-slate-200' : 'border-blue-200 bg-blue-50/50'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? 'bg-slate-300' : 'bg-blue-500'}`} />
              <div className="flex-1">
                <p className={`text-sm ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button onClick={() => handleMarkRead(n.id)} className="text-xs text-blue-600 hover:text-blue-800">
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
