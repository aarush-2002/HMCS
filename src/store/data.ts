import { v4 as uuid } from 'uuid';
import {
  User, Hostel, Complaint, Upvote, ResolutionVote, WardenRating,
  PenaltyEvent, Notification, AuditEvent, Role, Priority, Category,
  ComplaintStatus, VoteType,
} from '../shared/types';
import { POLICY } from '../shared/policy';

// Seed Data
const HOSTEL_ID = 'hostel-1';

const hostel: Hostel = { id: HOSTEL_ID, name: 'Vivekananda Hostel', building: 'Block A' };

const users: User[] = [
  { id: 'admin-1', email: 'admin@hmcs.edu', name: 'Dr. Admin', role: Role.ADMIN, hostelId: HOSTEL_ID, password: 'admin123' },
  { id: 'warden-1', email: 'warden1@hmcs.edu', name: 'Mr. Sharma', role: Role.WARDEN, hostelId: HOSTEL_ID, password: 'warden123' },
  { id: 'warden-2', email: 'warden2@hmcs.edu', name: 'Ms. Patel', role: Role.WARDEN, hostelId: HOSTEL_ID, password: 'warden123' },
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `student-${i + 1}`,
    email: `student${i + 1}@hmcs.edu`,
    name: `Student ${i + 1}`,
    role: Role.STUDENT,
    hostelId: HOSTEL_ID,
    password: 'student123',
  })),
];

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600000).toISOString();
}

// Generate 500 complaints for performance testing
function generateComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  const statuses = [ComplaintStatus.SUBMITTED, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.MARKED_RESOLVED, ComplaintStatus.RESOLVED];
  const categories = Object.values(Category);
  
  for (let i = 0; i < 500; i++) {
    const studentNum = (i % 50) + 1;
    const wardenId = i % 2 === 0 ? 'warden-1' : 'warden-2';
    const status = statuses[i % statuses.length];
    const category = categories[i % categories.length];
    const priority = i % 10 === 0 ? Priority.EMERGENCY : Priority.NORMAL;
    const isActive = status !== ComplaintStatus.RESOLVED && status !== ComplaintStatus.CLOSED && status !== ComplaintStatus.REJECTED;
    const createdHours = Math.floor(Math.random() * 200) + 1;
    
    complaints.push({
      id: `c-${i + 1}`,
      title: `Maintenance issue #${i + 1} - ${category.toLowerCase()}`,
      description: `Detailed description of maintenance issue number ${i + 1} in the hostel. This requires attention and should be resolved promptly. The issue affects daily living conditions.`,
      category,
      priority,
      status,
      submitterId: `student-${studentNum}`,
      hostelId: HOSTEL_ID,
      assignedWardenId: wardenId,
      deadlineAt: status === ComplaintStatus.RESOLVED ? hoursAgo(i) : hoursFromNow(72 - (i % 72)),
      promotedAt: null,
      markedResolvedAt: status === ComplaintStatus.MARKED_RESOLVED || status === ComplaintStatus.RESOLVED ? hoursAgo(i % 50) : null,
      resolvedAt: status === ComplaintStatus.RESOLVED ? hoursAgo((i % 50) - 1) : null,
      resolutionNote: status === ComplaintStatus.RESOLVED || status === ComplaintStatus.MARKED_RESOLVED ? 'Issue addressed and fixed.' : null,
      resolutionRound: 1,
      isActive,
      confirmationWindowStart: status === ComplaintStatus.MARKED_RESOLVED ? hoursAgo(i % 50) : null,
      confirmationWindowEnd: status === ComplaintStatus.MARKED_RESOLVED ? hoursFromNow(24 - (i % 24)) : null,
      createdAt: hoursAgo(createdHours),
      updatedAt: hoursAgo(createdHours - 5),
    });
  }
  
  return complaints;
}

const complaints = generateComplaints();

// Generate upvotes
const upvotes: Upvote[] = [];
for (let i = 0; i < 8; i++) {
  upvotes.push({ id: uuid(), complaintId: 'c-1', userId: `student-${i + 3}`, createdAt: hoursAgo(20 - i) });
}
for (let i = 0; i < 12; i++) {
  upvotes.push({ id: uuid(), complaintId: 'c-6', userId: `student-${(i % 50) + 1}`, createdAt: hoursAgo(40 - i) });
}
const c6 = complaints.find(c => c.id === 'c-6');
if (c6) {
  c6.priority = Priority.EMERGENCY;
  c6.promotedAt = hoursAgo(38);
}

