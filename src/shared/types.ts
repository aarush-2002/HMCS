import { POLICY } from './policy';

// Enums
export enum Role {
  STUDENT = 'STUDENT',
  WARDEN = 'WARDEN',
  ADMIN = 'ADMIN',
}

export enum Priority {
  NORMAL = 'NORMAL',
  EMERGENCY = 'EMERGENCY',
}

export enum Category {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  CLEANLINESS = 'CLEANLINESS',
  FURNITURE = 'FURNITURE',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER',
}

export enum VoteType {
  UPVOTE = 'UPVOTE',
  SOLVED = 'SOLVED',
  NOT_SOLVED = 'NOT_SOLVED',
}

export enum ComplaintStatus {
  SUBMITTED = 'SUBMITTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  MARKED_RESOLVED = 'MARKED_RESOLVED',
  RESOLVED = 'RESOLVED',
  REOPENED = 'REOPENED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  hostelId: string;
  password: string;
}

export interface Hostel {
  id: string;
  name: string;
  building: string;
}

export interface WardenAssignment {
  wardenId: string;
  hostelId: string;
}

export interface ComplaintPhoto {
  id: string;
  url: string;
  complaintId: string;
}

export interface Upvote {
  id: string;
  complaintId: string;
  userId: string;
  createdAt: string;
}

export interface ResolutionVote {
  id: string;
  complaintId: string;
  userId: string;
  voteType: VoteType.SOLVED | VoteType.NOT_SOLVED;
  round: number;
  createdAt: string;
}

export interface WardenRating {
  id: string;
  complaintId: string;
  wardenId: string;
  studentId: string;
  stars: number; // 1-3
  createdAt: string;
}

export interface PenaltyEvent {
  id: string;
  complaintId: string;
  wardenId: string;
  deadlineType: Priority;
  deadlineAt: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ComplaintStatus;
  submitterId: string;
  hostelId: string;
  assignedWardenId: string | null;
  deadlineAt: string;
  promotedAt: string | null;
  markedResolvedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  resolutionRound: number;
  isActive: boolean;
  confirmationWindowStart: string | null;
  confirmationWindowEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

// Helper types
export type ComplaintWithRelations = Complaint & {
  upvotes: Upvote[];
  resolutionVotes: ResolutionVote[];
  photos: ComplaintPhoto[];
  ratings: WardenRating[];
  submitterName: string;
};

// Utility functions
export function calculateDeadline(priority: Priority, fromTime: string): string {
  const hours = priority === Priority.EMERGENCY
    ? POLICY.emergencyDeadlineHours
    : POLICY.normalDeadlineHours;
  const date = new Date(fromTime);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

export function isOverdue(complaint: Complaint): boolean {
  if (complaint.status === ComplaintStatus.RESOLVED || complaint.status === ComplaintStatus.CLOSED) {
    return false;
  }
  return new Date() > new Date(complaint.deadlineAt);
}

export function getTimeRemaining(deadlineAt: string): string {
  const now = new Date();
  const deadline = new Date(deadlineAt);
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) return 'Overdue';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function getStatusColor(status: ComplaintStatus): string {
  const colors: Record<ComplaintStatus, string> = {
    [ComplaintStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
    [ComplaintStatus.ACKNOWLEDGED]: 'bg-indigo-100 text-indigo-800',
    [ComplaintStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [ComplaintStatus.MARKED_RESOLVED]: 'bg-purple-100 text-purple-800',
    [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800',
    [ComplaintStatus.REOPENED]: 'bg-orange-100 text-orange-800',
    [ComplaintStatus.CLOSED]: 'bg-gray-100 text-gray-800',
    [ComplaintStatus.REJECTED]: 'bg-red-100 text-red-800',
  };
  return colors[status];
}

export function getPriorityColor(priority: Priority): string {
  return priority === Priority.EMERGENCY
    ? 'bg-red-100 text-red-800 border-red-200'
    : 'bg-slate-100 text-slate-800 border-slate-200';
}
