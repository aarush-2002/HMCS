import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ThumbsUp, AlertTriangle, Clock } from 'lucide-react';
import { Shell } from '../components/Shell';
import { CalmBackground } from '../components/CalmBackground';
import { StatBlock, Row, PriorityBadge, StatusBadge, Countdown, Input, Select } from '../components/ui';
import { getStore, getUpvotesForComplaint, getStudentComplaintsToday, getStudentEmergencyThisWeek } from '../store/data';
import { Complaint, ComplaintStatus, Priority, Category } from '../shared/types';
import { POLICY } from '../shared/policy';

export default function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current student (mock - in real app this comes from auth context)
  const studentId = 'student-1';

  // Filter state from URL
  const statusFilter = searchParams.get('status') || 'ALL';
  const priorityFilter = searchParams.get('priority') || 'ALL';
  const categoryFilter = searchParams.get('category') || 'ALL';
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';

  // Allowance
  const normalUsedToday = getStudentComplaintsToday(studentId);
  const emergencyUsedWeek = getStudentEmergencyThisWeek(studentId);
  const normalRemaining = POLICY.normalComplaintsPerDay - normalUsedToday;
  const emergencyRemaining = POLICY.emergencyComplaintsPerWeek - emergencyUsedWeek;

  // Calculate reset times
  const now = new Date();
  const normalResetTime = new Date(now);
  normalResetTime.setDate(normalResetTime.getDate() + 1);
  normalResetTime.setHours(0, 0, 0, 0);

  const emergencyResetTime = new Date(now);
  emergencyResetTime.setDate(emergencyResetTime.getDate() + (7 - now.getDay()));
  emergencyResetTime.setHours(0, 0, 0, 0);

  useEffect(() => {
    // Load complaints
    const store = getStore();
    let filtered = store.complaints.filter(c => c.hostelId === 'hostel-1' && c.isActive);

    // Apply filters
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(c => c.priority === priorityFilter);
    }
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'upvotes') {
      filtered.sort((a, b) => {
        const aVotes = getUpvotesForComplaint(a.id).length;
        const bVotes = getUpvotesForComplaint(b.id).length;
        return bVotes - aVotes;
      });
    } else if (sortBy === 'deadline') {
      filtered.sort((a, b) => new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime());
    }

    setComplaints(filtered);
    setLoading(false);
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery, sortBy]);

  const handleUpvote = (complaintId: string) => {
    const store = getStore();
    const existing = store.upvotes.find(u => u.complaintId === complaintId && u.userId === studentId);
    
    if (existing) {
      // Remove upvote
      store.upvotes = store.upvotes.filter(u => u.id !== existing.id);
    } else {
      // Add upvote
      store.upvotes.push({
        id: `upvote-${Date.now()}`,
        complaintId,
        userId: studentId,
        createdAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem('hmcs-store-v3', JSON.stringify(store));
    setComplaints([...complaints]); // Trigger re-render
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'ALL' || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <CalmBackground />
      <Shell unreadCount={3} userName="Student 1">
        <div className="relative z-10 space-y-8">
          {/* Header with Allowance Summary */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Hostel Feed</div>
            <h1 className="display display-lg mb-6">What's happening</h1>

            {/* Allowance Summary */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <StatBlock
                  label="Normal"
                  value={normalRemaining}
                  subtitle={normalRemaining > 0 ? `left today, resets ${normalResetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'limit reached'}
                />
              </div>
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <StatBlock
                  label="Emergency"
                  value={emergencyRemaining}
                  subtitle={emergencyRemaining > 0 ? `left, resets ${emergencyResetTime.toLocaleDateString([], { weekday: 'long' })}` : 'limit reached'}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-bone-dim" />
              <span className="text-sm text-bone-dim uppercase tracking-wider">Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => updateFilter('q', e.target.value)}
                    placeholder="Search complaints..."
                    className="w-full pl-10 pr-4 py-2.5 bg-ink border border-line rounded-lg text-sm text-bone placeholder:text-muted focus:outline-none focus:border-ember transition-colors"
                  />
                </div>
              </div>

              {/* Status */}
              <Select
                label="Status"
                value={statusFilter}
                onChange={(v) => updateFilter('status', v)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: ComplaintStatus.SUBMITTED, label: 'Submitted' },
                  { value: ComplaintStatus.ACKNOWLEDGED, label: 'Acknowledged' },
                  { value: ComplaintStatus.IN_PROGRESS, label: 'In Progress' },
                  { value: ComplaintStatus.MARKED_RESOLVED, label: 'Marked Resolved' },
                ]}
              />

              {/* Priority */}
              <Select
                label="Priority"
                value={priorityFilter}
                onChange={(v) => updateFilter('priority', v)}
                options={[
                  { value: 'ALL', label: 'All Priorities' },
                  { value: Priority.NORMAL, label: 'Normal' },
                  { value: Priority.EMERGENCY, label: 'Emergency' },
                ]}
              />

              {/* Sort */}
              <Select
                label="Sort"
                value={sortBy}
                onChange={(v) => updateFilter('sort', v)}
                options={[
                  { value: 'newest', label: 'Newest' },
                  { value: 'upvotes', label: 'Most Upvoted' },
                  { value: 'deadline', label: 'Deadline' },
                ]}
              />
            </div>
          </div>

          {/* Complaint List */}
          <div className="space-y-3">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-line rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-line rounded w-3/4" />
                      <div className="h-3 bg-line rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : complaints.length === 0 ? (
              // Empty state
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl text-bone mb-2">No complaints found</h3>
                <p className="text-bone-dim mb-6">Try adjusting your filters or search query.</p>
                <Link
                  to="/student/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-ember text-ink rounded-full text-sm font-medium hover:bg-ember/90 transition-colors"
                >
                  File a complaint
                </Link>
              </div>
            ) : (
              // Complaint rows
              complaints.map((complaint, idx) => {
                const upvotes = getUpvotesForComplaint(complaint.id);
                const upvoteCount = upvotes.length;
                const hasVoted = upvotes.some(u => u.userId === studentId);
                const isEmergency = complaint.priority === Priority.EMERGENCY;
                const isPromoted = complaint.promotedAt !== null;

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative bg-ink-2/50 border rounded-xl p-6 hover:bg-ink-2/70 transition-all cursor-pointer ${
                      isEmergency ? 'border-emergency/30' : 'border-line'
                    }`}
                  >
                    {/* Emergency edge */}
                    {isEmergency && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-emergency rounded-l-xl" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Number */}
                      <div className="text-3xl font-light text-muted tabular w-12 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-bone group-hover:text-ember transition-colors line-clamp-1">
                            {complaint.title}
                          </h3>
                          {isPromoted && (
                            <span className="px-2 py-0.5 bg-emergency/20 text-emergency text-xs rounded-full border border-emergency/30">
                              Promoted
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-bone-dim line-clamp-2 mb-3">
                          {complaint.description}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="px-2 py-1 bg-line/30 rounded">{complaint.category}</span>
                          <span>Filed {new Date(complaint.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <PriorityBadge priority={complaint.priority} />
                        <StatusBadge status={complaint.status} />
                        <Countdown deadlineAt={complaint.deadlineAt} compact />

                        {/* Upvote control */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(complaint.id);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                            hasVoted
                              ? 'bg-ember/20 border-ember/30 text-ember'
                              : 'bg-ink border-line text-bone-dim hover:border-ember hover:text-ember'
                          }`}
                          aria-label={hasVoted ? 'Remove upvote' : 'Upvote'}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span className="text-sm font-medium tabular">{upvoteCount}</span>
                          {complaint.priority === Priority.NORMAL && upvoteCount < POLICY.promotionThreshold && (
                            <span className="text-xs text-muted">
                              of {POLICY.promotionThreshold}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Ember underline on hover */}
                    <div className="absolute bottom-0 left-16 right-6 h-px bg-gradient-to-r from-ember/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </Shell>
    </>
  );
}
