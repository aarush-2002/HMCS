import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { WardenShell } from '../components/WardenShell';
import { CalmBackground } from '../components/CalmBackground';
import { Row, PriorityBadge, StatusBadge } from '../components/ui';
import { getStore } from '../store/data';
import { Complaint, ComplaintStatus } from '../shared/types';

export default function WardenOverdue() {
  const wardenId = 'warden-1';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const store = getStore();
    const now = new Date();
    
    const overdueComplaints = store.complaints.filter(c => {
      if (c.assignedWardenId !== wardenId) return false;
      if (c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED) return false;
      
      const deadline = new Date(c.deadlineAt);
      return now > deadline;
    });

    // Sort by how late (most late first)
    overdueComplaints.sort((a, b) => {
      const aLate = now.getTime() - new Date(a.deadlineAt).getTime();
      const bLate = now.getTime() - new Date(b.deadlineAt).getTime();
      return bLate - aLate;
    });

    setComplaints(overdueComplaints);
    setLoading(false);
  }, []);

  const formatLateDuration = (deadlineAt: string): string => {
    const now = new Date();
    const deadline = new Date(deadlineAt);
    const diffMs = now.getTime() - deadline.getTime();
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  return (
    <>
      <CalmBackground />
      <WardenShell wardenName="Mr. Sharma">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Overdue</div>
            <h1 className="display display-lg mb-6">Past deadline</h1>
            <p className="text-bone-dim">
              These complaints have exceeded their deadline. Address them as soon as possible.
            </p>
          </div>

          {loading ? (
            // Skeleton
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-20 bg-line rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-line rounded w-3/4" />
                      <div className="h-3 bg-line rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : complaints.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-resolved/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-resolved" />
              </div>
              <h3 className="text-xl text-bone mb-2">No overdue complaints</h3>
              <p className="text-bone-dim">
                Great job! All your complaints are within their deadlines.
              </p>
            </div>
          ) : (
            // Overdue list
            <div className="space-y-3">
              {complaints.map((complaint, idx) => {
                const lateDuration = formatLateDuration(complaint.deadlineAt);

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-ink-2/50 border border-emergency/30 rounded-xl p-6 hover:bg-ink-2/70 transition-all"
                  >
                    {/* Red edge */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emergency rounded-l-xl" />

                    <Link to={`/warden/complaint/${complaint.id}`} className="block">
                      <div className="flex items-start gap-4">
                        {/* Late Duration */}
                        <div className="w-24 shrink-0 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <AlertTriangle className="w-4 h-4 text-emergency" />
                          </div>
                          <p className="text-3xl font-light text-emergency tabular">
                            {lateDuration}
                          </p>
                          <p className="text-xs text-muted">late</p>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-bone group-hover:text-ember transition-colors line-clamp-1">
                              {complaint.title}
                            </h3>
                          </div>

                          <p className="text-sm text-bone-dim line-clamp-2 mb-3">
                            {complaint.description}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-muted">
                            <span className="px-2 py-1 bg-line/30 rounded">{complaint.category}</span>
                            <span>Submitted {new Date(complaint.createdAt).toLocaleDateString()}</span>
                            <span>Deadline was {new Date(complaint.deadlineAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Right column */}
                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <PriorityBadge priority={complaint.priority} />
                          <StatusBadge status={complaint.status} />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </WardenShell>
    </>
  );
}
