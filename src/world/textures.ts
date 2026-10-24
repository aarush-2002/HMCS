/**
 * HMCS World Runtime — Procedural Textures
 * Generated at runtime with canvas, no downloads.
 * Shared through a small cache.
 */

import * as THREE from 'three';
import { mulberry32, fbm, gradientNoise, heightToNormalMap } from './noise';

// ─── Texture Cache ─────────────────────────────────────────────────────────────
const textureCache = new Map<string, THREE.Texture>();

export function getCachedTexture(key: string, factory: () => THREE.Texture): THREE.Texture {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }
  const tex = factory();
  textureCache.set(key, tex);
  return tex;
}

export function disposeAllTextures(): void {
  textureCache.forEach(tex => tex.dispose());
  textureCache.clear();
}

// ─── Canvas Helpers ────────────────────────────────────────────────────────────
function makeCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function canvasToTexture(canvas: HTMLCanvasElement, repeat: [number, number] = [1, 1]): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── Wet Slate Paving ──────────────────────────────────────────────────────────
export function createSlateTexture(): THREE.Texture {
  return getCachedTexture('slate', () => {
    const size = 512;
    const { canvas, ctx } = makeCanvas(size, size);
    const rng = mulberry32(42);
    
    // Base slate color with noise
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        
        // Multi-octave noise for slate variation
        const n1 = fbm(nx * 8, ny * 8, 4, 2.0, 0.5, 42);
        const n2 = fbm(nx * 16, ny * 16, 3, 2.0, 0.5, 123);
        const n = n1 * 0.7 + n2 * 0.3;
        
        // Base slate color (dark blue-gray)
        const base = 0.12 + n * 0.08;
        const r = Math.floor((base * 0.85) * 255);
        const g = Math.floor((base * 0.92) * 255);
        const b = Math.floor((base * 1.0) * 255);
        
        const idx = (y * size + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Draw stone joints (grid pattern)
    ctx.strokeStyle = 'rgba(5, 8, 12, 0.8)';
    ctx.lineWidth = 2;
    
    const tileSize = size / 4;
    for (let i = 0; i <= 4; i++) {
      // Horizontal joints
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(size, i * tileSize);
      ctx.stroke();
      
      // Vertical joints (staggered)
      const offset = i % 2 === 0 ? 0 : tileSize / 2;
      for (let j = 0; j <= 4; j++) {
        ctx.beginPath();
        ctx.moveTo(j * tileSize + offset, i * tileSize);
        ctx.lineTo(j * tileSize + offset, (i + 1) * tileSize);
        ctx.stroke();
      }
    }
    
    // Puddle highlights (wet spots)
    for (let i = 0; i < 8; i++) {
      const px = rng() * size;
      const py = rng() * size;
      const pr = 20 + rng() * 40;
      
      const gradient = ctx.createRadialGradient(px, py, 0, px, py, pr);
      gradient.addColorStop(0, 'rgba(100, 140, 180, 0.15)');
      gradient.addColorStop(1, 'rgba(100, 140, 180, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    
    return canvasToTexture(canvas, [4, 4]);
  });
}

// ─── Board-Formed Concrete ─────────────────────────────────────────────────────
export function createConcreteTexture(): THREE.Texture {
  return getCachedTexture('concrete', () => {
    const size = 512;
    const { canvas, ctx } = makeCanvas(size, size);
    const rng = mulberry32(77);
    
    // Base concrete color
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        
        const n = fbm(nx * 12, ny * 12, 4, 2.0, 0.5, 77);
        const base = 0.18 + n * 0.06;
        
        const r = Math.floor(base * 255);
        const g = Math.floor(base * 0.98 * 255);
        const b = Math.floor(base * 0.95 * 255);
        
        const idx = (y * size + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Horizontal board lines (formwork marks)
    ctx.strokeStyle = 'rgba(15, 20, 25, 0.3)';
    ctx.lineWidth = 1;
    const boardHeight = size / 8;
    for (let i = 0; i < 8; i++) {
      const y = i * boardHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    
    // Rain streaks (vertical drips)
    ctx.strokeStyle = 'rgba(10, 15, 20, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 30; i++) {
      const x = rng() * size;
      const startY = rng() * size * 0.5;
      const length = 50 + rng() * 150;
      
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x + (rng() - 0.5) * 10, startY + length);
      ctx.stroke();
    }
    
    // Form-tie dimples (circular indentations)
    for (let i = 0; i < 12; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 4 + rng() * 4;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, 'rgba(5, 8, 12, 0.4)');
      gradient.addColorStop(0.7, 'rgba(5, 8, 12, 0.2)');
      gradient.addColorStop(1, 'rgba(5, 8, 12, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return canvasToTexture(canvas, [2, 2]);
  });
}

// ─── Roof / Water-Tank Metal with Rust ─────────────────────────────────────────
export function createMetalTexture(): THREE.Texture {
  return getCachedTexture('metal', () => {
    const size = 256;
    const { canvas, ctx } = makeCanvas(size, size);
    const rng = mulberry32(99);
    
    // Base metal color (dark gray)
    const imageData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x / size;
        const ny = y / size;
        
        const n = fbm(nx * 20, ny * 20, 3, 2.0, 0.5, 99);
        const base = 0.15 + n * 0.05;
        
        const r = Math.floor(base * 255);
        const g = Math.floor(base * 0.95 * 255);
        const b = Math.floor(base * 0.9 * 255);
        
        const idx = (y * size + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    
    // Rust runs (orange-brown streaks)
    for (let i = 0; i < 15; i++) {
      const x = rng() * size;
      const startY = rng() * size * 0.3;
      const length = 30 + rng() * 100;
      
      ctx.strokeStyle = `rgba(${140 + rng() * 40}, ${60 + rng() * 30}, ${20 + rng() * 20}, ${0.3 + rng() * 0.3})`;
      ctx.lineWidth = 2 + rng() * 3;
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(x, startY);
      
      // Wavy path downward
      let cy = startY;
      let cx = x;
      while (cy < startY + length) {
        cx += (rng() - 0.5) * 8;
        cy += 5 + rng() * 10;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }
    
    return canvasToTexture(canvas, [1, 1]);
  });
}

// ─── Window Lattice ────────────────────────────────────────────────────────────
export function createWindowLatticeTexture(): THREE.Texture {
  return getCachedTexture('window-lattice', () => {
    const size = 128;
    const { canvas, ctx } = makeCanvas(size, size);
    
    // Dark frame
    ctx.fillStyle = 'rgba(10, 15, 20, 0.95)';
    ctx.fillRect(0, 0, size, size);
    
    // Window panes (4x4 grid)
    const paneSize = size / 4;
    const frameWidth = 4;
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const x = i * paneSize + frameWidth;
        const y = j * paneSize + frameWidth;
        const w = paneSize - frameWidth * 2;
        const h = paneSize - frameWidth * 2;
        
        // Warm glow from inside
        const gradient = ctx.createRadialGradient(
          x + w / 2, y + h / 2, 0,
          x + w / 2, y + h / 2, w * 0.7
        );
        gradient.addColorStop(0, 'rgba(245, 165, 36, 0.9)');
        gradient.addColorStop(0.5, 'rgba(245, 165, 36, 0.6)');
        gradient.addColorStop(1, 'rgba(245, 165, 36, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, w, h);
      }
    }
    
    return canvasToTexture(canvas, [1, 1]);
  });
}

// ─── Moon Disc ─────────────────────────────────────────────────────────────────
export function createMoonTexture(): THREE.Texture {
  return getCachedTexture('moon', () => {
    const size = 256;
    const { canvas, ctx } = makeCanvas(size, size);
    const rng = mulberry32(123);
    
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 4;
    
    // Base moon color (pale gold)
    const baseGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    baseGradient.addColorStop(0, 'rgba(255, 240, 200, 1)');
    baseGradient.addColorStop(0.7, 'rgba(240, 220, 180, 1)');
    baseGradient.addColorStop(1, 'rgba(220, 200, 160, 0.9)');
    
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Maria (dark patches)
    for (let i = 0; i < 5; i++) {
      const mx = cx + (rng() - 0.5) * radius * 1.2;
      const my = cy + (rng() - 0.5) * radius * 1.2;
      const mr = 20 + rng() * 40;
      
      const mariaGradient = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
      mariaGradient.addColorStop(0, 'rgba(180, 160, 130, 0.4)');
      mariaGradient.addColorStop(1, 'rgba(180, 160, 130, 0)');
      
      ctx.fillStyle = mariaGradient;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Craters
    for (let i = 0; i < 30; i++) {
      const crx = cx + (rng() - 0.5) * radius * 1.8;
      const cry = cy + (rng() - 0.5) * radius * 1.8;
      const crr = 2 + rng() * 8;
      
      // Check if inside moon disc
      const dist = Math.sqrt((crx - cx) ** 2 + (cry - cy) ** 2);
      if (dist + crr > radius) continue;
      
      // Crater shadow
      const craterGradient = ctx.createRadialGradient(crx, cry, 0, crx, cry, crr);
      craterGradient.addColorStop(0, 'rgba(100, 90, 70, 0.5)');
      craterGradient.addColorStop(0.7, 'rgba(100, 90, 70, 0.2)');
      craterGradient.addColorStop(1, 'rgba(100, 90, 70, 0)');
      
      ctx.fillStyle = craterGradient;
      ctx.beginPath();
      ctx.arc(crx, cry, crr, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Ray systems (bright streaks from large craters)
    for (let i = 0; i < 3; i++) {
      const rx = cx + (rng() - 0.5) * radius;
      const ry = cy + (rng() - 0.5) * radius;
      
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        const length = 30 + rng() * 50;
        
        ctx.strokeStyle = 'rgba(255, 250, 230, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + Math.cos(angle) * length, ry + Math.sin(angle) * length);
        ctx.stroke();
      }
    }
    
    return canvasToTexture(canvas, [1, 1]);
  });
}

// ─── Soft Glow Sprite ──────────────────────────────────────────────────────────
export function createGlowSprite(): THREE.Texture {
  return getCachedTexture('glow', () => {
    const size = 128;
    const { canvas, ctx } = makeCanvas(size, size);
    
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    return canvasToTexture(canvas, [1, 1]);
  });
}

// ─── Wisp Sprite (round, soft) ─────────────────────────────────────────────────
export function createWispSprite(): THREE.Texture {
  return getCachedTexture('wisp', () => {
    const size = 64;
    const { canvas, ctx } = makeCanvas(size, size);
    
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    return canvasToTexture(canvas, [1, 1]);
  });
}
