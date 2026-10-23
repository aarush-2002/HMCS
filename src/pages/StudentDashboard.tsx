import React, { useState, useMemo, lazy, Suspense } from 'react';
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
} from '../store/data';
import {
  Button, Card, Badge, StatusBadge, PriorityBadge, Tabs, Input, Textarea,
  Select, FileDropzone, EmptyState, Countdown, StarRating, Skeleton, showToast,
} from '../components/ui';
import { v4 as uuid } from 'uuid';
import {
  Plus, AlertTriangle, ThumbsUp, CheckCircle, XCircle, Star, Bell,
  Clock, LogOut, Building2, Search, Send, ArrowLeft, Home, FileText,
  User, ChevronRight, Shield, Info, Camera,
} from 'lucide-react';

type View = 'feed' | 'new' | 'detail' | 'history' | 'notifications';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<View>('feed');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [, setRefresh] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');

  if (!user) return null;
  const store = getStore();
  const forceRefresh = () => setRefresh(r => r + 1);

  const activeComplaints = useMemo(() => {
    let list = store.complaints.filter(c => c.hostelId === user.hostelId && c.isActive);
    if (filterStatus !== 'ALL') list = list.filter(c => c.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (a.priority === Priority.EMERGENCY && b.priority !== Priority.EMERGENCY) return -1;
      if (b.priority === Priority.EMERGENCY && a.priority !== Priority.EMERGENCY) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [store.complaints, filterStatus, searchQuery, user.hostelId]);

  const myComplaints = store.complaints.filter(c => c.submitterId === user.id);
  const unreadNotifications = getNotificationsForUser(user.id).filter(n => !n.read);

  const openDetail = (id: string) => {
    setSelectedComplaint(id);
    setView('detail');
  };

  const tabs = [
    { key: 'feed', label: 'Feed', icon: <Home className="w-5 h-5" /> },
    { key: 'new', label: 'New', icon: <Plus className="w-5 h-5" /> },
    { key: 'history', label: 'Mine', icon: <FileText className="w-5 h-5" /> },
    { key: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, count: unreadNotifications.length },
  ];

  return (
    <div className="min-h-screen bg-[var(--stone-50)] pb-20 md:pb-0">
      {/* Top Bar */}
      <header className="bg-white border-b border-[var(--stone-200)] sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
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
        <div className="max-w-5xl mx-auto px-4">
          <Tabs
            tabs={tabs}
            activeTab={view === 'detail' ? 'feed' : view}
            onChange={(key) => setView(key as View)}
          />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {view === 'feed' && (
          <FeedView
            complaints={activeComplaints}
            user={user}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
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
function FeedView({ complaints, user, searchQuery, setSearchQuery, filterStatus, setFilterStatus, onOpenDetail, onRefresh }: any) {
  const handleUpvote = (complaintId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const store = getStore();
    const existing = store.upvotes.find(u => u.complaintId === complaintId && u.userId === user.id);
    if (existing) {
      removeUpvote(complaintId, user.id);
    } else {
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
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
          showToast('info', 'Complaint promoted to Emergency!');
        }
      }
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--stone-400)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search complaints..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--stone-300)] focus:border-[var(--accent-600)] focus:ring-2 focus:ring-[var(--accent-100)] outline-none text-sm bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-[var(--stone-300)] text-sm bg-white"
        >
          <option value="ALL">All</option>
          {Object.values(ComplaintStatus).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[var(--stone-200)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--stone-900)] font-heading">{complaints.length}</p>
          <p className="text-xs text-[var(--stone-500)]">Active</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
          <p className="text-xl font-bold text-red-700 font-heading">{complaints.filter((c: Complaint) => c.priority === Priority.EMERGENCY).length}</p>
          <p className="text-xs text-red-600">Emergency</p>
        </div>
        <div className="bg-[var(--accent-50)] rounded-xl border border-[var(--accent-200)] p-3 text-center">
          <p className="text-xl font-bold text-[var(--accent-800)] font-heading">{complaints.filter((c: Complaint) => c.status === ComplaintStatus.MARKED_RESOLVED).length}</p>
          <p className="text-xs text-[var(--accent-700)]">Confirm</p>
        </div>
      </div>

      {/* Complaint List */}
      {complaints.length === 0 ? (
        <EmptyState icon={<Search className="w-8 h-8" />} title="No complaints found" description="Try adjusting your search or filters." />
      ) : (
        <div className="space-y-3">
          {complaints.map((c: Complaint) => {
            const upvoteCount = getUpvotesForComplaint(c.id).length;
            const hasVoted = getUpvotesForComplaint(c.id).some(u => u.userId === user.id);
            const overdue = isOverdue(c);

            return (
              <Card key={c.id} hover onClick={() => onOpenDetail(c.id)} className={overdue ? 'border-red-200 bg-red-50/30' : ''}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => handleUpvote(c.id, e)}
                    className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition shrink-0 ${
                      hasVoted ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'bg-[var(--stone-100)] text-[var(--stone-500)] hover:bg-[var(--accent-50)] hover:text-[var(--accent-700)]'
                    }`}
                    aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-xs font-bold">{upvoteCount}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                      {overdue && <Badge variant="danger" icon={<AlertTriangle className="w-3 h-3" />}>Overdue</Badge>}
                    </div>
                    <h3 className="font-semibold text-[var(--stone-900)] text-sm line-clamp-1">{c.title}</h3>
                    <p className="text-xs text-[var(--stone-500)] mt-0.5 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--stone-500)]">
                      <Countdown deadlineAt={c.deadlineAt} compact />
                      <span>{c.category}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── New Complaint Form ────────────────────────────────────────────────────────
function NewComplaintForm({ user, onSubmit }: any) {
  const store = getStore();
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

    // Simulate async submission
    setTimeout(() => {
      const now = new Date().toISOString();
      const complaint: Complaint = {
        id: `C-${uuid().slice(0, 8).toUpperCase()}`,
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
              <span className="text-sm font-mono font-medium text-[var(--stone-900)]">{submitted.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--stone-500)]">Priority</span>
              <PriorityBadge priority={submitted.priority} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--stone-500)]">Deadline</span>
              <span className="text-sm font-medium text-[var(--stone-900)]">{new Date(submitted.deadlineAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--stone-500)]">Time Remaining</span>
              <Countdown deadlineAt={submitted.deadlineAt} />
            </div>
          </div>
          <Button onClick={onSubmit} className="w-full mt-6">
            Back to Feed
          </Button>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const normalResetTime = new Date(now);
  normalResetTime.setDate(normalResetTime.getDate() + 1);
  normalResetTime.setHours(0, 0, 0, 0);
  const weekResetTime = new Date(now);
  weekResetTime.setDate(now.getDate() + (7 - now.getDay()));
  weekResetTime.setHours(0, 0, 0, 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Quota Banner */}
      <div className="bg-white rounded-xl border border-[var(--stone-200)] p-4 mb-6">
        <h3 className="text-sm font-semibold text-[var(--stone-800)] mb-3">Your Allowance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg p-3 border ${canSubmitNormal ? 'bg-[var(--accent-50)] border-[var(--accent-200)]' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-[var(--stone-600)]">Normal (per day)</p>
            <p className={`text-lg font-bold font-heading ${canSubmitNormal ? 'text-[var(--accent-800)]' : 'text-red-700'}`}>
              {POLICY.normalComplaintsPerDay - normalUsedToday}/{POLICY.normalComplaintsPerDay}
            </p>
            {!canSubmitNormal && (
              <p className="text-xs text-red-600 mt-0.5">Resets {normalResetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            )}
          </div>
          <div className={`rounded-lg p-3 border ${canSubmitEmergency ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <p className="text-xs text-[var(--stone-600)]">Emergency (per week)</p>
            <p className={`text-lg font-bold font-heading ${canSubmitEmergency ? 'text-amber-800' : 'text-red-700'}`}>
              {POLICY.emergencyComplaintsPerWeek - emergencyUsedWeek}/{POLICY.emergencyComplaintsPerWeek}
            </p>
            {!canSubmitEmergency && (
              <p className="text-xs text-red-600 mt-0.5">Resets {weekResetTime.toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <h2 className="text-xl font-bold text-[var(--stone-900)] font-heading mb-1">File a Complaint</h2>
        <p className="text-sm text-[var(--stone-500)] mb-6">Describe the issue clearly for faster resolution.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Brief summary of the issue"
            error={errors.title}
            maxLength={120}
            required
          />

          <Textarea
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the problem in detail. Include location, when it started, and any relevant context."
            error={errors.description}
            showCount
            maxLength={2000}
            rows={5}
            required
          />

          <Select
            label="Category"
            value={category}
            onChange={v => setCategory(v as Category)}
            options={Object.values(Category).map(c => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }))}
          />

          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--stone-700)]">Priority</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriority(Priority.NORMAL)}
                disabled={!canSubmitNormal}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  priority === Priority.NORMAL
                    ? 'border-[var(--accent-600)] bg-[var(--accent-50)]'
                    : 'border-[var(--stone-200)] hover:border-[var(--stone-300)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-[var(--stone-600)]" />
                  <span className="text-sm font-semibold text-[var(--stone-800)]">Normal</span>
                </div>
                <p className="text-xs text-[var(--stone-500)]">{POLICY.normalDeadlineHours}h deadline</p>
                {!canSubmitNormal && <p className="text-xs text-red-600 mt-1">Limit reached</p>}
              </button>
              <button
                type="button"
                onClick={() => canSubmitEmergency && setPriority(Priority.EMERGENCY)}
                disabled={!canSubmitEmergency}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  priority === Priority.EMERGENCY
                    ? 'border-red-500 bg-red-50'
                    : 'border-[var(--stone-200)] hover:border-[var(--stone-300)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-[var(--stone-800)]">Emergency</span>
                </div>
                <p className="text-xs text-[var(--stone-500)]">{POLICY.emergencyDeadlineHours}h deadline</p>
                {!canSubmitEmergency && <p className="text-xs text-red-600 mt-1">Limit reached</p>}
              </button>
            </div>
            {priority === Priority.EMERGENCY && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <strong>Emergency criteria:</strong> Safety hazards, flooding, electrical dangers, or issues that make the room uninhabitable. Misuse may result in review.
                </p>
              </div>
            )}
            {errors.priority && (
              <p className="text-sm text-red-700 flex items-center gap-1" role="alert">
                <AlertTriangle className="w-3.5 h-3.5" />
                {errors.priority}
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <FileDropzone
            label="Photos (optional)"
            files={photos}
            onFilesChange={setPhotos}
            maxFiles={4}
            maxSizeMB={5}
          />

          {/* Privacy Note */}
          <div className="bg-[var(--stone-50)] border border-[var(--stone-200)] rounded-lg p-3 flex gap-2">
            <Shield className="w-4 h-4 text-[var(--stone-500)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--stone-600)]">
              <strong>Privacy:</strong> Avoid including faces or personal information in photos. Your identity is hidden from other students.
            </p>
          </div>

          <Button type="submit" className="w-full" loading={submitting} icon={<Send className="w-4 h-4" />} size="lg">
            Submit Complaint
          </Button>
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
  const hasResolutionVoted = resVotes.some(v => v.userId === user.id);
  const auditEvents = getAuditForComplaint(complaintId);
  const isMyComplaint = complaint?.submitterId === user.id;
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (!complaint) return <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title="Complaint not found" />;

  const overdue = isOverdue(complaint);
  const canRate = isMyComplaint && complaint.status === ComplaintStatus.RESOLVED && !store.wardenRatings.find(r => r.complaintId === complaintId && r.studentId === user.id);

  const handleUpvote = () => {
    if (hasVoted) {
      removeUpvote(complaintId, user.id);
    } else {
      addUpvote({ id: uuid(), complaintId, userId: user.id, createdAt: new Date().toISOString() });
      if (complaint.priority === Priority.NORMAL && upvotes.length + 1 >= POLICY.promotionThreshold) {
        updateComplaint(complaintId, {
          priority: Priority.EMERGENCY,
          promotedAt: new Date().toISOString(),
          deadlineAt: calculateDeadline(Priority.EMERGENCY, new Date().toISOString()),
        });
        showToast('info', 'Complaint promoted to Emergency!');
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
      updateComplaint(complaintId, { status: ComplaintStatus.RESOLVED, resolvedAt: new Date().toISOString(), isActive: false });
      showToast('success', 'Complaint resolved!');
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
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition shrink-0 ${
                hasVoted ? 'bg-[var(--accent-100)] text-[var(--accent-800)]' : 'bg-[var(--stone-100)] text-[var(--stone-500)] hover:bg-[var(--accent-50)]'
              }`}
              aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-sm font-bold">{upvotes.length}</span>
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
              <p className="text-sm font-medium text-[var(--stone-900)]">{new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Deadline</p>
              <p className={`text-sm font-medium ${overdue ? 'text-red-700' : 'text-[var(--stone-900)]'}`}>{new Date(complaint.deadlineAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Remaining</p>
              <Countdown deadlineAt={complaint.deadlineAt} />
            </div>
            <div className="bg-[var(--stone-50)] rounded-lg p-3">
              <p className="text-xs text-[var(--stone-500)]">Filed by</p>
              <p className="text-sm font-medium text-[var(--stone-900)]">{isMyComplaint ? 'You' : 'Anonymous'}</p>
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
                <CheckCircle className="w-4 h-4" />
                Confirm Resolution
              </h3>
              <p className="text-sm text-[var(--accent-700)] mb-3">Does this issue appear to be resolved?</p>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-[var(--accent-700)]">✅ Solved: <strong>{solvedVotes}</strong>/{POLICY.resolutionVotesRequired}</span>
              </div>
              {!hasResolutionVoted && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleResolutionVote(VoteType.SOLVED)} icon={<CheckCircle className="w-4 h-4" />}>Solved</Button>
                  <Button size="sm" variant="danger" onClick={() => handleResolutionVote(VoteType.NOT_SOLVED)} icon={<XCircle className="w-4 h-4" />}>Not Solved</Button>
                </div>
              )}
              {hasResolutionVoted && <p className="text-sm text-[var(--accent-600)] italic">You have already voted.</p>}
            </div>
          )}

          {/* Rating */}
          {canRate && !ratingSubmitted && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Rate the Warden
              </h3>
              <p className="text-sm text-amber-700 mb-3">How was the handling of this complaint?</p>
              <div className="flex items-center gap-3">
                <StarRating value={rating} onChange={setRating} />
                {rating > 0 && <Button size="sm" onClick={handleRating}>Submit</Button>}
              </div>
            </div>
          )}

          {/* Audit */}
          <div>
            <h3 className="text-sm font-medium text-[var(--stone-700)] mb-3">Activity</h3>
            <div className="space-y-2">
              {auditEvents.map(event => (
                <div key={event.id} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-[var(--stone-400)] rounded-full mt-2 shrink-0" />
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
