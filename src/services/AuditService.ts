// AuditService — append-only audit trail for all system changes
// IMPORTANT: The database user for this app should NOT have DELETE privileges on the audit_events table.
// This service provides no update or delete methods — only append.

import { v4 as uuid } from 'uuid';
import { getStore, addAuditEvent as addStoreAudit } from '../store/data';
import type { AuditEvent } from '../shared/types';

export type AuditAction =
  | 'COMPLAINT_CREATED'
  | 'STATUS_CHANGED'
  | 'PRIORITY_CHANGED'
  | 'PROMOTED_TO_EMERGENCY'
  | 'ASSIGNMENT_CHANGED'
  | 'UPVOTE_ADDED'
  | 'UPVOTE_REMOVED'
  | 'RESOLUTION_VOTE_CAST'
  | 'RESOLUTION_VOTE_CHANGED'
  | 'RESOLVED_BY_CONFIRMATION'
  | 'REOPENED_BY_VOTES'
  | 'RETURNED_TO_IN_PROGRESS'
  | 'RATING_SUBMITTED'
  | 'RATING_FLAGGED'
  | 'PENALTY_APPLIED'
  | 'PENALTY_VOIDED'
  | 'COMPLAINT_REJECTED'
  | 'COMPLAINT_MERGED'
  | 'COMPLAINT_RECLASSIFIED'
  | 'USER_CREATED'
  | 'USER_DEACTIVATED'
  | 'USER_ROLE_CHANGED'
  | 'PASSWORD_RESET'
  | 'HOSTEL_CREATED'
  | 'WARDEN_ASSIGNED'
  | 'POLICY_CHANGED';

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: 'Complaint' | 'User' | 'Hostel' | 'Policy' | 'Rating' | 'Penalty' | 'Upvote' | 'ResolutionVote';
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason?: string;
  metadata?: Record<string, unknown>;
}

class AuditServiceClass {
  /**
   * Append a new audit event. This is the ONLY way to modify the audit log.
   * No update or delete methods exist by design.
   */
  log(entry: AuditEntry): string {
    const id = uuid();
    addStoreAudit({
      id,
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before,
      after: entry.after,
      createdAt: new Date().toISOString(),
      reason: entry.reason,
      metadata: entry.metadata,
    } as AuditEvent & { reason?: string; metadata?: Record<string, unknown> });
    return id;
  }

  /**
   * Get all audit events for a specific entity
   */
  getForEntity(entityId: string): AuditEvent[] {
    const store = getStore();
    return store.auditEvents
      .filter(e => e.entityId === entityId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  /**
   * Get all audit events by a specific actor
   */
  getForActor(actorId: string): AuditEvent[] {
    const store = getStore();
    return store.auditEvents
      .filter(e => e.actorId === actorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get recent audit events (for admin dashboard)
   */
  getRecent(limit: number = 100): AuditEvent[] {
    const store = getStore();
    return store.auditEvents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Search audit events
   */
  search(query: {
    actorId?: string;
    action?: AuditAction;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
  }): AuditEvent[] {
    const store = getStore();
    let events = [...store.auditEvents];

    if (query.actorId) events = events.filter(e => e.actorId === query.actorId);
    if (query.action) events = events.filter(e => e.action === query.action);
    if (query.entityType) events = events.filter(e => e.entityType === query.entityType);
    if (query.entityId) events = events.filter(e => e.entityId === query.entityId);
    if (query.from) events = events.filter(e => new Date(e.createdAt) >= new Date(query.from!));
    if (query.to) events = events.filter(e => new Date(e.createdAt) <= new Date(query.to!));

    return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

// Singleton
export const AuditService = new AuditServiceClass();
