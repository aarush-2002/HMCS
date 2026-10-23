// NotificationService — single dispatch point for all system events
// Uses a channel interface; InAppChannel is implemented, others are documented stubs.

import { v4 as uuid } from 'uuid';
import { getStore, addNotification as addStoreNotification, getUserById } from '../store/data';
import type { Notification } from '../shared/types';

// ─── Channel Interface ─────────────────────────────────────────────────────────
export interface NotificationChannel {
  send(userId: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
}

// ─── In-App Channel (implemented) ──────────────────────────────────────────────
class InAppChannel implements NotificationChannel {
  async send(userId: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    addStoreNotification({
      id: uuid(),
      userId,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      metadata,
    } as Notification & { metadata?: Record<string, unknown> });
  }
}

// ─── Email Channel (stub — documented) ─────────────────────────────────────────
class EmailChannel implements NotificationChannel {
  async send(userId: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    // STUB: In production, this would send via SMTP/SendGrid/SES
    // Requires user.email lookup and email template rendering
    // TODO: Implement with transactional email provider
    console.log(`[EmailChannel] To: ${userId}, Message: ${message}`);
  }
}

// ─── SMS Channel (stub — documented) ───────────────────────────────────────────
class SMSChannel implements NotificationChannel {
  async send(userId: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    // STUB: In production, this would send via Twilio/Vonage
    // Requires user.phone lookup and SMS template (160 char limit)
    // Only used for emergency/critical notifications
    console.log(`[SMSChannel] To: ${userId}, Message: ${message}`);
  }
}

// ─── Push Channel (stub — documented) ──────────────────────────────────────────
class PushChannel implements NotificationChannel {
  async send(userId: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
    // STUB: In production, this would send via FCM/APNs/WebPush
    // Requires user.pushToken and service worker registration
    console.log(`[PushChannel] To: ${userId}, Message: ${message}`);
  }
}

// ─── Event Types ───────────────────────────────────────────────────────────────
export type NotificationEvent =
  | { type: 'COMPLAINT_SUBMITTED'; complaintId: string; wardenIds: string[] }
  | { type: 'COMPLAINT_ACKNOWLEDGED'; complaintId: string; submitterId: string; wardenId: string }
  | { type: 'COMPLAINT_UPDATED'; complaintId: string; submitterId: string; status: string }
  | { type: 'COMPLAINT_PROMOTED'; complaintId: string; submitterId: string; wardenIds: string[] }
  | { type: 'COMPLAINT_MARKED_RESOLVED'; complaintId: string; submitterId: string; wardenId: string }
  | { type: 'CONFIRMATION_WINDOW_OPENED'; complaintId: string; hostelStudentIds: string[] }
  | { type: 'CONFIRMATION_WINDOW_NEARING_EXPIRY'; complaintId: string; hostelStudentIds: string[]; hoursLeft: number }
  | { type: 'CONFIRMATION_WINDOW_ENDED'; complaintId: string; submitterId: string; wardenId: string; result: string }
  | { type: 'COMPLAINT_RESOLVED'; complaintId: string; submitterId: string; wardenId: string }
  | { type: 'COMPLAINT_REOPENED'; complaintId: string; submitterId: string; wardenId: string }
  | { type: 'COMPLAINT_REJECTED'; complaintId: string; submitterId: string; reason: string }
  | { type: 'COMPLAINT_OVERDUE'; complaintId: string; wardenId: string }
  | { type: 'RATING_AVAILABLE'; complaintId: string; submitterId: string }
  | { type: 'RATING_FLAGGED'; ratingId: string; adminIds: string[]; reason: string };

// ─── Notification Service ──────────────────────────────────────────────────────
class NotificationServiceClass {
  private channels: NotificationChannel[];

  constructor() {
    // In production, channels would be configured via env
    // For MVP, only InAppChannel is active
    this.channels = [new InAppChannel()];
    // To enable other channels:
    // this.channels.push(new EmailChannel(), new PushChannel());
  }

  async dispatch(event: NotificationEvent): Promise<void> {
    const store = getStore();
    const recipients: Array<{ userId: string; message: string; metadata?: Record<string, unknown> }> = [];

    switch (event.type) {
      case 'COMPLAINT_SUBMITTED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        for (const wardenId of event.wardenIds) {
          recipients.push({
            userId: wardenId,
            message: `New complaint: "${complaint.title}" assigned to you.`,
            metadata: { complaintId: event.complaintId },
          });
        }
        break;
      }