// Resolution votes
const resolutionVotes: ResolutionVote[] = [];

// Warden ratings
const wardenRatings: WardenRating[] = [];

// Penalty events
const penaltyEvents: PenaltyEvent[] = [];

// Notifications
const notifications: Notification[] = [];

// Audit events
const auditEvents: AuditEvent[] = [];

// Store interface
export interface Store {
  hostel: Hostel;
  users: User[];
  complaints: Complaint[];
  upvotes: Upvote[];
  resolutionVotes: ResolutionVote[];
  wardenRatings: WardenRating[];
  penaltyEvents: PenaltyEvent[];
  notifications: Notification[];
  auditEvents: AuditEvent[];
}

const STORAGE_KEY = 'hmcs-store-v3';

function getInitialStore(): Store {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fall through to seed
    }
  }
  return {
    hostel,
    users,
    complaints,
    upvotes,
    resolutionVotes,
    wardenRatings,
    penaltyEvents,
    notifications,
    auditEvents,
  };
}

let store: Store = getInitialStore();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getStore(): Store {
  return store;
}

export function resetStore() {
  localStorage.removeItem(STORAGE_KEY);
  store = {
    hostel,
    users,
    complaints: generateComplaints(),
    upvotes: [],
    resolutionVotes: [],
    wardenRatings: [],
    penaltyEvents: [],
    notifications: [],
    auditEvents: [],
  };
  persist();
}

// Actions
export function addComplaint(complaint: Complaint) {
  store.complaints = [complaint, ...store.complaints];
  persist();
}

export function updateComplaint(id: string, updates: Partial<Complaint>) {
  store.complaints = store.complaints.map(c =>
    c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  persist();
}

export function addUpvote(upvote: Upvote) {
  store.upvotes = [...store.upvotes, upvote];
  persist();
}

export function removeUpvote(complaintId: string, userId: string) {
  store.upvotes = store.upvotes.filter(u => !(u.complaintId === complaintId && u.userId === userId));
  persist();
}

export function addResolutionVote(vote: ResolutionVote) {
  // Remove any existing vote from this user for this complaint/round
  store.resolutionVotes = store.resolutionVotes.filter(v => 
    !(v.complaintId === vote.complaintId && v.userId === vote.userId && v.round === vote.round)
  );
  store.resolutionVotes = [...store.resolutionVotes, vote];
  persist();
}

export function addWardenRating(rating: WardenRating) {
  store.wardenRatings = [...store.wardenRatings, rating];
  persist();
}

export function addNotification(notification: Notification) {
  store.notifications = [notification, ...store.notifications];
  persist();
}

export function markNotificationRead(id: string) {
  store.notifications = store.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  persist();
}

export function addAuditEvent(event: AuditEvent) {
  store.auditEvents = [event, ...store.auditEvents];
  persist();
}

export function addPenaltyEvent(penalty: PenaltyEvent) {
  store.penaltyEvents = [...store.penaltyEvents, penalty];
  persist();
}

// Status transition validation
const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  [ComplaintStatus.SUBMITTED]: [ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.REJECTED],
  [ComplaintStatus.ACKNOWLEDGED]: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.REJECTED],
  [ComplaintStatus.IN_PROGRESS]: [ComplaintStatus.MARKED_RESOLVED, ComplaintStatus.REJECTED],
  [ComplaintStatus.MARKED_RESOLVED]: [ComplaintStatus.RESOLVED, ComplaintStatus.REOPENED],
  [ComplaintStatus.RESOLVED]: [ComplaintStatus.CLOSED],
  [ComplaintStatus.REOPENED]: [ComplaintStatus.IN_PROGRESS],
  [ComplaintStatus.CLOSED]: [],
  [ComplaintStatus.REJECTED]: [],
};

export function canTransition(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) || false;
}

