/**
 * HMCS World Runtime — Public API
 * Entry point for the Three.js world runtime.
 */

export { WorldRuntime } from './runtime';
export type { WorldRuntimeOptions, SceneType } from './runtime';
export { isWebGLAvailable, showFallback, hideFallback } from './fallback';
export { PostProcessingPipeline } from './postprocessing';
export type { PostProcessingOptions } from './postprocessing';

// Re-export texture utilities for advanced usage
export {
  createSlateTexture,
  createConcreteTexture,
  createMetalTexture,
  createWindowLatticeTexture,
  createMoonTexture,
  createGlowSprite,
  createWispSprite,
  disposeAllTextures,
} from './textures';

// Re-export noise utilities for advanced usage
export { mulberry32, gradientNoise, fbm, generateNoiseCanvas, heightToNormalMap } from './noise';
