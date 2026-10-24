# HMCS Frontend - Developer Quick Reference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run Playwright tests
npm run test:e2e
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Design system components
│   ├── Shell.tsx       # Student layout
│   ├── WardenShell.tsx # Warden layout
│   ├── AdminShell.tsx  # Admin layout
│   └── ...
├── pages/              # Route pages
│   ├── Landing.tsx     # Landing page
│   ├── Feed.tsx        # Student feed
│   ├── WardenQueue.tsx # Warden queue
│   └── ...
├── world/              # 3D world runtime
│   ├── runtime.ts      # Main runtime
│   ├── scene.ts        # Hostel scene
│   └── ...
├── shared/             # Shared types and constants
├── store/              # Data store
├── context/            # React context
└── styles/             # CSS and tokens
```

## 🎨 Design System

### Colors
```css
--ink: #05070a          /* Background */
--bone: #dfe7e0         /* Primary text */
--bone-dim: #aab4ad     /* Secondary text */
--muted: #8a958e        /* Tertiary text */
--ember: #f5a524        /* Primary accent */
--emergency: #e5484d    /* Error/emergency */
--resolved: #6fcf97     /* Success */
--info: #7fb4c9         /* Information */
```

### Typography
```css
/* Display headings */
.display-xl { font-size: clamp(44px, 7.2vw, 120px); }
.display-lg { font-size: clamp(32px, 5vw, 72px); }
.display-md { font-size: clamp(24px, 3.2vw, 44px); }

/* Eyebrows */
.eyebrow { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; }

/* Body text */
.body { font-size: 15px; line-height: 1.6; }
```

### Components
```tsx
// Button
<Button variant="primary" size="md" loading={false}>
  Click me
</Button>

// Input
<Input label="Email" type="email" value={value} onChange={setValue} />

// Badge
<Badge variant="ember">Status</Badge>

// Card
<Card hover onClick={handleClick}>
  Content
</Card>
```

## 🔑 Key Concepts

### Calm Mode
All application screens use a calm, static background:
- Blurred hostel scene at 12% opacity
- Amber and teal radial glows
- Film grain and vignette
- No live 3D scene (performance)

### World Runtime
Landing page uses live 3D world:
- Three.js with post-processing
- Scroll-driven camera
- Procedural textures
- Performance governor

### Reduced Motion
Users can toggle reduced motion:
- Stored in localStorage
- Applies `.reduce-motion` class
- Disables parallax, cloth, rain, etc.
- Content remains identical

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1440px) { /* Large desktop */ }
```

### Layout Patterns
```tsx
// Mobile: stacked
<div className="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Desktop: side-by-side
<div className="grid md:grid-cols-2 gap-8">
  <div>Left</div>
  <div>Right</div>
</div>
```

## ♿ Accessibility

### Keyboard Navigation
- **Tab**: Move through elements
- **Enter/Space**: Activate
- **Escape**: Close modals
- **Arrow keys**: Navigate tabs

### ARIA Patterns
```tsx
// Icon button
<button aria-label="Close">
  <XIcon />
</button>

// Live region
<div aria-live="polite">
  {dynamicContent}
</div>

// Decorative element
<div aria-hidden="true">
  <DecorativeElement />
</div>
```

### Focus Management
```tsx
// Skip link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Focus trap (modal)
<dialog ref={dialogRef}>
  <button ref={firstFocusRef}>First</button>
  <button>Last</button>
</dialog>
```

## 🧪 Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

test('renders button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

### E2E Tests
```typescript
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('HMCS');
});
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage
```

## 🚀 Performance

### Code Splitting
```typescript
// Lazy load routes
const Landing = lazy(() => import('./pages/Landing'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Landing />
</Suspense>
```

### Image Optimization
```tsx
// Use WebP with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### Memory Management
```typescript
// Cleanup in useEffect
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(element);
  
  return () => {
    observer.disconnect();
  };
}, []);
```

## 🐛 Debugging

### Common Issues

**World not rendering:**
- Check WebGL support
- Check browser console for errors
- Try `?nogl=1` for fallback

**Memory leaks:**
- Check for missing cleanup in useEffect
- Verify all listeners removed
- Use React DevTools Profiler

**Accessibility issues:**
- Run axe DevTools
- Test with keyboard only
- Test with screen reader

### Debug Tools
```typescript
// World runtime debug API (dev only)
window.__hmcs.runtime
window.__hmcs.scene
window.__hmcs.camera

// Performance monitoring
performance.mark('start');
// ... code ...
performance.mark('end');
performance.measure('duration', 'start', 'end');
```

## 📚 Documentation

### Key Files
- `DESIGN.md` - Design system guide
- `AUDIT_REPORT.md` - Audit findings
- `FINAL_CHECKLIST.md` - Completion checklist
- `PROJECT_SUMMARY.md` - Project overview

### Component Documentation
All components are documented with:
- Props interface
- Usage examples
- Accessibility notes
- Performance considerations

## 🔐 Security

### Best Practices
- Never store sensitive data in localStorage
- Validate all user inputs
- Use HTTPS in production
- Implement CSRF protection
- Sanitize HTML content

### Authentication
```typescript
// Auth context
const { user, login, logout } = useAuth();

// Protected route
<ProtectedRoute requiredRole={Role.STUDENT}>
  <StudentDashboard />
</ProtectedRoute>
```

## 🌐 Deployment

### Build
```bash
npm run build
```

### Environment Variables
```bash
VITE_API_URL=https://api.hmcs.edu
VITE_SENTRY_DSN=https://...
```

### Hosting
- Static hosting (Netlify, Vercel, etc.)
- CDN for assets
- HTTPS required
- Service worker for offline support

## 📞 Support

### Resources
- Design system: `DESIGN.md`
- Audit report: `AUDIT_REPORT.md`
- Testing guide: `TESTING.md`
- Deployment: `DEPLOYMENT.md`

### Common Questions

**Q: How do I add a new page?**
A: Create component in `src/pages/`, add route in `src/App.tsx`

**Q: How do I add a new component?**
A: Create in `src/components/`, export from index, document props

**Q: How do I test accessibility?**
A: Use axe DevTools, test with keyboard, test with screen reader

**Q: How do I optimize performance?**
A: Use React.memo, lazy loading, code splitting, image optimization

---

**Happy coding!** 🚀✨