export function updateComplaintStatus(
  complaintId: string,
  newStatus: ComplaintStatus,
  actorId: string,
  resolutionNote?: string
): { success: boolean; error?: string } {
  const complaint = store.complaints.find(c => c.id === complaintId);
  if (!complaint) return { success: false, error: 'Complaint not found' };
  
  if (!canTransition(complaint.status, newStatus)) {
    return { success: false, error: `Invalid transition from ${complaint.status} to ${newStatus}` };
  }
  
  const updates: Partial<Complaint> = { status: newStatus };
  
  if (newStatus === ComplaintStatus.MARKED_RESOLVED) {
    if (!resolutionNote || resolutionNote.length < 10) {
      return { success: false, error: 'Resolution note must be at least 10 characters' };
    }
    updates.markedResolvedAt = new Date().toISOString();
    updates.resolutionNote = resolutionNote;
    updates.confirmationWindowStart = new Date().toISOString();
    updates.confirmationWindowEnd = new Date(Date.now() + POLICY.confirmationWindowHours * 3600000).toISOString();
    
    // Notify submitter
    addNotification({
      id: uuid(),
      userId: complaint.submitterId,
      message: `Your complaint "${complaint.title}" has been marked resolved. Please confirm.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  
  if (newStatus === ComplaintStatus.RESOLVED) {
    updates.resolvedAt = new Date().toISOString();
    updates.isActive = false;
  }
  
  if (newStatus === ComplaintStatus.REOPENED) {
    updates.resolutionRound = (complaint.resolutionRound || 1) + 1;
    updates.isActive = true;
  }
  
  updateComplaint(complaintId, updates);
  
  addAuditEvent({
    id: uuid(),
    actorId,
    action: 'STATUS_CHANGED',
    entityType: 'Complaint',
    entityId: complaintId,
    before: { status: complaint.status },
    after: { status: newStatus },
    createdAt: new Date().toISOString(),
  });
  
  return { success: true };
}

// Promotion logic
export function checkAndPromote(complaintId: string): boolean {
  const complaint = store.complaints.find(c => c.id === complaintId);
  if (!complaint || complaint.priority !== Priority.NORMAL) return false;
  
  const upvoteCount = store.upvotes.filter(u => u.complaintId === complaintId).length;
  if (upvoteCount < POLICY.promotionThreshold) return false;
  
  const now = new Date().toISOString();
  updateComplaint(complaintId, {
    priority: Priority.EMERGENCY,
    promotedAt: now,
    deadlineAt: new Date(Date.now() + POLICY.emergencyDeadlineHours * 3600000).toISOString(),
  });
  
  addAuditEvent({
    id: uuid(),
    actorId: 'system',
    action: 'PROMOTED_TO_EMERGENCY',
    entityType: 'Complaint',
    entityId: complaintId,
    before: { priority: 'NORMAL' },
    after: { priority: 'EMERGENCY' },
    createdAt: now,
  });
  
  addNotification({
    id: uuid(),
    userId: complaint.submitterId,
    message: `Your complaint "${complaint.title}" has been promoted to EMERGENCY!`,
    read: false,
    createdAt: now,
  });
  
  if (complaint.assignedWardenId) {
    addNotification({
      id: uuid(),
      userId: complaint.assignedWardenId,
      message: `Complaint "${complaint.title}" promoted to EMERGENCY. New deadline: 24 hours.`,
      read: false,
      createdAt: now,
    });
  }
  
  return true;
}

// Resolution vote processing
export function processResolutionVote(complaintId: string): void {
  const complaint = store.complaints.find(c => c.id === complaintId);
  if (!complaint || complaint.status !== ComplaintStatus.MARKED_RESOLVED) return;
  
  const votes = store.resolutionVotes.filter(v => 
    v.complaintId === complaintId && v.round === complaint.resolutionRound
  );
  
  const solvedCount = votes.filter(v => v.voteType === VoteType.SOLVED).length;
  const notSolvedCount = votes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
  
  if (solvedCount >= POLICY.resolutionVotesRequired) {
    updateComplaintStatus(complaintId, ComplaintStatus.RESOLVED, 'system');
    addNotification({
      id: uuid(),
      userId: complaint.submitterId,
      message: `Your complaint "${complaint.title}" has been confirmed resolved!`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (complaint.assignedWardenId) {
      addNotification({
        id: uuid(),
        userId: complaint.assignedWardenId,
        message: `Complaint "${complaint.title}" confirmed resolved by students.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  } else if (notSolvedCount >= POLICY.resolutionVotesRequired) {
    updateComplaintStatus(complaintId, ComplaintStatus.REOPENED, 'system');
    addNotification({
      id: uuid(),
      userId: complaint.submitterId,
      message: `Your complaint "${complaint.title}" has been reopened.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
    if (complaint.assignedWardenId) {
      addNotification({
        id: uuid(),
        userId: complaint.assignedWardenId,
        message: `Complaint "${complaint.title}" reopened by students. Please review.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

// Window expiry check
export function checkExpiredWindows(): void {
  const now = new Date();
  const expiredComplaints = store.complaints.filter(c => 
    c.status === ComplaintStatus.MARKED_RESOLVED &&
    c.confirmationWindowEnd &&
    new Date(c.confirmationWindowEnd) < now
  );
  
  for (const complaint of expiredComplaints) {
    const votes = store.resolutionVotes.filter(v => 
      v.complaintId === complaint.id && v.round === complaint.resolutionRound
    );
    const solvedCount = votes.filter(v => v.voteType === VoteType.SOLVED).length;
    const notSolvedCount = votes.filter(v => v.voteType === VoteType.NOT_SOLVED).length;
    
    // If neither threshold met, return to IN_PROGRESS
    if (solvedCount < POLICY.resolutionVotesRequired && notSolvedCount < POLICY.resolutionVotesRequired) {
      updateComplaintStatus(complaint.id, ComplaintStatus.IN_PROGRESS, 'system');
      if (complaint.assignedWardenId) {
        addNotification({
          id: uuid(),
          userId: complaint.assignedWardenId,
          message: `Complaint "${complaint.title}" confirmation window expired. Returned to In Progress.`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}

// Penalty scheduler
export function checkOverdueAndPenalize(): void {
  const now = new Date();
  const overdueComplaints = store.complaints.filter(c => 
    c.isActive &&
    c.status !== ComplaintStatus.MARKED_RESOLVED &&
    c.status !== ComplaintStatus.RESOLVED &&
    c.status !== ComplaintStatus.CLOSED &&
    new Date(c.deadlineAt) < now
  );
  
  for (const complaint of overdueComplaints) {
    if (!complaint.assignedWardenId) continue;
    
    // Check if penalty already exists for this complaint/deadline
    const existingPenalty = store.penaltyEvents.find(p => 
      p.complaintId === complaint.id &&
      p.deadlineType === complaint.priority &&
      p.deadlineAt === complaint.deadlineAt
    );
    
    if (!existingPenalty) {
      addPenaltyEvent({
        id: uuid(),
        complaintId: complaint.id,
        wardenId: complaint.assignedWardenId,
        deadlineType: complaint.priority,
        deadlineAt: complaint.deadlineAt,
        createdAt: now.toISOString(),
      });
      
      addNotification({
        id: uuid(),
        userId: complaint.assignedWardenId,
        message: `Penalty applied: Missed ${complaint.priority.toLowerCase()} deadline for "${complaint.title}".`,
        read: false,
        createdAt: now.toISOString(),
      });
    }
  }
}

// Queries
export function getComplaintsByHostel(hostelId: string): Complaint[] {
  return store.complaints.filter(c => c.hostelId === hostelId);
}

export function getComplaintById(id: string): Complaint | undefined {
  return store.complaints.find(c => c.id === id);
}

export function getUpvotesForComplaint(complaintId: string): Upvote[] {
  return store.upvotes.filter(u => u.complaintId === complaintId);
}

export function getResolutionVotesForComplaint(complaintId: string, round: number): ResolutionVote[] {
  return store.resolutionVotes.filter(v => v.complaintId === complaintId && v.round === round);
}

export function getRatingsForWarden(wardenId: string): WardenRating[] {
  return store.wardenRatings.filter(r => r.wardenId === wardenId);
}

export function getPenaltiesForWarden(wardenId: string): PenaltyEvent[] {
  return store.penaltyEvents.filter(p => p.wardenId === wardenId);
}

export function getUserById(id: string): User | undefined {
  return store.users.find(u => u.id === id);
}

export function getNotificationsForUser(userId: string): Notification[] {
  return store.notifications.filter(n => n.userId === userId);
}

export function getStudentComplaintsToday(studentId: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return store.complaints.filter(c =>
    c.submitterId === studentId &&
    c.priority === Priority.NORMAL &&
    new Date(c.createdAt) >= today
  ).length;
}

export function getStudentEmergencyThisWeek(studentId: string): number {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return store.complaints.filter(c =>
    c.submitterId === studentId &&
    c.priority === Priority.EMERGENCY &&
    new Date(c.createdAt) >= weekStart
  ).length;
}

export function getAuditForComplaint(complaintId: string): AuditEvent[] {
  return store.auditEvents.filter(e => e.entityId === complaintId);
}

// Run schedulers
export function runSchedulers(): void {
  checkExpiredWindows();
  checkOverdueAndPenalize();
}
