import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Shell } from '../components/Shell';
import { CalmBackground } from '../components/CalmBackground';
import { PriorityBadge, StatusBadge, Countdown, StarRating, Button } from '../components/ui';
import { getStore, getUpvotesForComplaint, getResolutionVotesForComplaint, addResolutionVote, addWardenRating, getAuditForComplaint } from '../store/data';
import { Complaint, ComplaintStatus, Priority, VoteType } from '../shared/types';
import { POLICY } from '../shared/policy';

export default function ComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const studentId = 'student-1';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const store = getStore();
    const found = store.complaints.find(c => c.id === id);
    setComplaint(found || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <>
        <CalmBackground />
        <Shell>
          <div className="relative z-10 animate-pulse">
            <div className="h-8 bg-line rounded w-1/3 mb-4" />
            <div className="h-64 bg-ink-2/50 border border-line rounded-xl" />
          </div>
        </Shell>
      </>
    );
  }

  if (!complaint) {
    return (
      <>
        <CalmBackground />
        <Shell>
          <div className="relative z-10 text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl text-bone mb-2">Complaint not found</h2>
            <p className="text-bone-dim mb-6">This complaint may have been removed or doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/student')}>
              Back to Feed
            </Button>
          </div>
        </Shell>
      </>
    );
  }

  const upvotes = getUpvotesForComplaint(complaint.id);
  const upvoteCount = upvotes.length;
  const hasVoted = upvotes.some(u => u.userId === studentId);
  const isMyComplaint = complaint.submitterId === studentId;
  const resVotes = getResolutionVotesForComplaint(complaint.id, complaint.resolutionRound);
  const solvedVotes = resVotes.filter(v => v.voteType === VoteType.SOLVED).length;
  const notSolvedVotes = resVotes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
  const hasResolutionVoted = resVotes.some(v => v.userId === studentId);
  const auditEvents = getAuditForComplaint(complaint.id);

  const handleUpvote = () => {
    if (isMyComplaint) return;
    
    const store = getStore();
    const existing = store.upvotes.find(u => u.complaintId === complaint.id && u.userId === studentId);
    
    if (existing) {
      store.upvotes = store.upvotes.filter(u => u.id !== existing.id);
    } else {
      store.upvotes.push({
        id: `upvote-${Date.now()}`,
        complaintId: complaint.id,
        userId: studentId,
        createdAt: new Date().toISOString(),
      });
    }
    
    localStorage.setItem('hmcs-store-v3', JSON.stringify(store));
    setComplaint({ ...complaint });
  };

  const handleResolutionVote = (voteType: VoteType.SOLVED | VoteType.NOT_SOLVED) => {
    addResolutionVote({
      id: `resvote-${Date.now()}`,
      complaintId: complaint.id,
      userId: studentId,
      voteType,
      round: complaint.resolutionRound,
      createdAt: new Date().toISOString(),
    });
    setComplaint({ ...complaint });
  };

  const handleRating = (stars: number) => {
    if (!isMyComplaint || complaint.status !== ComplaintStatus.RESOLVED) return;
    
    addWardenRating({
      id: `rating-${Date.now()}`,
      complaintId: complaint.id,
      wardenId: complaint.assignedWardenId || 'warden-1',
      studentId,
      stars,
      createdAt: new Date().toISOString(),
    });
    setComplaint({ ...complaint });
  };

  return (
    <>
      <CalmBackground />
      <Shell>
        <div className="relative z-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 text-bone-dim hover:text-bone transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Feed</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Description and Photos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <PriorityBadge priority={complaint.priority} />
                  <StatusBadge status={complaint.status} />
                  {complaint.promotedAt && (
                    <span className="px-2 py-0.5 bg-emergency/20 text-emergency text-xs rounded-full border border-emergency/30">
                      Promoted
                    </span>
                  )}
                </div>
                <h1 className="display display-lg mb-4">{complaint.title}</h1>
                <p className="text-bone-dim leading-relaxed">{complaint.description}</p>
              </div>

              {/* Photo Gallery - Placeholder for future implementation */}

              {/* Resolution Note */}
              {complaint.resolutionNote && (
                <div className="bg-resolved/10 border border-resolved/30 rounded-xl p-6">
                  <h3 className="text-sm text-resolved uppercase tracking-wider mb-2">Resolution Note</h3>
                  <p className="text-bone">{complaint.resolutionNote}</p>
                </div>
              )}
            </div>

            {/* Right: Timeline and Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Deadline */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Deadline</h3>
                <Countdown deadlineAt={complaint.deadlineAt} />
                <p className="text-xs text-muted mt-2">
                  {new Date(complaint.deadlineAt).toLocaleString()}
                </p>
              </div>

              {/* Upvote */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Support</h3>
                <button
                  onClick={handleUpvote}
                  disabled={isMyComplaint}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    hasVoted
                      ? 'bg-ember/20 border-ember/30 text-ember'
                      : isMyComplaint
                      ? 'bg-ink border-line text-muted cursor-not-allowed'
                      : 'bg-ink border-line text-bone-dim hover:border-ember hover:text-ember'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="text-lg font-medium tabular">{upvoteCount}</span>
                  {complaint.priority === Priority.NORMAL && (
                    <span className="text-sm text-muted">
                      of {POLICY.promotionThreshold}
                    </span>
                  )}
                </button>
                {isMyComplaint && (
                  <p className="text-xs text-muted mt-2 text-center">
                    You can't upvote your own complaint
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Timeline</h3>
                <div className="space-y-4">
                  {auditEvents.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center shrink-0">
                        {event.action.includes('SUBMITTED') && <span className="text-ember text-xs">1</span>}
                        {event.action.includes('ACKNOWLEDGED') && <span className="text-ember text-xs">2</span>}
                        {event.action.includes('IN_PROGRESS') && <span className="text-ember text-xs">3</span>}
                        {event.action.includes('MARKED_RESOLVED') && <span className="text-ember text-xs">4</span>}
                        {event.action.includes('RESOLVED') && <span className="text-ember text-xs">✓</span>}
                        {event.action.includes('PROMOTED') && <AlertTriangle className="w-4 h-4 text-emergency" />}
                        {event.action.includes('REOPENED') && <XCircle className="w-4 h-4 text-emergency" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-bone">{event.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Confirmation Card */}
              {complaint.status === ComplaintStatus.MARKED_RESOLVED && (
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Confirm Resolution</h3>
                  
                  {/* Vote Progress */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-light text-resolved tabular">{solvedVotes}</p>
                      <p className="text-xs text-bone-dim">Fixed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-light text-emergency tabular">{notSolvedVotes}</p>
                      <p className="text-xs text-bone-dim">Not Fixed</p>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-xs text-muted">
                      {solvedVotes} of {POLICY.resolutionVotesRequired} needed to confirm
                    </p>
                  </div>

                  {/* Vote Buttons */}
                  {!hasResolutionVoted ? (
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => handleResolutionVote(VoteType.SOLVED)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Yes, it's fixed
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => handleResolutionVote(VoteType.NOT_SOLVED)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        No, still a problem
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-ink border border-line rounded-lg">
                      <p className="text-sm text-bone-dim">
                        You voted: {resVotes.find(v => v.userId === studentId)?.voteType === VoteType.SOLVED ? '✓ Fixed' : '✗ Not Fixed'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Rating Card */}
              {complaint.status === ComplaintStatus.RESOLVED && isMyComplaint && (
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Rate the Service</h3>
                  <div className="text-center">
                    <StarRating
                      value={0}
                      onChange={handleRating}
                      max={3}
                    />
                    <p className="text-xs text-muted mt-2">
                      How was the resolution?
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}
