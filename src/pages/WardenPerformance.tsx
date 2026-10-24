import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { WardenShell } from '../components/WardenShell';
import { CalmBackground } from '../components/CalmBackground';
import { StatBlock, Row, PriorityBadge, StatusBadge, Countdown } from '../components/ui';
import { getStore, getRatingsForWarden, getPenaltiesForWarden } from '../store/data';
import { Complaint, ComplaintStatus, Priority } from '../shared/types';

export default function WardenPerformance() {
  const wardenId = 'warden-1';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const store = getStore();
    const wardenComplaints = store.complaints.filter(c => 
      c.hostelId === 'hostel-1' && 
      c.assignedWardenId === wardenId
    );
    setComplaints(wardenComplaints);
    setLoading(false);
  }, []);

  // Calculate metrics
  const ratings = getRatingsForWarden(wardenId);
  const penalties = getPenaltiesForWarden(wardenId);
  
  const resolvedComplaints = complaints.filter(c => 
    c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED
  );
  
  const onTimeComplaints = resolvedComplaints.filter(c => {
    if (!c.resolvedAt) return false;
    return new Date(c.resolvedAt) <= new Date(c.deadlineAt);
  });

  const avgRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length 
    : 0;

  const onTimePercentage = resolvedComplaints.length > 0
    ? (onTimeComplaints.length / resolvedComplaints.length) * 100
    : 0;

  // Calculate median resolution time
  const resolutionTimes = resolvedComplaints
    .filter(c => c.resolvedAt)
    .map(c => {
      const created = new Date(c.createdAt).getTime();
      const resolved = new Date(c.resolvedAt!).getTime();
      return (resolved - created) / (1000 * 60 * 60); // hours
    })
    .sort((a, b) => a - b);

  const medianResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes[Math.floor(resolutionTimes.length / 2)]
    : 0;

  // Weekly on-time rate (last 4 weeks)
  const weeklyOnTimeRate = Array.from({ length: 4 }, (_, weekIdx) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (weekIdx + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - weekIdx * 7);

    const weekComplaints = resolvedComplaints.filter(c => {
      if (!c.resolvedAt) return false;
      const resolvedDate = new Date(c.resolvedAt);
      return resolvedDate >= weekStart && resolvedDate < weekEnd;
    });

    const weekOnTime = weekComplaints.filter(c => {
      if (!c.resolvedAt) return false;
      return new Date(c.resolvedAt) <= new Date(c.deadlineAt);
    });

    return weekComplaints.length > 0 
      ? (weekOnTime.length / weekComplaints.length) * 100 
      : 0;
  }).reverse();

  return (
    <>
      <CalmBackground />
      <WardenShell wardenName="Mr. Sharma">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Performance</div>
            <h1 className="display display-lg mb-6">Your metrics</h1>
          </div>

          {loading ? (
            // Skeleton
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="h-20 bg-line rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Average Rating */}
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-ember" />
                    <h3 className="text-sm text-bone-dim uppercase tracking-wider">Average Rating</h3>
                  </div>
                  <StatBlock
                    label="out of 3 stars"
                    value={avgRating.toFixed(1)}
                    subtitle={`${ratings.length} rating${ratings.length !== 1 ? 's' : ''}`}
                  />
                </div>

                {/* Penalty Points */}
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-emergency" />
                    <h3 className="text-sm text-bone-dim uppercase tracking-wider">Penalty Points</h3>
                  </div>
                  <StatBlock
                    label="tracked separately"
                    value={penalties.length}
                    subtitle="don't affect star rating"
                  />
                  <p className="text-xs text-muted mt-2 text-center">
                    Penalties are tracked separately and don't change your star average
                  </p>
                </div>

                {/* On-Time Percentage */}
                <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-resolved" />
                    <h3 className="text-sm text-bone-dim uppercase tracking-wider">On-Time Rate</h3>
                  </div>
                  <StatBlock
                    label="resolved on time"
                    value={`${Math.round(onTimePercentage)}%`}
                    subtitle={`${onTimeComplaints.length} of ${resolvedComplaints.length}`}
                  />
                </div>
              </div>

              {/* Median Resolution Time */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-bone-dim" />
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider">Median Resolution Time</h3>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-light text-bone tabular mb-2">
                    {medianResolutionTime.toFixed(1)}h
                  </p>
                  <p className="text-xs text-muted">
                    average time to resolve complaints
                  </p>
                </div>
              </div>

              {/* Weekly On-Time Rate Sparkline */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-ember" />
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider">Weekly On-Time Rate</h3>
                </div>
                <div className="flex items-end justify-between gap-2 h-32">
                  {weeklyOnTimeRate.map((rate, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-ember/30 rounded-t relative overflow-hidden"
                        style={{ height: `${rate}%` }}
                      >
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-ember"
                          style={{ height: '100%' }}
                        />
                      </div>
                      <span className="text-xs text-muted tabular">
                        {Math.round(rate)}%
                      </span>
                      <span className="text-xs text-muted">
                        W{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Complaint Table */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Complaint History</h3>
                <div className="space-y-3">
                  {complaints.slice(0, 10).map((complaint, idx) => {
                    const isOverdue = new Date() > new Date(complaint.deadlineAt) && 
                                     complaint.status !== ComplaintStatus.RESOLVED && 
                                     complaint.status !== ComplaintStatus.CLOSED;
                    const hasPenalty = penalties.some(p => p.complaintId === complaint.id);
                    const rating = ratings.find(r => r.complaintId === complaint.id);

                    return (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Row
                          number={idx + 1}
                          title={complaint.title}
                          description={complaint.description}
                          meta={
                            <div className="flex flex-col items-end gap-2">
                              <PriorityBadge priority={complaint.priority} />
                              <StatusBadge status={complaint.status} />
                              <Countdown deadlineAt={complaint.deadlineAt} compact />
                              <div className="flex items-center gap-3 text-xs">
                                {hasPenalty && (
                                  <span className="px-2 py-0.5 bg-emergency/20 text-emergency rounded-full border border-emergency/30">
                                    Penalty
                                  </span>
                                )}
                                {rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-ember fill-current" />
                                    <span className="tabular">{rating.stars}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* How Score is Calculated */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">How is my score calculated?</h3>
                <div className="space-y-4 text-sm text-bone-dim">
                  <div>
                    <p className="text-bone font-medium mb-1">Star Rating</p>
                    <p>Average of all student ratings (1-3 stars) for resolved complaints.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">Penalty Points</p>
                    <p>Each missed deadline adds 1 penalty point. These are tracked separately and do not affect your star rating.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">On-Time Rate</p>
                    <p>Percentage of resolved complaints that were completed before the deadline.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">Resolution Time</p>
                    <p>Median time from complaint submission to resolution, measured in hours.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </WardenShell>
    </>
  );
}
