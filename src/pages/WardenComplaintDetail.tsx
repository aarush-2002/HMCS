import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { WardenShell } from '../components/WardenShell';
import { CalmBackground } from '../components/CalmBackground';
import { PriorityBadge, StatusBadge, Countdown, Textarea, Select, Button } from '../components/ui';
import { getStore, getUpvotesForComplaint, getResolutionVotesForComplaint, updateComplaintStatus, getAuditForComplaint } from '../store/data';
import { Complaint, ComplaintStatus, VoteType } from '../shared/types';
import { POLICY } from '../shared/policy';

export default function WardenComplaintDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wardenId = 'warden-1';

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<ComplaintStatus | ''>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

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
        <WardenShell>
          <div className="relative z-10 animate-pulse">
            <div className="h-8 bg-line rounded w-1/3 mb-4" />
            <div className="h-64 bg-ink-2/50 border border-line rounded-xl" />
          </div>
        </WardenShell>
      </>
    );
  }

  if (!complaint) {
    return (
      <>
        <CalmBackground />
        <WardenShell>
          <div className="relative z-10 text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl text-bone mb-2">Complaint not found</h2>
            <p className="text-bone-dim mb-6">This complaint may have been removed or doesn't exist.</p>
            <Button variant="primary" onClick={() => navigate('/warden')}>
              Back to Queue
            </Button>
          </div>
        </WardenShell>
      </>
    );
  }

  const upvotes = getUpvotesForComplaint(complaint.id);
  const upvoteCount = upvotes.length;
  const resVotes = getResolutionVotesForComplaint(complaint.id, complaint.resolutionRound);
  const solvedVotes = resVotes.filter(v => v.voteType === VoteType.SOLVED).length;
  const notSolvedVotes = resVotes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
  const auditEvents = getAuditForComplaint(complaint.id);

  // Valid next statuses
  const validNextStatuses: ComplaintStatus[] = [];
  if (complaint.status === ComplaintStatus.SUBMITTED) {
    validNextStatuses.push(ComplaintStatus.ACKNOWLEDGED);
  } else if (complaint.status === ComplaintStatus.ACKNOWLEDGED) {
    validNextStatuses.push(ComplaintStatus.IN_PROGRESS);
  } else if (complaint.status === ComplaintStatus.IN_PROGRESS) {
    validNextStatuses.push(ComplaintStatus.MARKED_RESOLVED);
  }

  const handleStatusChange = () => {
    if (!newStatus) return;
    if (newStatus === ComplaintStatus.MARKED_RESOLVED && !resolutionNote) {
      alert('Resolution note is required when marking as resolved');
      return;
    }

    updateComplaintStatus(complaint.id, newStatus, wardenId, resolutionNote || undefined);
    setComplaint({ ...complaint, status: newStatus, resolutionNote: resolutionNote || complaint.resolutionNote });
    setNewStatus('');
    setResolutionNote('');
    setShowConfirm(false);
  };

  return (
    <>
      <CalmBackground />
      <WardenShell>
        <div className="relative z-10">
          {/* Back button */}
          <button
            onClick={() => navigate('/warden')}
            className="flex items-center gap-2 text-bone-dim hover:text-bone transition-colors mb-6"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Back to Queue</span>
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

              {/* Resolution Note */}
              {complaint.resolutionNote && (
                <div className="bg-resolved/10 border border-resolved/30 rounded-xl p-6">
                  <h3 className="text-sm text-resolved uppercase tracking-wider mb-2">Resolution Note</h3>
                  <p className="text-bone">{complaint.resolutionNote}</p>
                </div>
              )}

              {/* Student Confirmation */}
              {complaint.status === ComplaintStatus.MARKED_RESOLVED && (
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Student Confirmation</h3>
                  
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

                  {complaint.confirmationWindowEnd && (
                    <div className="text-center">
                      <p className="text-xs text-muted">
                        Window closes: <Countdown deadlineAt={complaint.confirmationWindowEnd} />
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Actions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Deadline */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Deadline</h3>
                <Countdown deadlineAt={complaint.deadlineAt} />
                <p className="text-xs text-muted mt-2">
                  {new Date(complaint.deadlineAt).toLocaleString()}
                </p>
              </div>

              {/* Upvotes */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Student Support</h3>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-ember" />
                  <span className="text-2xl font-light text-bone tabular">{upvoteCount}</span>
                  <span className="text-sm text-muted">upvotes</span>
                </div>
              </div>

              {/* Status Panel */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Update Status</h3>
                
                {validNextStatuses.length > 0 ? (
                  <div className="space-y-4">
                    <Select
                      label="Next Status"
                      value={newStatus}
                      onChange={(v) => {
                        setNewStatus(v as ComplaintStatus);
                        if (v === ComplaintStatus.MARKED_RESOLVED) {
                          setShowConfirm(true);
                        } else {
                          setShowConfirm(false);
                        }
                      }}
                      options={[
                        { value: '', label: 'Select status...' },
                        ...validNextStatuses.map(s => ({
                          value: s,
                          label: s.replace(/_/g, ' '),
                        })),
                      ]}
                    />

                    {showConfirm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4"
                      >
                        <Textarea
                          label="Resolution Note (required)"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Describe what was done to resolve this issue..."
                          rows={4}
                          required
                        />

                        <div className="p-4 bg-ember/10 border border-ember/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-ember shrink-0 mt-0.5" />
                            <p className="text-xs text-bone-dim">
                              Marking this as resolved will start a 24-hour student confirmation window. Students will be notified and can confirm or dispute the resolution.
                            </p>
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={handleStatusChange}
                          disabled={!resolutionNote}
                        >
                          Confirm & Update
                        </Button>
                      </motion.div>
                    )}

                    {!showConfirm && newStatus && (
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={handleStatusChange}
                      >
                        Update Status
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted">
                      No further status changes available
                    </p>
                  </div>
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
                        {event.action.includes('RESOLVED') && <CheckCircle className="w-4 h-4 text-resolved" />}
                        {event.action.includes('PROMOTED') && <AlertTriangle className="w-4 h-4 text-emergency" />}
                        {event.action.includes('REOPENED') && <AlertTriangle className="w-4 h-4 text-emergency" />}
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
            </div>
          </div>
        </div>
      </WardenShell>
    </>
  );
}
