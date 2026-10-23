# HMCS — Key Design Decisions

This document records the policy defaults and design decisions made for the HMCS MVP implementation.

## Resolved Decisions

### 0. Penalty Score Separation
**Decision:** Deadline penalties (−1 point each) are tracked as a SEPARATE score from the student star-rating average.
- Star ratings: 1-3 stars, averaged per warden, shown as "X.X/3.0"
- Penalty points: Count of missed deadlines, shown separately
- The two scores are never combined or subtracted from each other
- The warden performance page shows both with plain-language explanations

### 0b. Penalty Idempotency
**Decision:** The penalty scheduler is idempotent. A penalty is uniquely identified by (complaintId, deadlineType, deadlineAt). Running the scheduler multiple times or on multiple instances produces exactly one penalty per qualifying event.

### 0c. Promotion and Penalties
**Decision:** A penalty issued for a normal deadline stays on record even after promotion to emergency. The new 24h emergency deadline can create its own separate penalty if missed. This means a single complaint can have at most 2 penalties (one for normal, one for emergency).

### 1. Day/Week Definition
**Decision:** Calendar day/week in the hostel's configured timezone (Asia/Kolkata).
- "Day" resets at midnight local time.
- "Week" resets at the start of Sunday (local time).

### 2. Promoted Complaint & Emergency Allowance
**Decision:** A promoted normal complaint does NOT consume the student's emergency allowance.
- Promotion is a system action triggered by community voting, not a student choice.
- The student's weekly emergency limit remains independent.

### 3. Emergency Deadline After Promotion
**Decision:** The 24-hour emergency deadline starts from the promotion timestamp, NOT from the original submission time.
- This is fair because the complaint only became "emergency" when the community signaled urgency.

### 4. What Counts as "Solved" for Deadline Penalty
**Decision:** The warden marking the complaint as "Marked Resolved" ends the service deadline.
- Student confirmation is tracked separately as a quality signal.
- The penalty applies if the warden doesn't mark resolved within the deadline.

### 5. Penalty Score vs Star Rating
**Decision:** Deadline penalties (−1 star each) are tracked as a separate score from the student star-rating average.
- Student ratings: 1-3 stars, averaged per warden.
- Penalties: Count of missed deadlines, each worth −1 star.
- Both are visible on the warden's performance page.

### 6. Complainant Identity
**Decision:** The complainant's identity is hidden from other students by default.
- Students see "Anonymous" or "You" (for their own complaints).
- Wardens and admins can see the submitter's identity for follow-up.

### 7. Resolution Window Expiry
**Decision:** If 3 "solved" votes are not received within the 24-hour confirmation window, the complaint returns to "In Progress" for warden review.
- This prevents complaints from being stuck in limbo.
- The warden can then take further action or re-mark as resolved for a new round.

### 8. "Not Solved" Votes
**Decision:** If a majority of resolution votes are "Not Solved" (more not-solved than solved), the complaint is automatically reopened.
- The resolution round counter increments.
- The warden is notified to re-examine the issue.

### 9. Upvote & Resolution Vote Eligibility
**Decision:** All authenticated students in the same hostel can upvote and confirm resolution.
- One vote per student per complaint (enforced by unique constraint).
- Students cannot upvote their own complaint.

### 10. Complaint Removal
**Decision:** "Removed" means hidden from the active feed but retained in full history.
- Complaints with status RESOLVED or CLOSED are not shown in the active list.
- All data, audit events, and history remain accessible.

## Policy Configuration

All business numbers are centralized in `/src/shared/policy.ts`:

| Parameter | Value |
|---|---|
| Normal complaint deadline | 72 hours |
| Emergency complaint deadline | 24 hours |
| Promotion threshold (upvotes) | 10 |
| Resolution votes required | 3 |
| Confirmation window | 24 hours |
| Normal complaints per student per day | 1 |
| Emergency complaints per student per week | 1 |
| Rating scale | 1-3 stars |
| Deadline penalty | −1 star |
| Default timezone | Asia/Kolkata |

## Seeded Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@hmcs.edu | admin123 |
| Warden 1 | warden1@hmcs.edu | warden123 |
| Warden 2 | warden2@hmcs.edu | warden123 |
| Students 1-50 | student1@hmcs.edu ... student50@hmcs.edu | student123 |

## Open Decisions (PRD §14) — Status

The following decisions from the original PRD remain open for pilot review:

| # | Decision | Current Default | Pilot Action Needed |
|---|---|---|---|
| 1 | What counts as a day or week? | Calendar day/week in hostel timezone | Validate with actual usage patterns |
| 2 | Does promoted complaint consume emergency allowance? | No | Monitor for gaming |
| 3 | When does 24h emergency deadline start after promotion? | From promotion timestamp | Confirm fairness with wardens |
| 4 | What counts as "solved" for deadline penalty? | Warden marks resolved | Review with student body |
| 5 | How is −1 star penalty represented alongside 1-3 star rating? | Separate score | Confirm clarity with wardens |
| 6 | Who can upvote and confirm resolution? | All hostel students | Monitor for noise |
| 7 | What happens if 3 "solved" votes not received in 24h? | Returns to In Progress | Review frequency |
| 8 | What happens when students vote "not solved"? | 3 votes → Reopened | Review threshold |
| 9 | Can wardens reject/merge/reclassify complaints? | Admin only | Consider warden powers |
| 10 | Can complaints be reassigned between wardens? | Admin only | Define deadline ownership |
| 11 | Are complaints/ratings anonymous to other students? | Yes (hidden by default) | Confirm with privacy team |
| 12 | Authentication method? | Email + password | Consider SSO for institution |
| 13 | Notification channels? | In-app only | Add email/SMS for critical |
| 14 | Photo formats, size limits, retention? | JPEG/PNG/WebP, 5MB, indefinite | Define retention policy |
| 15 | Does "removed" mean hidden or deleted? | Hidden from active feed, retained in history | Confirm with legal |

## Recommended Next Steps for Pilot

1. **Week 1-2**: Deploy to staging with 1 hostel, 2 wardens, 50 students
2. **Week 3-4**: Collect feedback on UX, identify pain points
3. **Week 5-6**: Address critical bugs, adjust policies based on data
4. **Week 7-8**: Expand to 2-3 hostels, monitor at scale
5. **Week 9-12**: Full rollout with monitoring and support

### Success Metrics for Pilot
- >80% of complaints acknowledged within 24 hours
- >60% of normal complaints resolved within 72 hours
- >80% of emergency complaints resolved within 24 hours
- >70% of resolved complaints receive student confirmation
- Average student rating ≥ 2.0/3.0
- <5% of complaints misclassified or rejected
