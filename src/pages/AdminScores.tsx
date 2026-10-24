import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, AlertTriangle, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { CalmBackground } from '../components/CalmBackground';
import { Button, StarRating } from '../components/ui';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getStore, getUserById, getRatingsForWarden, getPenaltiesForWarden } from '../store/data';
import { showToast } from '../components/ui';

export default function AdminScores() {
  const [wardens, setWardens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoidDialog, setShowVoidDialog] = useState<string | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState<string | null>(null);

  useEffect(() => {
    const store = getStore();
    const wardenUsers = store.users.filter(u => u.role === 'WARDEN');
    
    const wardenData = wardenUsers.map(warden => {
      const ratings = getRatingsForWarden(warden.id);
      const penalties = getPenaltiesForWarden(warden.id);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length 
        : 0;

      return {
        ...warden,
        ratings,
        penalties,
        avgRating,
      };
    });

    setWardens(wardenData);
    setLoading(false);
  }, []);

  const handleVoidPenalty = (penaltyId: string) => {
    // In real app, this would call an API
    console.log('Voiding penalty:', penaltyId);
    setShowVoidDialog(null);
    showToast('success', 'Penalty voided successfully');
  };

  const handleFlagRating = (ratingId: string) => {
    // In real app, this would call an API
    console.log('Flagging rating:', ratingId);
    setShowFlagDialog(null);
    showToast('success', 'Rating flagged for review');
  };

  return (
    <>
      <CalmBackground />
      <AdminShell adminName="Dr. Admin">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Score Review</div>
            <h1 className="display display-lg mb-4">Warden scores</h1>
            <p className="text-bone-dim">
              Review warden performance metrics, flagged ratings, and disputed penalties.
            </p>
          </div>

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-ink-2/50 border border-line rounded-xl p-6 animate-pulse">
                  <div className="h-32 bg-line rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Wardens Overview */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-6">All Wardens</h3>
                <div className="space-y-6">
                  {wardens.map((warden, idx) => (
                    <motion.div
                      key={warden.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="pb-6 border-b border-line last:border-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-amber-400">
                              {warden.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-lg font-medium text-bone">{warden.name}</p>
                            <p className="text-xs text-muted">{warden.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Average Rating */}
                        <div className="bg-ink/50 rounded-lg p-4">
                          <p className="text-xs text-muted mb-2">Average Rating</p>
                          <div className="flex items-center gap-2 mb-2">
                            <StarRating value={Math.round(warden.avgRating)} readonly size="sm" />
                            <span className="text-lg font-light text-bone tabular">
                              {warden.avgRating.toFixed(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted">
                            {warden.ratings.length} rating{warden.ratings.length !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Penalty Points */}
                        <div className="bg-ink/50 rounded-lg p-4">
                          <p className="text-xs text-muted mb-2">Penalty Points</p>
                          <p className="text-2xl font-light text-emergency tabular mb-1">
                            {warden.penalties.length}
                          </p>
                          <p className="text-xs text-muted">
                            tracked separately
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="bg-ink/50 rounded-lg p-4 flex flex-col justify-center">
                          <Button variant="ghost" size="sm" className="w-full mb-2">
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full">
                            Review History
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Flagged Ratings */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-ember" />
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider">Flagged Ratings</h3>
                </div>

                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-ink-2 border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-resolved" />
                  </div>
                  <h4 className="text-lg text-bone mb-2">No flagged ratings</h4>
                  <p className="text-bone-dim text-sm">
                    All ratings are within acceptable bounds.
                  </p>
                </div>
              </div>

              {/* Disputed Penalties */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingDown className="w-5 h-5 text-emergency" />
                  <h3 className="text-sm text-bone-dim uppercase tracking-wider">Disputed Penalties</h3>
                </div>

                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-ink-2 border border-line rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-resolved" />
                  </div>
                  <h4 className="text-lg text-bone mb-2">No disputed penalties</h4>
                  <p className="text-bone-dim text-sm">
                    All penalties are accepted.
                  </p>
                </div>
              </div>

              {/* Score Calculation Info */}
              <div className="bg-ink-2/50 border border-line rounded-xl p-6">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">How Scores Work</h3>
                <div className="space-y-4 text-sm text-bone-dim">
                  <div>
                    <p className="text-bone font-medium mb-1">Star Rating</p>
                    <p>Average of all student ratings (1-3 stars) for resolved complaints. Ratings are anonymous to wardens.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">Penalty Points</p>
                    <p>Each missed deadline adds 1 penalty point. These are tracked separately and do not affect the star rating.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">Flagged Ratings</p>
                    <p>Wardens can flag ratings they believe are inappropriate. Admins review flagged ratings and can keep, adjust, or remove them.</p>
                  </div>
                  <div>
                    <p className="text-bone font-medium mb-1">Disputed Penalties</p>
                    <p>Wardens can dispute penalties with a reason. Admins review disputes and can keep, adjust, or void the penalty with a compensating record.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Void Penalty Dialog */}
          <ConfirmDialog
            isOpen={showVoidDialog !== null}
            onClose={() => setShowVoidDialog(null)}
            onConfirm={() => showVoidDialog && handleVoidPenalty(showVoidDialog)}
            title="Void Penalty"
            message="Are you sure you want to void this penalty? A compensating record will be created in the audit log."
            confirmLabel="Void Penalty"
            variant="danger"
          />

          {/* Flag Rating Dialog */}
          <ConfirmDialog
            isOpen={showFlagDialog !== null}
            onClose={() => setShowFlagDialog(null)}
            onConfirm={() => showFlagDialog && handleFlagRating(showFlagDialog)}
            title="Flag Rating"
            message="Are you sure you want to flag this rating for review? An admin will review it shortly."
            confirmLabel="Flag Rating"
          />
        </div>
      </AdminShell>
    </>
  );
}
