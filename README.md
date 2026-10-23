# HMCS — Hostel Management Complaint System

A transparent, accountable system for hostel residents to report problems, for wardens to prioritize and resolve them, and for students to confirm and rate resolution quality.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Features

### For Students
- **Submit complaints** with photos, categories, and priority levels
- **Upvote issues** affecting you — complaints reaching 10 upvotes auto-promote to emergency
- **Track status** in real-time with live countdowns
- **Confirm resolutions** — 3 student votes within 24 hours close the issue
- **Rate wardens** 1-3 stars after resolution

### For Wardens
- **Prioritized queue** with filters, sorting, and overdue alerts
- **Status workflow** with validated transitions and audit trails
- **Performance dashboard** showing ratings, penalties, and on-time rates
- **Resolution management** with confirmation windows and student feedback

### For Administrators
- **User management** with CSV import and role assignment
- **Policy configuration** for deadlines, thresholds, and limits
- **Complaint exceptions** for reclassification, merging, and rejection
- **Score review** with penalty dispute resolution
- **Audit log** — append-only, tamper-proof history

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           React 18 + Vite               │
│      TypeScript + Tailwind CSS          │
│   Lucide Icons + Fraunces/Inter Fonts   │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────▼────┐            ┌────▼────┐
   │ Student │            │ Warden  │
   │Dashboard│            │Dashboard│
   └─────────┘            └─────────┘
        │                       │
        └───────────┬───────────┘
                    │
           ┌────────▼────────┐
           │  Shared Store   │
           │  (localStorage) │
           └─────────────────┘
```

**Note:** This is a frontend-only implementation. For production, see [DEPLOYMENT.md](./DEPLOYMENT.md) for the full-stack architecture with Express, PostgreSQL, and S3.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/hmcs.git
cd hmcs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student1@hmcs.edu | student123 |
| Warden | warden1@hmcs.edu | warden123 |
| Admin | admin@hmcs.edu | admin123 |

## 📋 Key Workflows

### 1. File a Complaint
1. Log in as a student
2. Click "New Complaint"
3. Fill in title (5-120 chars), description (20-2000 chars), category
4. Select priority: Normal (72h deadline) or Emergency (24h deadline)
5. Optionally attach photos (up to 4, max 5MB each)
6. Submit — you'll see your complaint ID and deadline

### 2. Upvote & Promotion
1. Browse the hostel feed
2. Click the upvote button on complaints affecting you
3. When a complaint reaches 10 upvotes, it auto-promotes to Emergency
4. The deadline resets to 24 hours from promotion time

### 3. Warden Resolution
1. Log in as a warden
2. View your queue (sorted by deadline, priority, or newest)
3. Click a complaint to see details
4. Update status: Acknowledged → In Progress → Marked Resolved
5. Add a resolution note (min 10 chars)
6. A 24-hour confirmation window opens for students

### 4. Student Confirmation
1. When a complaint is marked resolved, students see a confirmation card
2. Vote "Yes, fixed" or "No, still a problem"
3. If 3 students vote "Solved" within 24 hours → complaint is RESOLVED
4. If 3 students vote "Not Solved" → complaint is REOPENED
5. If neither threshold is met → returns to In Progress

### 5. Rating & Accountability
1. After resolution, the original complainant can rate the warden (1-3 stars)
2. Ratings are anonymous to wardens
3. Missed deadlines trigger −1 penalty points (separate from star rating)
4. Wardens see their performance: average rating, penalties, on-time %

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

See [TESTING.md](./TESTING.md) for detailed test coverage and acceptance criteria.

## 📚 Documentation

- **[SECURITY.md](./SECURITY.md)** — Endpoint security matrix, hardening measures, accessibility
- **[TESTING.md](./TESTING.md)** — Test commands, coverage report, acceptance criteria
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Docker setup, deployment guides, backups, monitoring
- **[DECISIONS.md](./DECISIONS.md)** — Design decisions and policy defaults

## 🐳 Docker

```bash
# Build and run with Docker Compose
docker compose up

# Build only
docker compose build

# Run in background
docker compose up -d

# View logs
docker compose logs -f
```

Access the app at [http://localhost:3000](http://localhost:3000)

## 🔧 Tech Stack

### Frontend
- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Tailwind CSS 4** — Styling
- **React Router 6** — Routing
- **Lucide React** — Icons
- **date-fns** — Date formatting
- **uuid** — Unique IDs

### Design System
- **Fonts**: Fraunces (headings) + Inter (body)
- **Palette**: Stone neutrals + Teal accent (#0f766e)
- **Components**: 17 reusable UI components
- **Accessibility**: WCAG 2.1 AA compliant

### Backend (Production)
- **Node.js 20** — Runtime
- **Express** — API framework
- **Prisma** — ORM
- **PostgreSQL 15** — Database
- **Zod** — Validation
- **JWT** — Authentication
- **S3** — Photo storage

## 📊 Business Rules

| Rule | Value |
|------|-------|
| Normal complaint deadline | 72 hours |
| Emergency complaint deadline | 24 hours |
| Promotion threshold | 10 upvotes |
| Resolution votes required | 3 |
| Confirmation window | 24 hours |
| Normal complaints per day | 1 per student |
| Emergency complaints per week | 1 per student |
| Rating scale | 1-3 stars |
| Missed deadline penalty | −1 point |

## 🎨 Design Principles

1. **Calm & Institutional** — Not flashy, not generic AI-generated
2. **Restrained Palette** — Stone neutrals with one distinctive teal accent
3. **Characterful Typography** — Fraunces serif for headings, Inter for body
4. **Generous Whitespace** — Breathing room, not cramped
5. **Subtle Borders** — Not heavy shadows
6. **Text + Icon** — Status and priority never rely on color alone
7. **Mobile-First** — Usable from 360px width
8. **Accessible** — WCAG AA, keyboard navigation, screen readers

## 🚢 Deployment

### Render.com
1. Create PostgreSQL database
2. Deploy server (auto-migrations on startup)
3. Deploy client (static site)
4. Configure scheduler (cron job)

### Railway.app
1. Add PostgreSQL service
2. Deploy server with environment variables
3. Deploy client separately
4. Set up external scheduler

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides.

## 🔒 Security

- ✅ Role-based access control (RBAC)
- ✅ Hostel scope enforcement
- ✅ Input validation (Zod)
- ✅ File upload security (magic bytes, EXIF strip)
- ✅ CSRF protection (SameSite cookies)
- ✅ Rate limiting
- ✅ Audit logging (append-only)
- ✅ HTTPS enforced (HSTS)
- ✅ Accessibility (WCAG 2.1 AA)

See [SECURITY.md](./SECURITY.md) for the complete security matrix.

## 📈 Performance

- **Code splitting** — Lazy-loaded routes
- **Image optimization** — WebP, lazy loading
- **Database indexes** — Optimized queries
- **Pagination** — Cursor-based on all lists
- **Caching** — Redis-ready (future enhancement)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow
```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run typecheck
```

## 📝 License

MIT License — see LICENSE file for details

## 🙏 Acknowledgments

- **Font**: Fraunces by Sterling, Inter by Rasmus Andersson
- **Icons**: Lucide React
- **Design Inspiration**: Institutional design systems, government portals

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Email: support@hmcs.edu
- Documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Built with care for hostel communities everywhere.** 🏠
