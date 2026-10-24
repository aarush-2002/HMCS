import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThumbsUp, Clock } from 'lucide-react';
import { Shell } from '../components/Shell';
import { CalmBackground } from '../components/CalmBackground';
import { Row, PriorityBadge, StatusBadge, Countdown } from '../components/ui';
import { getStore, getUpvotesForComplaint } from '../store/data';
import { Complaint, ComplaintStatus } from '../shared/types';

export default function MyComplaints() {
  const navigate = useNavigate();
  const studentId = 'student-1';
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const store = getStore();
    let filtered = store.complaints.filter(c => c.submitterId === studentId);

    if (activeTab === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (activeTab === 'resolved') {
      filtered = filtered.filter(c => c.status === ComplaintStatus.RESOLVED || c.status === ComplaintStatus.CLOSED);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setComplaints(filtered);
    setLoading(false);
  }, [activeTab]);

  const tabs = [
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ];

  return (
    <>
      <CalmBackground />
      <Shell>
        <div className="relative z-10">
          <div className="eyebrow eyebrow-ember mb-2">My Complaints</div>
          <h1 className="display display-lg mb-8">Your submissions</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-ember text-ink'
                    : 'bg-ink-2/50 border border-line text-bone-dim hover:text-bone'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Complaint List */}
          <div className="space-y-3">
            {loading ? (
              // Skeleton rows
              Array.from({ length: 3 }).map((_, i) => (
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
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 bg-ink border-2 border-line rounded-lg">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 p-2 h-full">
                      <div className="bg-line/30 rounded" />
                      <div className="bg-line/30 rounded" />
                      <div className="bg-line/30 rounded" />
                      <div className="bg-line/30 rounded" />
                    </div>
                  </div>
                </div>
                <h3 className="text-xl text-bone mb-2">Nothing waiting. All quiet.</h3>
                <p className="text-bone-dim">
                  {activeTab === 'active' 
                    ? "You have no active complaints."
                    : activeTab === 'resolved'
                    ? "You have no resolved complaints yet."
                    : "You haven't filed any complaints yet."}
                </p>
              </div>
            ) : (
              // Complaint rows
              complaints.map((complaint, idx) => {
                const upvotes = getUpvotesForComplaint(complaint.id);
                const upvoteCount = upvotes.length;

                return (
                  <motion.div
                    key={complaint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigate(`/student/complaint/${complaint.id}`)}
                    className="cursor-pointer"
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
                          <div className="flex items-center gap-1 text-xs text-muted">
                            <ThumbsUp className="w-3 h-3" />
                            <span className="tabular">{upvoteCount}</span>
                          </div>
                        </div>
                      }
                    />
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
