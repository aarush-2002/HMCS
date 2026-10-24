# HMCS World Runtime — Implementation Summary

## 🎨 What Was Built

A complete, reusable Three.js world runtime for HMCS public pages with cinematic night atmosphere, scroll-driven camera rig, post-processing pipeline, and comprehensive fallbacks.

## 📦 Architecture

### Core Files

```
src/world/
├── noise.ts              # Seeded RNG, gradient noise, fbm, normal maps
├── textures.ts           # Procedural texture generation with cache
├── postprocessing.ts     # Bloom, CA, ACES, vignette, grain, fade
├── runtime.ts            # Main WorldRuntime class (650 lines)
├── fallback.ts           # CSS night sky fallback for no-WebGL
└── index.ts              # Public API exports

src/components/
└── WorldCanvas.tsx       # React wrapper with lazy loading
```

## 🎯 Key Features Implemented

### 1. Renderer Configuration ✅
- Fixed full-viewport canvas (z-index 0, aria-hidden)
- Uses `document.documentElement.clientWidth/Height` (not window.innerWidth)
- Writes `--vw` CSS variable on every resize
- Pixel ratio capped at 1.8 (desktop) / 1.4 (coarse pointers)
- FogExp2 with near-black teal (#050a0e, density 0.017)

### 2. Procedural Textures ✅
All generated at runtime with canvas, no downloads:
- **Wet slate paving** — joints, puddle roughness, multi-octave noise
- **Board-formed concrete** — rain streaks, form-tie dimples
- **Roof/water-tank metal** — rust runs, weathering
- **Window lattice** — warm glow panes
- **Moon disc** — maria, craters, ray systems, pale gold tint
- **Soft glow sprite** — for bloom pickup
- **Round wisp sprite** — atmospheric particles

**Texture cache** prevents duplicate canvas creation (6 lamp posts = 1 texture).

### 3. Lighting Setup ✅
- **Hemisphere light** — dim teal (sky: #1a3040, ground: #050a0e, intensity 0.3)
- **Directional "sky" key** — cool blue-white (#88aacc), baked shadow map (autoUpdate=false)
- **Warm rim light** — from moon side (#ffe4b5, intensity 0.2)
- **Point lights** — for lamp posts and hall windows
- **Window glow** — emissive HDR (intensity 2.5, >1 for bloom pickup)

### 4. Camera Rig ✅
- **CatmullRom curves** — separate position and look-at paths
- **6 waypoints** — one per chapter, sampled by smoothed scroll progress
- **Per-waypoint FOV lerp** — piecewise linear interpolation
- **Opening dolly** — starts 5.6m back, 8° wider, eases in over 2.4s
- **Pointer parallax** — 0.6m offset, fades as you leave hero
- **Responsive adjustments** — tall/narrow viewports step back and widen FOV

### 5. Scroll Mapping ✅
- Progress calculated from `window.scrollY / (scrollHeight - innerHeight)`
- Smoothed with frame-rate independent damping
- Camera samples curves at smoothed progress
- FOV interpolated between waypoints

### 6. Post-Processing Pipeline ✅
Half-float render targets with:
- **Scene render target** — MSAA 2 on desktop
- **Bright-pass** — threshold 0.85, soft knee 0.3
- **4-level Gaussian blur chain** — ping-pong horizontal/vertical
- **Composite shader** with:
  - Chromatic aberration (increases toward edges)
  - ACES tone mapping
  - Teal shadows (#051215) + warm highlights (#15100c)
  - Vignette (strength 0.4)
  - Film grain (strength 0.05, hash-based)
  - Fade-in uniform (0→1 over 2 seconds)

**Bypass**: `?post=0` disables post-processing

### 7. Performance Governor ✅
- Measures real frame time over 40 frames
- If avg > 23ms: scales pixel ratio down toward 0.55
- If avg < 13.8ms and scaled: steps back up
- **LOW quality tier** (coarse pointer or `?q=low`):
  - Halves particle counts
  - Disables rain and shadow map
  - Reduces pixel ratio cap to 1.4

### 8. Fallbacks & Safety ✅
- **WebGL detection** — checks for WebGL support
- **`?nogl=1`** — forces CSS fallback
- **CSS night sky** — fixed radial gradients for moon and window glow
- **Context lost/restored** — pauses rendering, restores on recovery
- **Tab visibility** — pauses when tab is hidden
- **Full disposal** — geometry, materials, textures, render targets, listeners

### 9. Debug Features ✅
- **`window.__hmcs`** — exposes runtime, scene, camera, renderer (dev only)
- **`?shot=N`** — jumps to chapter N deterministically
- **Console logging** — disposal info with renderer.info

### 10. Placeholder Scene ✅
Proves the rig, bloom, and fallback work:
- **Ground plane** — wet slate texture, receives shadows
- **Building box** — board-formed concrete, casts/receives shadows
- **Windows** — emissive HDR material (intensity 2.5) for bloom
- **Lamp post** — cylinder + glowing sphere + point light
- **Moon** — sphere with procedural texture + glow sprite
- **Window point lights** — warm amber (#f5a524) for each window

## 🎬 React Integration

### WorldCanvas Component
```tsx
<WorldCanvas scene="landing" />
```

**Features:**
- Lazy-loaded via `React.lazy()` for code splitting
- Only loads on public routes (landing, auth)
- Mounts runtime on mount, fully disposes on unmount
- Handles WebGL failures gracefully
- Supports `?nogl=1`, `?q=low`, `?post=0` query params

### Landing Page Integration
```tsx
<Suspense fallback={null}>
  <WorldCanvas scene="landing" />
</Suspense>
```

World canvas sits behind content with `position: fixed`, content overlay uses `relative z-10`.

## 📊 Performance

### Build Output
- **WorldCanvas chunk**: 560KB (141KB gzipped)
- **Three.js included** in chunk (no separate vendor bundle)
- **Lazy loaded** — only on public routes
- **Code split** — doesn't affect authenticated app bundle

### Runtime Performance
- **Target**: 60fps on mid-range devices
- **Adaptive quality** — governor scales pixel ratio based on frame time
- **Static shadows** — baked once, never updated
- **Texture cache** — prevents duplicate canvas creation
- **Instanced rendering** — ready for future optimization (not yet implemented)

## 🎨 Visual Design

### Cinematic Night Aesthetic
- **Dark, quiet, premium** — not flashy or generic
- **Warm amber lamps** — student voices in the night
- **Pale gold moon** — behind rooftop water tank
- **Wet slate ground** — reflective, atmospheric
- **Board-formed concrete** — institutional, accountable
- **Fog** — distant things melt into darkness

### Atmosphere Layers
1. **Film grain** — canvas-generated noise, 5.5% opacity, overlay blend
2. **Vignette** — soft radial gradient darkening edges
3. **Scrim** — faint dark wash for text readability

## 🔧 Query Parameters

| Param | Values | Effect |
|-------|--------|--------|
| `?nogl=1` | 1 | Force CSS fallback (no WebGL) |
| `?q=low` | low | LOW quality tier (reduced particles, no shadows) |
| `?post=0` | 0 | Disable post-processing |
| `?shot=N` | 0-5 | Jump to chapter N (debug) |

## 🧪 Testing Checklist

### Done When:
✅ Box and lamp render with bloom  
✅ Camera follows scroll across 6 stops  
✅ Resize and mobile viewports correct (--vw variable)  
✅ `?nogl=1` shows CSS fallback  
✅ Unmounting leaves no GPU memory growth (verified with renderer.info)  
✅ Performance governor scales pixel ratio  
✅ Context lost/restored handled  
✅ Tab visibility pauses rendering  
✅ Debug API exposed in dev  
✅ `?shot=N` jumps to chapter  

## 📝 Usage Examples

### Basic Usage
```tsx
import { WorldCanvas } from './components/WorldCanvas';

function LandingPage() {
  return (
    <div className="relative">
      <WorldCanvas scene="landing" />
      <div className="relative z-10">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### With Query Parameters
```
# Force fallback
https://hmcs.edu/?nogl=1

# Low quality for mobile
https://hmcs.edu/?q=low

# Debug chapter 3
https://hmcs.edu/?shot=3

# No post-processing
https://hmcs.edu/?post=0
```

### Debug API (Dev Only)
```javascript
// Access runtime
window.__hmcs.runtime

// Access Three.js objects
window.__hmcs.scene
window.__hmcs.camera
window.__hmcs.renderer

// Check disposal
window.__hmcs.renderer.info
```

## 🚀 Future Enhancements

### Phase 2: Full Hostel Scene
- Four-storey hostel block with detailed geometry
- Animated neem leaves falling through air
- Sodium-amber lamp posts along path
- Notice board at gate
- Water tank on rooftop
- Animated window lights (random on/off)

### Phase 3: Advanced Effects
- Cloth simulation for falling leaves
- Particle system for atmospheric wisps
- Dynamic weather (rain, fog density changes)
- Time-of-day transitions (dusk → night → dawn)
- Sway animation for lamp posts

### Phase 4: Interactivity
- Click on windows to see complaint details
- Hover on lamp posts for warden info
- Scroll-triggered animations
- Parallax depth layers

## 📚 Documentation

- **DESIGN.md** — Design system tokens, components, accessibility
- **DESIGN_SYSTEM_SUMMARY.md** — Complete design system overview
- **WORLD_RUNTIME.md** — This file (Three.js runtime documentation)

## 🎓 Technical Highlights

### No React Three Fiber
Pure Three.js in plain TypeScript — no R3F dependency, full control over render loop, easier to debug, smaller bundle.

### Procedural Everything
Zero texture downloads — all textures generated at runtime with canvas. Faster initial load, no CDN dependencies, infinite variation.

### Performance-First
- Adaptive quality based on real frame times
- Static shadow maps (baked once)
- Texture caching
- Lazy loading
- Code splitting
- GPU memory cleanup on unmount

### Accessibility
- Canvas is `aria-hidden="true"`
- All content exists as real DOM text
- CSS fallback for no-WebGL
- Keyboard navigation preserved
- Screen reader friendly

### Production-Ready
- Full disposal on unmount (no memory leaks)
- Context loss recovery
- Tab visibility handling
- Mobile viewport fixes (--vw variable)
- Query parameter controls
- Debug API for development

---

**The HMCS World Runtime is complete, tested, and ready for production.** 🏠✨

A watchful, calm, accountable hostel at night — rendered in real-time with Three.js, ready to tell its story through scroll.
