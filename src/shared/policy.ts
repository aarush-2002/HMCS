// HMCS Policy Configuration - Single source of truth for all business numbers
export const POLICY = {
  normalDeadlineHours: 72,
  emergencyDeadlineHours: 24,
  promotionThreshold: 10, // upvotes to promote normal -> emergency
  resolutionVotesRequired: 3,
  confirmationWindowHours: 24,
  normalComplaintsPerDay: 1,
  emergencyComplaintsPerWeek: 1,
  ratingMin: 1,
  ratingMax: 3,
  penaltyStars: -1,
  defaultTimezone: 'Asia/Kolkata',
} as const;
