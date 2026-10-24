/**
 * HMCS World Runtime — Noise & Random Utilities
 * Seeded RNG (mulberry32), gradient noise, fbm
 */

// Mulberry32 seeded PRNG
export function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// 2D gradient noise (Perlin-style)
export function gradientNoise(x: number, y: number, seed: number = 0): number {
  const rng = mulberry32(seed);
  
  // Grid cell coordinates
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  
  // Fractional position within cell
  const xf = x - xi;
  const yf = y - yi;
  
  // Hash function for gradient selection
  const hash = (x: number, y: number) => {
    const h = seed + x * 374761393 + y * 668265263;
    const rng2 = mulberry32(h);
    const angle = rng2() * Math.PI * 2;
    return [Math.cos(angle), Math.sin(angle)];
  };
  
  // Smoothstep interpolation
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  
  // Corner gradients and dot products
  const [g00x, g00y] = hash(xi, yi);
  const [g10x, g10y] = hash(xi + 1, yi);
  const [g01x, g01y] = hash(xi, yi + 1);
  const [g11x, g11y] = hash(xi + 1, yi + 1);
  
  const n00 = g00x * xf + g00y * yf;
  const n10 = g10x * (xf - 1) + g10y * yf;
  const n01 = g01x * xf + g01y * (yf - 1);
  const n11 = g11x * (xf - 1) + g11y * (yf - 1);
  
  // Bilinear interpolation
  const nx0 = n00 * (1 - u) + n10 * u;
  const nx1 = n01 * (1 - u) + n11 * u;
  
  return nx0 * (1 - v) + nx1 * v;
}

// Fractal Brownian Motion
export function fbm(
  x: number,
  y: number,
  octaves: number = 4,
  lacunarity: number = 2.0,
  persistence: number = 0.5,
  seed: number = 0
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    value += gradientNoise(x * frequency, y * frequency, seed + i) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  
  return value / maxValue;
}

// Generate noise canvas
export function generateNoiseCanvas(
  width: number,
  height: number,
  scale: number = 1,
  octaves: number = 4,
  seed: number = 0
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x / width) * scale;
      const ny = (y / height) * scale;
      const value = fbm(nx, ny, octaves, 2.0, 0.5, seed);
      
      // Normalize to 0-255
      const normalized = (value + 1) * 0.5 * 255;
      const idx = (y * width + x) * 4;
      imageData.data[idx] = normalized;
      imageData.data[idx + 1] = normalized;
      imageData.data[idx + 2] = normalized;
      imageData.data[idx + 3] = 255;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Height to normal map conversion
export function heightToNormalMap(heightCanvas: HTMLCanvasElement, strength: number = 1): HTMLCanvasElement {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  
  const heightCtx = heightCanvas.getContext('2d')!;
  const normalCtx = normalCanvas.getContext('2d')!;
  
  const heightData = heightCtx.getImageData(0, 0, width, height);
  const normalData = normalCtx.createImageData(width, height);
  
  const getHeight = (x: number, y: number) => {
    x = (x + width) % width;
    y = (y + height) % height;
    return heightData.data[(y * width + x) * 4] / 255;
  };
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Sample surrounding heights
      const tl = getHeight(x - 1, y - 1);
      const t = getHeight(x, y - 1);
      const tr = getHeight(x + 1, y - 1);
      const l = getHeight(x - 1, y);
      const r = getHeight(x + 1, y);
      const bl = getHeight(x - 1, y + 1);
      const b = getHeight(x, y + 1);
      const br = getHeight(x + 1, y + 1);
      
      // Sobel operator
      const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
      const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
      
      // Normal vector
      const nx = -dx * strength;
      const ny = -dy * strength;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      
      // Normalize and encode to RGB
      const idx = (y * width + x) * 4;
      normalData.data[idx] = ((nx / len) * 0.5 + 0.5) * 255;
      normalData.data[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      normalData.data[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      normalData.data[idx + 3] = 255;
    }
  }
  
  normalCtx.putImageData(normalData, 0, 0);
  return normalCanvas;
}