      case 'COMPLAINT_ACKNOWLEDGED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Your complaint "${complaint.title}" has been acknowledged.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_UPDATED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Your complaint "${complaint.title}" status updated to ${event.status}.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_PROMOTED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `🚨 Your complaint "${complaint.title}" has been promoted to EMERGENCY!`,
          metadata: { complaintId: event.complaintId },
        });
        for (const wardenId of event.wardenIds) {
          recipients.push({
            userId: wardenId,
            message: `🚨 Complaint "${complaint.title}" promoted to EMERGENCY. 24h deadline.`,
            metadata: { complaintId: event.complaintId },
          });
        }
        break;
      }

      case 'COMPLAINT_MARKED_RESOLVED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Your complaint "${complaint.title}" has been marked resolved. Please confirm within 24 hours.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'CONFIRMATION_WINDOW_OPENED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        for (const studentId of event.hostelStudentIds) {
          if (studentId === complaint.submitterId) continue; // Submitter gets separate notification
          recipients.push({
            userId: studentId,
            message: `Complaint "${complaint.title}" marked resolved. Please confirm if fixed.`,
            metadata: { complaintId: event.complaintId },
          });
        }
        break;
      }

      case 'CONFIRMATION_WINDOW_NEARING_EXPIRY': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        for (const studentId of event.hostelStudentIds) {
          recipients.push({
            userId: studentId,
            message: `⏰ Confirmation window for "${complaint.title}" closes in ${event.hoursLeft} hours.`,
            metadata: { complaintId: event.complaintId },
          });
        }
        break;
      }

      case 'CONFIRMATION_WINDOW_ENDED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Confirmation window for "${complaint.title}" ended. Result: ${event.result}.`,
          metadata: { complaintId: event.complaintId },
        });
        recipients.push({
          userId: event.wardenId,
          message: `Confirmation window for "${complaint.title}" ended. Result: ${event.result}.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_RESOLVED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `✅ Your complaint "${complaint.title}" has been confirmed resolved!`,
          metadata: { complaintId: event.complaintId },
        });
        recipients.push({
          userId: event.wardenId,
          message: `✅ Complaint "${complaint.title}" confirmed resolved by students.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_REOPENED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Your complaint "${complaint.title}" has been reopened.`,
          metadata: { complaintId: event.complaintId },
        });
        recipients.push({
          userId: event.wardenId,
          message: `Complaint "${complaint.title}" reopened by students. Please review.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_REJECTED': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Your complaint "${complaint.title}" has been rejected. Reason: ${event.reason}`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'COMPLAINT_OVERDUE': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.wardenId,
          message: `⚠️ Complaint "${complaint.title}" is overdue. Penalty applied.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'RATING_AVAILABLE': {
        const complaint = store.complaints.find(c => c.id === event.complaintId);
        if (!complaint) return;
        recipients.push({
          userId: event.submitterId,
          message: `Please rate how "${complaint.title}" was handled.`,
          metadata: { complaintId: event.complaintId },
        });
        break;
      }

      case 'RATING_FLAGGED': {
        for (const adminId of event.adminIds) {
          recipients.push({
            userId: adminId,
            message: `A rating has been flagged for review. Reason: ${event.reason}`,
            metadata: { ratingId: event.ratingId },
          });
        }
        break;
      }
    }

    // Dispatch to all channels
    for (const recipient of recipients) {
      for (const channel of this.channels) {
        await channel.send(recipient.userId, recipient.message, recipient.metadata);
      }
    }
  }
}

// Singleton instance
export const NotificationService = new NotificationServiceClass();

// ─── Notification Queries ──────────────────────────────────────────────────────
export function getUnreadCount(userId: string): number {
  const store = getStore();
  return store.notifications.filter(n => n.userId === userId && !n.read).length;
}

export function getNotificationsGroupedByDay(userId: string): Record<string, Notification[]> {
  const store = getStore();
  const userNotifications = store.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const grouped: Record<string, Notification[]> = {};
  for (const notification of userNotifications) {
    const date = new Date(notification.createdAt).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(notification);
  }
  return grouped;
}

export function markAllRead(userId: string): void {
  const store = getStore();
  store.notifications = store.notifications.map(n =>
    n.userId === userId ? { ...n, read: true } : n
  );
  localStorage.setItem('hmcs-store-v3', JSON.stringify(store));
}
