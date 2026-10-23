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
  ...Array.from({ length: 15 }, (_, i) => ({
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

const complaints: Complaint[] = [
  // Submitted complaints
  { id: 'c-1', title: 'Leaking tap in Room 204', description: 'The bathroom tap has been dripping continuously since yesterday. Water is pooling on the floor.', category: Category.PLUMBING, priority: Priority.NORMAL, status: ComplaintStatus.SUBMITTED, submitterId: 'student-1', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(48), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(24), updatedAt: hoursAgo(24) },
  { id: 'c-2', title: 'Broken ceiling fan in Room 310', description: 'Fan makes loud noise and oscillates violently.', category: Category.ELECTRICAL, priority: Priority.NORMAL, status: ComplaintStatus.SUBMITTED, submitterId: 'student-2', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(60), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(12), updatedAt: hoursAgo(12) },
  { id: 'c-3', title: 'No hot water in Block A floor 3', description: 'The geyser on floor 3 common bathroom has stopped working for 2 days.', category: Category.PLUMBING, priority: Priority.EMERGENCY, status: ComplaintStatus.SUBMITTED, submitterId: 'student-3', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(12), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(12), updatedAt: hoursAgo(12) },
  { id: 'c-4', title: 'WiFi not working in rooms 401-410', description: 'Internet connectivity is completely down for the entire 4th floor wing.', category: Category.INTERNET, priority: Priority.EMERGENCY, status: ComplaintStatus.SUBMITTED, submitterId: 'student-4', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(8), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(16), updatedAt: hoursAgo(16) },
  // Acknowledged
  { id: 'c-5', title: 'Bed frame broken in Room 112', description: 'One side of the bed frame has cracked. It is unsafe to sleep on.', category: Category.FURNITURE, priority: Priority.NORMAL, status: ComplaintStatus.ACKNOWLEDGED, submitterId: 'student-5', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(36), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(36), updatedAt: hoursAgo(30) },
  { id: 'c-6', title: 'Corridor lights not working floor 2', description: 'Three tube lights in the second floor corridor have been fused for a week.', category: Category.ELECTRICAL, priority: Priority.NORMAL, status: ComplaintStatus.ACKNOWLEDGED, submitterId: 'student-6', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(20), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(52), updatedAt: hoursAgo(48) },
  // In Progress
  { id: 'c-7', title: 'Toilet flush not working Room 205', description: 'The flush mechanism is jammed. Have to pour water manually.', category: Category.PLUMBING, priority: Priority.NORMAL, status: ComplaintStatus.IN_PROGRESS, submitterId: 'student-7', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(24), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(48), updatedAt: hoursAgo(20) },
  { id: 'c-8', title: 'Mosquito menace in Room 315', description: 'Window mesh is torn. Multiple mosquito bites every night. Risk of dengue.', category: Category.OTHER, priority: Priority.EMERGENCY, status: ComplaintStatus.IN_PROGRESS, submitterId: 'student-8', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(6), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(18), updatedAt: hoursAgo(10) },
  // Marked Resolved (awaiting confirmation)
  { id: 'c-9', title: 'Power socket loose in Room 408', description: 'The charging socket near the study table is loose and sparks occasionally.', category: Category.ELECTRICAL, priority: Priority.NORMAL, status: ComplaintStatus.MARKED_RESOLVED, submitterId: 'student-9', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(10), promotedAt: null, markedResolvedAt: hoursAgo(2), resolvedAt: null, resolutionNote: 'Electrician replaced the socket. Please verify.', resolutionRound: 1, isActive: true, confirmationWindowStart: hoursAgo(2), createdAt: hoursAgo(50), updatedAt: hoursAgo(2) },
  { id: 'c-10', title: 'Water seepage in Room 102 ceiling', description: 'Rain water seeping through ceiling during monsoon. Damaging books.', category: Category.PLUMBING, priority: Priority.EMERGENCY, status: ComplaintStatus.MARKED_RESOLVED, submitterId: 'student-10', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(2), promotedAt: null, markedResolvedAt: hoursAgo(5), resolvedAt: null, resolutionNote: 'Waterproofing applied to ceiling. Monitor during next rain.', resolutionRound: 1, isActive: true, confirmationWindowStart: hoursAgo(5), createdAt: hoursAgo(20), updatedAt: hoursAgo(5) },
  // Resolved (confirmed by students)
  { id: 'c-11', title: 'Almirah lock broken Room 220', description: 'The lock on my almirah is jammed. Cannot secure belongings.', category: Category.FURNITURE, priority: Priority.NORMAL, status: ComplaintStatus.RESOLVED, submitterId: 'student-11', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursAgo(10), promotedAt: null, markedResolvedAt: hoursAgo(30), resolvedAt: hoursAgo(20), resolutionNote: 'Lock replaced with new one.', resolutionRound: 1, isActive: false, confirmationWindowStart: hoursAgo(28), createdAt: hoursAgo(82), updatedAt: hoursAgo(20) },
  { id: 'c-12', title: 'Dirty water from tap Room 305', description: 'Brown/yellow water coming from the bathroom tap. Unfit for use.', category: Category.PLUMBING, priority: Priority.EMERGENCY, status: ComplaintStatus.RESOLVED, submitterId: 'student-12', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursAgo(5), promotedAt: null, markedResolvedAt: hoursAgo(15), resolvedAt: hoursAgo(10), resolutionNote: 'Pipeline flushed and filter replaced.', resolutionRound: 1, isActive: false, confirmationWindowStart: hoursAgo(14), createdAt: hoursAgo(39), updatedAt: hoursAgo(10) },
  // Reopened
  { id: 'c-13', title: 'AC not cooling Room 415', description: 'AC is running but not cooling. Room temperature remains high.', category: Category.ELECTRICAL, priority: Priority.NORMAL, status: ComplaintStatus.REOPENED, submitterId: 'student-13', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(40), promotedAt: null, markedResolvedAt: hoursAgo(20), resolvedAt: null, resolutionNote: 'Gas refilled.', resolutionRound: 2, isActive: true, confirmationWindowStart: hoursAgo(18), createdAt: hoursAgo(80), updatedAt: hoursAgo(12) },
  // Closed
  { id: 'c-14', title: 'Study table wobbly Room 118', description: 'One leg of the study table is shorter, table wobbles.', category: Category.FURNITURE, priority: Priority.NORMAL, status: ComplaintStatus.CLOSED, submitterId: 'student-14', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursAgo(48), promotedAt: null, markedResolvedAt: hoursAgo(70), resolvedAt: hoursAgo(60), resolutionNote: 'Legs leveled and stabilized.', resolutionRound: 1, isActive: false, confirmationWindowStart: hoursAgo(68), createdAt: hoursAgo(120), updatedAt: hoursAgo(60) },
  // Rejected
  { id: 'c-15', title: 'Want new curtains for Room 201', description: 'The curtains are old, would like new ones.', category: Category.FURNITURE, priority: Priority.NORMAL, status: ComplaintStatus.REJECTED, submitterId: 'student-15', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursAgo(20), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: 'Curtains are in usable condition. Replacement not justified.', resolutionRound: 1, isActive: false, confirmationWindowStart: null, createdAt: hoursAgo(92), updatedAt: hoursAgo(88) },
  // Overdue complaints
  { id: 'c-16', title: 'Drain blocked in bathroom Room 302', description: 'Water not draining. Bathroom flooding.', category: Category.PLUMBING, priority: Priority.EMERGENCY, status: ComplaintStatus.IN_PROGRESS, submitterId: 'student-1', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursAgo(3), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(27), updatedAt: hoursAgo(20) },
  { id: 'c-17', title: 'Exposed wiring in corridor floor 4', description: 'Electrical wiring hanging loose near room 420. Safety hazard.', category: Category.ELECTRICAL, priority: Priority.EMERGENCY, status: ComplaintStatus.ACKNOWLEDGED, submitterId: 'student-2', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursAgo(5), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(29), updatedAt: hoursAgo(26) },
  // More normal complaints with various statuses
  { id: 'c-18', title: 'Dust and debris in staircase', description: 'Staircase between floor 2 and 3 has not been cleaned in a week.', category: Category.CLEANLINESS, priority: Priority.NORMAL, status: ComplaintStatus.SUBMITTED, submitterId: 'student-3', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(50), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(22), updatedAt: hoursAgo(22) },
  { id: 'c-19', title: 'Broken window latch Room 412', description: 'Window cannot be secured. Latch mechanism is broken.', category: Category.FURNITURE, priority: Priority.NORMAL, status: ComplaintStatus.IN_PROGRESS, submitterId: 'student-4', hostelId: HOSTEL_ID, assignedWardenId: 'warden-1', deadlineAt: hoursFromNow(30), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(42), updatedAt: hoursAgo(35) },
  { id: 'c-20', title: 'Garbage not collected for 3 days', description: 'Garbage bins on floor 1 overflowing. Foul smell.', category: Category.CLEANLINESS, priority: Priority.NORMAL, status: ComplaintStatus.ACKNOWLEDGED, submitterId: 'student-5', hostelId: HOSTEL_ID, assignedWardenId: 'warden-2', deadlineAt: hoursFromNow(15), promotedAt: null, markedResolvedAt: null, resolvedAt: null, resolutionNote: null, resolutionRound: 1, isActive: true, confirmationWindowStart: null, createdAt: hoursAgo(57), updatedAt: hoursAgo(50) },
];

// Generate remaining complaints to reach ~40
const moreComplaints: Complaint[] = Array.from({ length: 20 }, (_, i) => {
  const idx = i + 21;
  const statuses = [ComplaintStatus.SUBMITTED, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.MARKED_RESOLVED, ComplaintStatus.RESOLVED];
  const categories = [Category.PLUMBING, Category.ELECTRICAL, Category.CLEANLINESS, Category.FURNITURE, Category.INTERNET, Category.OTHER];
  const status = statuses[i % statuses.length];
  const cat = categories[i % categories.length];
  const isActive = status !== ComplaintStatus.RESOLVED && status !== ComplaintStatus.CLOSED && status !== ComplaintStatus.REJECTED;
  const studentNum = (i % 15) + 1;
  const wardenId = i % 2 === 0 ? 'warden-1' : 'warden-2';
  const createdHours = 10 + i * 5;

  return {
    id: `c-${idx}`,
    title: `Maintenance issue #${idx} - ${cat.toLowerCase()}`,
    description: `Detailed description of maintenance issue number ${idx} in the hostel. This requires attention.`,
    category: cat,
    priority: i % 5 === 0 ? Priority.EMERGENCY : Priority.NORMAL,
    status,
    submitterId: `student-${studentNum}`,
    hostelId: HOSTEL_ID,
    assignedWardenId: wardenId,
    deadlineAt: status === ComplaintStatus.RESOLVED ? hoursAgo(i * 2) : hoursFromNow(72 - i * 3),
    promotedAt: null,
    markedResolvedAt: status === ComplaintStatus.MARKED_RESOLVED || status === ComplaintStatus.RESOLVED ? hoursAgo(i) : null,
    resolvedAt: status === ComplaintStatus.RESOLVED ? hoursAgo(i - 1) : null,
    resolutionNote: status === ComplaintStatus.RESOLVED || status === ComplaintStatus.MARKED_RESOLVED ? 'Issue addressed and fixed.' : null,
    resolutionRound: 1,
    isActive,
    confirmationWindowStart: status === ComplaintStatus.MARKED_RESOLVED ? hoursAgo(i) : null,
    createdAt: hoursAgo(createdHours),
    updatedAt: hoursAgo(createdHours - 5),
  };
});

// Upvotes - some complaints have many votes (for promotion demo)
const upvotes: Upvote[] = [
  // c-1 has 8 upvotes (close to promotion)
  ...Array.from({ length: 8 }, (_, i) => ({ id: uuid(), complaintId: 'c-1', userId: `student-${i + 3}`, createdAt: hoursAgo(20 - i) })),
  // c-6 has 12 upvotes (promoted)
  ...Array.from({ length: 12 }, (_, i) => ({ id: uuid(), complaintId: 'c-6', userId: `student-${(i % 15) + 1}`, createdAt: hoursAgo(40 - i) })),
  // c-18 has 5 upvotes
  ...Array.from({ length: 5 }, (_, i) => ({ id: uuid(), complaintId: 'c-18', userId: `student-${i + 6}`, createdAt: hoursAgo(15 - i) })),
  // c-20 has 10 upvotes (should be promoted)
  ...Array.from({ length: 10 }, (_, i) => ({ id: uuid(), complaintId: 'c-20', userId: `student-${(i % 15) + 1}`, createdAt: hoursAgo(50 - i) })),
  // Some scattered votes
  { id: uuid(), complaintId: 'c-2', userId: 'student-5', createdAt: hoursAgo(10) },
  { id: uuid(), complaintId: 'c-2', userId: 'student-6', createdAt: hoursAgo(9) },
  { id: uuid(), complaintId: 'c-3', userId: 'student-7', createdAt: hoursAgo(8) },
  { id: uuid(), complaintId: 'c-7', userId: 'student-10', createdAt: hoursAgo(30) },
];

// Resolution votes
const resolutionVotes: ResolutionVote[] = [
  // c-9 has 2 solved votes (not yet threshold)
  { id: uuid(), complaintId: 'c-9', userId: 'student-10', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(1) },
  { id: uuid(), complaintId: 'c-9', userId: 'student-11', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(0.5) },
  // c-11 had 3 solved votes (resolved)
  { id: uuid(), complaintId: 'c-11', userId: 'student-12', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(25) },
  { id: uuid(), complaintId: 'c-11', userId: 'student-13', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(24) },
  { id: uuid(), complaintId: 'c-11', userId: 'student-14', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(23) },
  // c-12 had 3 solved votes
  { id: uuid(), complaintId: 'c-12', userId: 'student-1', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(13) },
  { id: uuid(), complaintId: 'c-12', userId: 'student-2', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(12) },
  { id: uuid(), complaintId: 'c-12', userId: 'student-3', voteType: VoteType.SOLVED, round: 1, createdAt: hoursAgo(11) },
  // c-13 had not_solved votes (reopened)
  { id: uuid(), complaintId: 'c-13', userId: 'student-14', voteType: VoteType.NOT_SOLVED, round: 1, createdAt: hoursAgo(16) },
  { id: uuid(), complaintId: 'c-13', userId: 'student-15', voteType: VoteType.NOT_SOLVED, round: 1, createdAt: hoursAgo(15) },
  { id: uuid(), complaintId: 'c-13', userId: 'student-1', voteType: VoteType.NOT_SOLVED, round: 1, createdAt: hoursAgo(14) },
];

// Warden ratings
const wardenRatings: WardenRating[] = [
  { id: uuid(), complaintId: 'c-11', wardenId: 'warden-1', studentId: 'student-11', stars: 3, createdAt: hoursAgo(19) },
  { id: uuid(), complaintId: 'c-12', wardenId: 'warden-2', studentId: 'student-12', stars: 2, createdAt: hoursAgo(9) },
  { id: uuid(), complaintId: 'c-14', wardenId: 'warden-2', studentId: 'student-14', stars: 3, createdAt: hoursAgo(58) },
];

// Penalty events
const penaltyEvents: PenaltyEvent[] = [
  { id: uuid(), complaintId: 'c-17', wardenId: 'warden-2', deadlineType: Priority.EMERGENCY, deadlineAt: hoursAgo(5), createdAt: hoursAgo(5) },
];

// Notifications
const notifications: Notification[] = [
  { id: uuid(), userId: 'student-1', message: 'Your complaint "Leaking tap in Room 204" has been submitted.', read: true, createdAt: hoursAgo(24) },
  { id: uuid(), userId: 'student-9', message: 'Your complaint "Power socket loose" has been marked resolved. Please confirm.', read: false, createdAt: hoursAgo(2) },
  { id: uuid(), userId: 'student-10', message: 'Your complaint "Water seepage" has been marked resolved. Please confirm.', read: false, createdAt: hoursAgo(5) },
  { id: uuid(), userId: 'warden-1', message: 'New complaint: "Leaking tap in Room 204" assigned to you.', read: false, createdAt: hoursAgo(24) },
  { id: uuid(), userId: 'warden-1', message: 'Complaint "Drain blocked" is OVERDUE!', read: false, createdAt: hoursAgo(3) },
  { id: uuid(), userId: 'warden-2', message: 'Penalty applied: Emergency deadline missed for "Exposed wiring".', read: false, createdAt: hoursAgo(5) },
];

// Audit events
const auditEvents: AuditEvent[] = [
  { id: uuid(), actorId: 'student-1', action: 'COMPLAINT_CREATED', entityType: 'Complaint', entityId: 'c-1', before: null, after: { status: 'SUBMITTED', priority: 'NORMAL' }, createdAt: hoursAgo(24) },
  { id: uuid(), actorId: 'warden-1', action: 'STATUS_CHANGED', entityType: 'Complaint', entityId: 'c-5', before: { status: 'SUBMITTED' }, after: { status: 'ACKNOWLEDGED' }, createdAt: hoursAgo(30) },
  { id: uuid(), actorId: 'warden-1', action: 'STATUS_CHANGED', entityType: 'Complaint', entityId: 'c-7', before: { status: 'ACKNOWLEDGED' }, after: { status: 'IN_PROGRESS' }, createdAt: hoursAgo(20) },
  { id: uuid(), actorId: 'warden-1', action: 'STATUS_CHANGED', entityType: 'Complaint', entityId: 'c-9', before: { status: 'IN_PROGRESS' }, after: { status: 'MARKED_RESOLVED' }, createdAt: hoursAgo(2) },
  { id: uuid(), actorId: 'system', action: 'PROMOTED_TO_EMERGENCY', entityType: 'Complaint', entityId: 'c-6', before: { priority: 'NORMAL' }, after: { priority: 'EMERGENCY' }, createdAt: hoursAgo(38) },
];

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

const STORAGE_KEY = 'hmcs-store';

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
    complaints: [...complaints, ...moreComplaints],
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
    complaints: [...complaints, ...moreComplaints],
    upvotes,
    resolutionVotes,
    wardenRatings,
    penaltyEvents,
    notifications,
    auditEvents,
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
