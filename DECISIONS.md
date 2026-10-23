# HMCS — Key Design Decisions

This document records the policy defaults and design decisions made for the HMCS MVP implementation.

## Resolved Decisions

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
| Students 1-15 | student1@hmcs.edu ... student15@hmcs.edu | student123 |
