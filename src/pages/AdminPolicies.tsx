import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, AlertTriangle, Info } from 'lucide-react';
import { AdminShell } from '../components/AdminShell';
import { CalmBackground } from '../components/CalmBackground';
import { Input, Button } from '../components/ui';
import { POLICY } from '../shared/policy';
import { showToast } from '../components/ui';

export default function AdminPolicies() {
  const [policies, setPolicies] = useState({
    normalDeadlineHours: POLICY.normalDeadlineHours,
    emergencyDeadlineHours: POLICY.emergencyDeadlineHours,
    promotionThreshold: POLICY.promotionThreshold,
    resolutionVotesRequired: POLICY.resolutionVotesRequired,
    confirmationWindowHours: POLICY.confirmationWindowHours,
    normalComplaintsPerDay: POLICY.normalComplaintsPerDay,
    emergencyComplaintsPerWeek: POLICY.emergencyComplaintsPerWeek,
    ratingMin: POLICY.ratingMin,
    ratingMax: POLICY.ratingMax,
    penaltyStars: POLICY.penaltyStars,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: string, value: number) => {
    setPolicies(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // In real app, this would call an API
    console.log('Saving policies:', policies);
    setHasChanges(false);
    showToast('success', 'Policies updated successfully');
  };

  const policyFields = [
    { key: 'normalDeadlineHours', label: 'Normal Deadline (hours)', min: 1, max: 168 },
    { key: 'emergencyDeadlineHours', label: 'Emergency Deadline (hours)', min: 1, max: 72 },
    { key: 'promotionThreshold', label: 'Promotion Threshold (upvotes)', min: 1, max: 100 },
    { key: 'resolutionVotesRequired', label: 'Resolution Votes Required', min: 1, max: 10 },
    { key: 'confirmationWindowHours', label: 'Confirmation Window (hours)', min: 1, max: 168 },
    { key: 'normalComplaintsPerDay', label: 'Normal Complaints Per Day', min: 1, max: 10 },
    { key: 'emergencyComplaintsPerWeek', label: 'Emergency Complaints Per Week', min: 1, max: 10 },
    { key: 'ratingMin', label: 'Rating Minimum', min: 1, max: 5 },
    { key: 'ratingMax', label: 'Rating Maximum', min: 1, max: 5 },
    { key: 'penaltyStars', label: 'Penalty Stars', min: -5, max: 0 },
  ];

  return (
    <>
      <CalmBackground />
      <AdminShell adminName="Dr. Admin">
        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div>
            <div className="eyebrow eyebrow-ember mb-2">Policies</div>
            <h1 className="display display-lg mb-4">System policies</h1>
            <p className="text-bone-dim">
              Configure system-wide policies and limits. Changes apply to future complaints only.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-bone font-medium mb-1">Important</p>
                <p className="text-sm text-bone-dim">
                  Changes to policies will only affect new complaints. Existing complaints will continue to use the policies that were in effect when they were created.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Form */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-ember" />
              <h2 className="text-lg font-medium text-bone">Policy Configuration</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policyFields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm text-bone-dim mb-2">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={policies[field.key as keyof typeof policies]}
                    onChange={(e) => handleChange(field.key, Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    className="w-full px-4 py-2.5 bg-ink border border-line rounded-lg text-sm text-bone focus:outline-none focus:border-ember transition-colors"
                  />
                  <p className="text-xs text-muted mt-1">
                    Range: {field.min} - {field.max}
                  </p>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Info className="w-4 h-4" />
                <span>
                  {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
                </span>
              </div>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </div>
          </div>

          {/* Current Values */}
          <div className="bg-ink-2/50 border border-line rounded-xl p-6">
            <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">Current Values</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(policies).map(([key, value]) => (
                <div key={key} className="bg-ink/50 rounded-lg p-4">
                  <p className="text-xs text-muted mb-1">{key}</p>
                  <p className="text-lg font-light text-bone tabular">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminShell>
    </>
  );
}
