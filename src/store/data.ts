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
      createdAt: hoursAgo(createdHours),
      updatedAt: hoursAgo(createdHours - 5),
    });
  }
  
  return complaints;
}

const complaints = generateComplaints();

// Generate upvotes - some complaints have many votes for promotion testing
const upvotes: Upvote[] = [];
// c-1 has 8 upvotes (close to promotion)
for (let i = 0; i < 8; i++) {
  upvotes.push({ id: uuid(), complaintId: 'c-1', userId: `student-${i + 3}`, createdAt: hoursAgo(20 - i) });
}
// c-6 has 12 upvotes (already promoted in seed)
for (let i = 0; i < 12; i++) {
  upvotes.push({ id: uuid(), complaintId: 'c-6', userId: `student-${(i % 50) + 1}`, createdAt: hoursAgo(40 - i) });
}
// Mark c-6 as promoted
const c6 = complaints.find(c => c.id === 'c-6');
if (c6) {
  c6.priority = Priority.EMERGENCY;
  c6.promotedAt = hoursAgo(38);
}

// Resolution votes
const resolutionVotes: ResolutionVote[] = [
  { id: uuid(), complaintId: 'c-11', userId: 'student-12', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(25) },
  { id: uuid(), complaintId: 'c-11', userId: 'student-13', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(24) },
  { id: uuid(), complaintId: 'c-11', userId: 'student-14', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(23) },
];

// Warden ratings
const wardenRatings: WardenRating[] = [
  { id: uuid(), complaintId: 'c-11', wardenId: 'warden-1', studentId: 'student-11', stars: 3, createdAt: hoursAgo(19) },
];

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

const STORAGE_KEY = 'hmcs-store-v2';

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

// Promotion logic - transactional
export function checkAndPromote(complaintId: string): boolean {
  const complaint = store.complaints.find(c => c.id === complaintId);
  if (!complaint || complaint.priority !== Priority.NORMAL) return false;
  
  const upvoteCount = store.upvotes.filter(u => u.complaintId === complaintId).length;
  if (upvoteCount < POLICY.promotionThreshold) return false;
  
  // Promote
  const now = new Date().toISOString();
  updateComplaint(complaintId, {
    priority: Priority.EMERGENCY,
    promotedAt: now,
    deadlineAt: new Date(Date.now() + POLICY.emergencyDeadlineHours * 3600000).toISOString(),
  });
  
  // Audit event
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
  
  // Notifications
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
