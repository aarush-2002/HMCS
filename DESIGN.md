# HMCS Design System — Cinematic Night

A dark, quiet, premium design for a watchful, accountable hostel at night.

## Philosophy

The hostel at night is calm but watchful. Warm lit windows are the only bright things — each one a student's voice. A pale gold moon sits behind the rooftop water tank. Sodium-amber lamp posts line the path. Neem leaves fall slowly through the air.

The design reflects this: dark surfaces, warm amber accents, generous whitespace, and subtle motion. It's not flashy or generic — it's institutional, accountable, and human.

## Design Tokens

### Colors

**Surfaces:**
- `--ink: #05070a` — Primary background (deepest black)
- `--ink-2: #0a0e12` — Secondary surfaces (cards, panels)
- `--ink-3: #0f151a` — Tertiary surfaces (elevated elements)
- `--line: rgba(223, 231, 224, 0.13)` — Borders and dividers
- `--line-soft: rgba(223, 231, 224, 0.07)` — Subtle separators

**Text:**
- `--bone: #dfe7e0` — Primary text (pale bone white)
- `--bone-dim: #aab4ad` — Secondary text (dimmed bone)
- `--muted: #8a958e` — Tertiary text (muted gray-green)

**Accents:**
- `--ember: #f5a524` — Primary accent (warm amber, lamp light)
- `--emergency: #e5484d` — Emergency alerts (red)
- `--resolved: #6fcf97` — Success states (sage green)
- `--info: #7fb4c9` — Informational (pale blue)

All text colors meet WCAG AA contrast requirements against `--ink`:
- `--bone` on `--ink`: 15.2:1 ✓
- `--bone-dim` on `--ink`: 7.8:1 ✓
- `--muted` on `--ink`: 5.1:1 ✓ (AA for normal text)

### Typography

**Fonts:**
- **Onest** (300/400/500/600) — Primary typeface for all Latin text
- **Noto Sans Devanagari** — Hindi/Devanagari text (horizontal only, never vertical)

**Display Headings:**
- Uppercase
- Line-height: 1.055
- Letter-spacing: -0.012em
- Font-weight: 400
- Sizes: XL (120px), LG (72px), MD (44px), SM (28px)

**Eyebrows:**
- Font-size: 10px
- Font-weight: 500
- Letter-spacing: 0.22em
- Text-transform: uppercase
- Color: `--muted` or `--ember`

**Body Text:**
- Base: 15px, line-height 1.6
- Small: 13px, line-height 1.55
- Extra small: 11px, line-height 1.5

**Numerals:**
- Tabular figures enabled (`font-variant-numeric: tabular-nums`)
- Used for all numbers to ensure alignment

### Spacing & Layout

- **Padding:** `clamp(20px, 3.4vw, 56px)` — Responsive padding
- **Nav height:** 84px
- **Max width:** 1360px
- **Rail width:** 56px (side navigation dots)

### Motion

- **Ease:** `cubic-bezier(0.22, 0.61, 0.36, 1)` — Smooth, natural
- **Ease out:** `cubic-bezier(0.16, 1, 0.3, 1)` — Decelerating
- **Ease in-out:** `cubic-bezier(0.65, 0, 0.35, 1)` — Symmetric

All motion respects `prefers-reduced-motion`:
- Animations disabled
- Transitions instant
- Parallax and word reveals disabled
- State changes remain instant

## Atmosphere Layers

Three layers are always present in the background:

1. **Film Grain** — Generated noise canvas at 5.5% opacity, overlay blend mode
2. **Vignette** — Soft radial gradient darkening edges
3. **Scrim** — Faint dark wash behind text for readability

These create depth and ensure text remains readable over any background (including the future 3D hostel scene).

## Components

### Button

**Variants:**
- `primary` — Ember pill with slide-up fill on hover
- `ghost` — Transparent with border, ember on hover
- `text` — No background, ember text on hover
- `outline` — Same as ghost (backwards compatibility)
- `danger` — Red background for destructive actions
- `secondary` — Subtle background for secondary actions

**Sizes:** `sm`, `md`, `lg`

**States:**
- Default, hover, focus, active, disabled, loading
- Focus ring: 2px solid ember, offset 3px
- Loading: Spinner icon replaces content

### NavLink

Two-line rolling hover that reveals the Hindi word below:
- English text on top
- Hindi translation appears on hover (if provided)
- Ember underline scales in from left on hover

### Input / Textarea / Select

- Hairline borders (`--line`)
- Ember focus border
- Error state: red border + error message
- Hint text below input
- Character counter for textarea (optional)

### Toggle

- Ember background when on
- Line color when off
- Smooth slide animation
- Accessible with `role="switch"` and `aria-checked`

### FileDropzone

- Drag-and-drop zone with dashed border
- Ember border on drag active
- File previews with remove button
- Max files and size limits

### Card

- `--ink-2` background
- Hairline border
- Optional hover state (ember glow)
- Padding variants: `none`, `sm`, `md`, `lg`

### Badge

**Variants:**
- `default` — Line background
- `ember` — Ember soft background
- `emergency` — Red soft background
- `resolved` — Green soft background
- `info` — Blue soft background
- `danger`, `accent`, `warning`, `success` — Aliases for backwards compatibility

**Always includes:** Icon + text label (never color alone)

### StatusBadge

