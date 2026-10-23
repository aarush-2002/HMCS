# HMCS Security Documentation

## Endpoint Security Matrix

| Endpoint | Auth | Role Check | Hostel Scope | Validation | Rate Limit | Pagination |
|----------|------|------------|--------------|------------|------------|------------|
| POST /api/auth/student/login | ❌ | ✅ (student only) | N/A | ✅ Zod | ✅ 5/min | N/A |
| POST /api/auth/warden/login | ❌ | ✅ (warden only) | N/A | ✅ Zod | ✅ 5/min | N/A |
| POST /api/auth/admin/login | ❌ | ✅ (admin only) | N/A | ✅ Zod | ✅ 5/min | N/A |
| GET /api/complaints/feed | ✅ | ✅ (student) | ✅ | ✅ | ✅ 60/min | ✅ Cursor |
| GET /api/complaints/mine | ✅ | ✅ (student) | ✅ | ✅ | ✅ 60/min | ✅ Cursor |
| GET /api/complaints/:id | ✅ | ✅ (student/warden) | ✅ | ✅ | ✅ 60/min | N/A |
| POST /api/complaints | ✅ | ✅ (student) | ✅ | ✅ Zod + Magic bytes | ✅ 10/min | N/A |
| POST /api/complaints/:id/upvote | ✅ | ✅ (student) | ✅ | ✅ | ✅ 30/min | N/A |
| DELETE /api/complaints/:id/upvote | ✅ | ✅ (student) | ✅ | ✅ | ✅ 30/min | N/A |
| POST /api/complaints/:id/resolution-vote | ✅ | ✅ (student) | ✅ | ✅ Zod | ✅ 10/min | N/A |
| POST /api/complaints/:id/rating | ✅ | ✅ (student, complainant only) | ✅ | ✅ Zod + CHECK 1-3 | ✅ 5/min | N/A |
| GET /api/warden/complaints | ✅ | ✅ (warden) | ✅ | ✅ | ✅ 60/min | ✅ Cursor |
| PATCH /api/warden/complaints/:id/status | ✅ | ✅ (warden) | ✅ | ✅ Zod + transition map | ✅ 30/min | N/A |
| GET /api/notifications | ✅ | ✅ (any) | ✅ | ✅ | ✅ 60/min | ✅ Cursor |
| GET /api/notifications/unread-count | ✅ | ✅ (any) | ✅ | ✅ | ✅ 60/min | N/A |
| PATCH /api/notifications/:id/read | ✅ | ✅ (any) | ✅ | ✅ | ✅ 60/min | N/A |
| POST /api/notifications/read-all | ✅ | ✅ (any) | ✅ | ✅ | ✅ 10/min | N/A |
| GET /api/admin/users | ✅ | ✅ (admin) | N/A | ✅ | ✅ 60/min | ✅ Cursor |
| POST /api/admin/users | ✅ | ✅ (admin) | N/A | ✅ Zod | ✅ 10/min | N/A |
| PATCH /api/admin/users/:id | ✅ | ✅ (admin) | N/A | ✅ Zod | ✅ 10/min | N/A |
| POST /api/admin/users/import-csv | ✅ | ✅ (admin) | N/A | ✅ Zod + CSV validation | ✅ 5/min | N/A |
| GET /api/admin/audit | ✅ | ✅ (admin) | N/A | ✅ | ✅ 60/min | ✅ Cursor |
| GET /api/photos/:id | ✅ | ✅ (authorized users) | ✅ | ✅ | ✅ 60/min | N/A |
| GET /api/health | ❌ | ❌ | ❌ | ❌ | ✅ 100/min | N/A |

## Security Controls

### Authentication
- Email + password with bcrypt (cost factor 12)
- JWT access tokens (15 min) + refresh tokens (7 days) in httpOnly, Secure, SameSite=Strict cookies
- No tokens in localStorage (XSS-resistant)
- Rate limiting: 5 failed login attempts → 15 min lockout
- Refresh token rotation (single-use)

### Authorization
- Role-based access control (RBAC) enforced server-side
- Middleware: `requireAuth`, `requireRole`, `requireHostelScope`
- Students cannot access warden/admin routes (403)
- Wardens cannot access admin routes (403)
- Cross-hostel access blocked (403)

### Input Validation
- All endpoints use Zod schemas for request validation
- File uploads: magic byte verification (JPEG/PNG/WebP only)
- File size limit: 5 MB per file, 4 files max
- EXIF data stripped on upload
- Safe random filenames (UUID v4)
- No public file serving — photos served through authorized endpoint only

### CSRF Protection
- SameSite=Strict cookies prevent CSRF
- For state-changing requests, validate Origin/Referer headers
- CSRF token in custom header for non-cookie auth (future-proofing)

### CORS
- Strict origin whitelist from environment variable
- No wildcard (*) in production
- Credentials: true (for cookie auth)
- Allowed methods: GET, POST, PATCH, DELETE, OPTIONS

### Headers (Helmet)
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
})
```

### File Upload Security
- Magic byte verification (not just extension)
- Pixel limit validation (max 4096x4096)
- Re-encoding to strip metadata/EXIF
- Stored with random UUID filenames
- Served through authorized endpoint only (no public folder)
- StorageProvider interface (local disk now, S3-ready)

### Database Security
- Audit events table: no DELETE privilege for app user
- All queries use parameterized statements (Prisma ORM)
- Connection pooling with limits
- Row-level security for hostel scope (future enhancement)

### Rate Limiting
- express-rate-limit middleware
- Per-IP and per-user limits
- Separate limits for auth endpoints (stricter)
- 429 Too Many Requests response with Retry-After header

### Monitoring & Logging
- All auth attempts logged (success/failure)
- All state changes logged to audit_events
- Error tracking with Sentry (production)
- Health check endpoint for load balancers

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- All interactive elements focusable
- Visible focus indicators (2px teal outline)
- Tab order follows visual layout
- Escape closes modals/drawers
- Enter/Space activates buttons

### Screen Readers
- Semantic HTML (nav, main, article, section)
- ARIA labels for icon-only buttons
- ARIA roles for custom widgets (tabs, dialogs)
- Live regions for dynamic content (toasts)
- Alt text for images

### Color & Contrast
- All text meets 4.5:1 contrast ratio (AA)
- Large text (18px+) meets 3:1 contrast ratio
- Status/priority badges include text + icon (never color alone)
- Focus indicators visible in high-contrast mode

### Motion
- Respects `prefers-reduced-motion`
- No auto-playing animations
- Transitions can be disabled

### Responsive Design
- Mobile-first (360px minimum)
- Touch targets ≥ 44x44px
- No horizontal scroll at any breakpoint
- Text can be resized to 200% without breaking layout

## Security Checklist

- [x] Authentication with bcrypt + JWT
- [x] Role-based access control
- [x] Hostel scope enforcement
- [x] Input validation (Zod)
- [x] File upload security (magic bytes, EXIF strip)
- [x] CSRF protection (SameSite cookies)
- [x] CORS strict whitelist
- [x] Security headers (Helmet)
- [x] Rate limiting
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React + CSP)
- [x] Audit logging (append-only)
- [x] Error handling (no stack traces in production)
- [x] HTTPS enforced (HSTS)
- [x] Accessibility (WCAG 2.1 AA)
