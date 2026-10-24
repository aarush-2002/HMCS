import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Info, CheckCircle } from 'lucide-react';
import { Shell } from '../components/Shell';
import { CalmBackground } from '../components/CalmBackground';
import { Input, Textarea, Select, FileDropzone, Button } from '../components/ui';
import { getStore, addComplaint, getStudentComplaintsToday, getStudentEmergencyThisWeek } from '../store/data';
import { Complaint, ComplaintStatus, Priority, Category } from '../shared/types';
import { POLICY } from '../shared/policy';

export default function NewComplaint() {
  const navigate = useNavigate();
  const studentId = 'student-1';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);

  // Allowance
  const normalUsedToday = getStudentComplaintsToday(studentId);
  const emergencyUsedWeek = getStudentEmergencyThisWeek(studentId);
  const canSubmitNormal = normalUsedToday < POLICY.normalComplaintsPerDay;
  const canSubmitEmergency = emergencyUsedWeek < POLICY.emergencyComplaintsPerWeek;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description) return;
    if (priority === Priority.NORMAL && !canSubmitNormal) return;
    if (priority === Priority.EMERGENCY && !canSubmitEmergency) return;

    setSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const store = getStore();
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(deadline.getHours() + (priority === Priority.EMERGENCY ? 24 : 72));

    const complaint: Complaint = {
      id: `complaint-${Date.now()}`,
      title,
      description,
      category,
      priority,
      status: ComplaintStatus.SUBMITTED,
      submitterId: studentId,
      hostelId: 'hostel-1',
      assignedWardenId: null,
      deadlineAt: deadline.toISOString(),
      promotedAt: null,
      markedResolvedAt: null,
      resolvedAt: null,
      resolutionNote: null,
      resolutionRound: 1,
      isActive: true,
      confirmationWindowStart: null,
      confirmationWindowEnd: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    addComplaint(complaint);
    setSubmitted(complaint);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <>
        <CalmBackground />
        <Shell>
          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-ink-2/50 border border-line rounded-xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-resolved/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-resolved" />
              </div>

              <h2 className="display display-md mb-4">Complaint Filed</h2>
              <p className="text-bone-dim mb-8">Your complaint has been submitted and will be reviewed shortly.</p>

              {/* Complaint Details */}
              <div className="bg-ink border border-line rounded-lg p-6 mb-8 text-left space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bone-dim">Complaint ID</span>
                  <span className="text-sm font-mono text-bone">{submitted.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bone-dim">Priority</span>
                  <span className={`text-sm font-medium ${
                    submitted.priority === Priority.EMERGENCY ? 'text-emergency' : 'text-ember'
                  }`}>
                    {submitted.priority}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-bone-dim">Deadline</span>
                  <span className="text-sm text-bone">
                    {new Date(submitted.deadlineAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Animated Window */}
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-ink border-2 border-line rounded-lg">
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 p-2 h-full">
                    <div className="bg-line/30 rounded" />
                    <div className="bg-line/30 rounded" />
                    <div className="bg-line/30 rounded" />
                    <motion.div
                      className="bg-ember rounded"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button variant="primary" onClick={() => navigate('/student')}>
                  Back to Feed
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/student/complaint/${submitted.id}`)}>
                  View Complaint
                </Button>
              </div>
            </motion.div>
          </div>
        </Shell>
      </>
    );
  }

  return (
    <>
      <CalmBackground />
      <Shell>
        <div className="relative z-10">
          <div className="eyebrow eyebrow-ember mb-2">New Complaint</div>
          <h1 className="display display-lg mb-8">File a complaint</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-ink-2/50 border border-line rounded-xl p-8 space-y-6">
                {/* Title */}
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  required
                />

                {/* Description */}
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide details about the issue..."
                  rows={6}
                  required
                />

                {/* Category */}
                <Select
                  label="Category"
                  value={category}
                  onChange={(v) => setCategory(v as Category)}
                  options={Object.values(Category).map(c => ({
                    value: c,
                    label: c.charAt(0) + c.slice(1).toLowerCase(),
                  }))}
                />

                {/* Priority */}
                <div>
                  <label className="block text-sm text-bone-dim mb-3 uppercase tracking-wider">Priority</label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Normal */}
                    <button
                      type="button"
                      onClick={() => setPriority(Priority.NORMAL)}
                      disabled={!canSubmitNormal}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        priority === Priority.NORMAL
                          ? 'border-ember bg-ember/10'
                          : 'border-line bg-ink hover:border-ember/50'
                      } ${!canSubmitNormal && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-ember" />
                        <span className="font-medium text-bone">Normal</span>
                      </div>
                      <p className="text-xs text-bone-dim">
                        {canSubmitNormal 
                          ? `${POLICY.normalComplaintsPerDay - normalUsedToday} remaining today`
                          : 'Daily limit reached'}
                      </p>
                      <p className="text-xs text-muted mt-1">{POLICY.normalDeadlineHours}h deadline</p>
                    </button>

                    {/* Emergency */}
                    <button
                      type="button"
                      onClick={() => canSubmitEmergency && setPriority(Priority.EMERGENCY)}
                      disabled={!canSubmitEmergency}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        priority === Priority.EMERGENCY
                          ? 'border-emergency bg-emergency/10'
                          : 'border-line bg-ink hover:border-emergency/50'
                      } ${!canSubmitEmergency && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-emergency" />
                        <span className="font-medium text-bone">Emergency</span>
                      </div>
                      <p className="text-xs text-bone-dim">
                        {canSubmitEmergency
                          ? `${POLICY.emergencyComplaintsPerWeek - emergencyUsedWeek} remaining this week`
                          : 'Weekly limit reached'}
                      </p>
                      <p className="text-xs text-muted mt-1">{POLICY.emergencyDeadlineHours}h deadline</p>
                    </button>
                  </div>

                  {/* Emergency criteria */}
                  {priority === Priority.EMERGENCY && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-emergency/10 border border-emergency/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-emergency shrink-0 mt-0.5" />
                        <div className="text-sm text-bone-dim">
                          <p className="font-medium text-bone mb-1">Emergency criteria:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Safety hazards (fire, electrical, structural)</li>
                            <li>Health risks (water contamination, pest infestation)</li>
                            <li>Complete loss of essential services (water, electricity)</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Photos */}
                <FileDropzone
                  label="Photos (optional)"
                  files={photos}
                  onFilesChange={setPhotos}
                  maxFiles={4}
                  maxSizeMB={5}
                />

                {/* Privacy Note */}
                <div className="p-4 bg-ink border border-line rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-bone-dim shrink-0 mt-0.5" />
                    <p className="text-xs text-bone-dim">
                      Your identity is hidden from other students. Only wardens and administrators can see who filed the complaint.
                    </p>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                  disabled={submitting || !title || !description}
                >
                  Submit Complaint
                </Button>
              </form>
            </div>

            {/* What Happens Next Panel */}
            <div className="lg:col-span-1">
              <div className="bg-ink-2/50 border border-line rounded-xl p-6 sticky top-24">
                <h3 className="text-sm text-bone-dim uppercase tracking-wider mb-4">What happens next</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ember text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm text-bone font-medium">Submitted</p>
                      <p className="text-xs text-bone-dim">Your complaint enters the queue</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ember text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm text-bone font-medium">Acknowledged</p>
                      <p className="text-xs text-bone-dim">A warden reviews your complaint</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ember text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-sm text-bone font-medium">In Progress</p>
                      <p className="text-xs text-bone-dim">Work begins on the issue</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-ember/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-ember text-sm">4</span>
                    </div>
                    <div>
                      <p className="text-sm text-bone font-medium">Resolved</p>
                      <p className="text-xs text-bone-dim">You confirm the fix and rate the service</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-line">
                  <p className="text-xs text-bone-dim mb-2">Deadline</p>
                  <p className="text-2xl font-light text-bone tabular">
                    {priority === Priority.EMERGENCY ? POLICY.emergencyDeadlineHours : POLICY.normalDeadlineHours}h
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {priority === Priority.EMERGENCY ? 'Emergency response' : 'Standard response'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}