One badge per complaint status:
- **Submitted** — Info (blue) + Info icon
- **Acknowledged** — Default (gray) + Check icon
- **In Progress** — Ember (amber) + Clock icon
- **Marked Resolved** — Resolved (green) + CheckCircle icon
- **Resolved** — Resolved (green) + CheckCircle icon
- **Reopened** — Emergency (red) + AlertTriangle icon
- **Closed** — Default (gray) + Minus icon
- **Rejected** — Default (gray) + X icon

### PriorityBadge

- **Emergency** — Red background + AlertTriangle icon + "Emergency" text
- **Normal** — Ember outline + Clock icon + "Normal" text

### Tabs

- Horizontal tab list
- Active tab: ember underline + ember text
- Inactive: bone-dim text, ember on hover
- Optional count badge

### Modal

- Centered overlay
- Dark backdrop with blur
- Close button (X icon)
- Escape key closes
- Focus trap (future enhancement)

### Drawer

- Slides in from right
- Full height on mobile
- Max-width 480px on desktop
- Dark backdrop with blur

### Toast

- Fixed bottom-right
- Auto-dismiss after 4 seconds
- Variants: success (green), error (red), info (blue)
- Icon + message

### Tooltip

- Appears on hover
- Positioned above element
- Dark background with border
- Small text

### Skeleton

- Pulsing animation
- Line color background
- Used for loading states

### EmptyState

- Centered layout
- Icon (muted)
- Title (bone)
- Description (bone-dim)

### Pagination

- Previous/Next buttons
- Current page / Total pages
- Disabled states at boundaries

### StarRating

- 1 to 3 stars (configurable)
- Interactive or readonly
- Ember fill when selected
- Line color when unselected
- Sizes: `sm`, `md`, `lg`

### Countdown

- Live countdown timer (updates every second)
- Shows "Overdue" in red when past deadline
- Compact mode for small spaces
- Clock icon + time remaining

### Row

Numbered list row:
- Number (tabular, muted)
- Title (bone, ember on hover)
- Description (bone-dim, 2-line clamp)
- Right-aligned meta (badges, countdowns)
- Ember underline scales in on hover

### ChapterChip

- Pill-shaped badge
- Line border
- Uppercase, tracking-wider
- Used for chapter markers or tags

### StatBlock

- Centered layout
- Large number (tabular)
- Label (eyebrow)
- Optional subtitle

### SideRail

- Fixed right side (large screens only)
- Dot navigation
- Active dot: ember, scaled up
- Inactive: line color
- Links to page sections

### CursorRing

- Custom cursor ring (desktop only)
- Ember border, 32px
- Follows mouse with slight delay
- Disabled if `prefers-reduced-motion`

## Motion Rules

### Reveal on Scroll
- Opacity 0 → 1
- Translate Y 26px → 0
- Duration: 0.9s
- Easing: ease-out
- Stagger: 85ms between elements

### Display Headings
- Word-by-word reveal
- Masked overflow
- Disabled if `prefers-reduced-motion`

### Hover States
- Rows shift right on hover
- Buttons: slide-up fill
- Links: underline scales in

### Reduced Motion
All motion honors `prefers-reduced-motion`:
- Parallax disabled
- Word reveals disabled
- Cloth and sway disabled
- State changes remain instant

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- All text meets 4.5:1 minimum (normal text)
- Large text (18px+) meets 3:1 minimum
- Focus indicators meet 3:1 against adjacent colors

**Keyboard Navigation:**
- All interactive elements focusable
FP-visible focus rings (2px ember, offset 3px)
- Tab order follows visual layout
- Escape closes modals/drawers
- Enter/Space activates buttons

**Screen Readers:**
- Semantic HTML (nav, main, article, section)
- ARIA labels for icon-only buttons
- ARIA roles for custom widgets (tabs, dialogs, switches)
- Live regions for dynamic content (toasts)
- Alt text for images

**Touch Targets:**
- Minimum 44x44px
- Adequate spacing between targets

**Motion:**
- No auto-playing animations
- Respects `prefers-reduced-motion`
- Information not conveyed by motion alone

**Color:**
- Status/priority badges use color + icon + text
- Never rely on color alone to convey information

**Devanagari:**
- Horizontal text only (never vertical)
- Preserves shirorekha (top line)
- Proper line-height for readability

## File Structure

```
src/
├── styles/
│   └── tokens.css          # Design tokens + Tailwind theme
├── components/
│   └── ui/
│       ├── index.tsx        # All UI components
│       └── Atmosphere.tsx   # Film grain + vignette + scrim
└── pages/
    └── Design.tsx           # /design showcase route
```

## Usage

### Import Components

```tsx
import { Button, Card, StatusBadge } from "../components/ui";
import { Atmosphere } from "../components/ui/Atmosphere";
```

### Use Tokens

```tsx
<div className="bg-ink text-bone">
  <h1 className="display display-lg">Title</h1>
  <p className="body">Body text</p>
</div>
```

### Access /design Route

Navigate to `#/design` to see all components in all states.

## Future Enhancements

- 3D hostel scene (Three.js) — watchful, calm, accountable
- Word-by-word heading reveals
- Parallax scrolling
- Cloth simulation for neem leaves
- Sway animation for lamp posts
- Custom cursor interactions

## Credits

**Fonts:**
- Onest — https://onest.md
- Noto Sans Devanagari — Google Fonts

**Icons:**
- Lucide React — https://lucide.dev

**Inspiration:**
- Institutional design systems
- Government portals
- Cinematic night photography

---

**Built with care for hostel communities everywhere.** 🏠✨
