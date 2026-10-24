/**
 * HMCS World Runtime — Main Runtime
 * Orchestrates renderer, scene, camera rig, scroll, performance, and post-processing.
 */

import * as THREE from 'three';
import { PostProcessingPipeline } from './postprocessing';
import { HostelScene } from './scene';
import { ViewportCards } from './viewport-cards';
import {
  createSlateTexture,
  createConcreteTexture,
  createMetalTexture,
  createGlowSprite,
  createMoonTexture,
  disposeAllTextures,
} from './textures';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type SceneType = 'landing' | 'auth';

export interface WorldRuntimeOptions {
  container: HTMLElement;
  scene: SceneType;
  quality?: 'high' | 'low';
  postProcessing?: boolean;
}

interface Waypoint {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  anchor: number; // scroll progress 0-1
}

// ─── Performance Governor ──────────────────────────────────────────────────────

class PerformanceGovernor {
  private frameTimes: number[] = [];
  private lastTime = 0;
  private currentScale = 1;
  private targetScale = 1;
  private isLowQuality: boolean;
  
  constructor(private renderer: THREE.WebGLRenderer, lowQuality: boolean) {
    this.isLowQuality = lowQuality;
    if (lowQuality) {
      this.currentScale = 0.55;
      this.targetScale = 0.55;
    }
  }
  
  public beginFrame(): void {
    this.lastTime = performance.now();
  }
  
  public endFrame(): void {
    const frameTime = performance.now() - this.lastTime;
    this.frameTimes.push(frameTime);
    
    if (this.frameTimes.length > 40) {
      this.frameTimes.shift();
    }
    
    if (this.frameTimes.length === 40) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / 40;
      
      if (avg > 23 && this.currentScale > 0.55) {
        this.targetScale = Math.max(0.55, this.currentScale * 0.9);
      } else if (avg < 13.8 && this.currentScale < 1) {
        this.targetScale = Math.min(1, this.currentScale * 1.1);
      }
    }
    
    // Smooth toward target
    this.currentScale += (this.targetScale - this.currentScale) * 0.1;
  }
  
  public getPixelRatioScale(): number {
    return this.currentScale;
  }
  
  public isLow(): boolean {
    return this.isLowQuality;
  }
}

// ─── World Runtime ─────────────────────────────────────────────────────────────

export class WorldRuntime {
  private container: HTMLElement;
  private sceneType: SceneType;
  
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private postProcessing!: PostProcessingPipeline;
  private governor!: PerformanceGovernor;
  private hostelScene!: HostelScene;
  private viewportCards!: ViewportCards;
  
  // Camera rig
  private positionCurve!: THREE.CatmullRomCurve3;
  private lookAtCurve!: THREE.CatmullRomCurve3;
  private waypoints: Waypoint[] = [];
  private currentProgress = 0;
  private targetProgress = 0;
  private smoothedProgress = 0;
  
  // Opening dolly
  private dollyStartTime = 0;
  private dollyDuration = 2.4;
  private dollyComplete = false;
  
  // Pointer parallax
  private pointerX = 0;
  private pointerY = 0;
  private parallaxStrength = 0.6;
  
  // State
  private disposed = false;
  private paused = false;
  private animationFrameId = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  
  // Listeners
  private resizeHandler!: () => void;
  private scrollHandler!: () => void;
  private pointerMoveHandler!: (e: PointerEvent) => void;
  private visibilityHandler!: () => void;
  private contextLostHandler!: (e: Event) => void;
  private contextRestoredHandler!: () => void;
  
  // Debug
  private debugShot: number | null = null;
  
  constructor(options: WorldRuntimeOptions) {
    this.container = options.container;
    this.sceneType = options.scene;
    
    const isLowQuality = options.quality === 'low' || this.isCoarsePointer();
    const postEnabled = options.postProcessing !== false && this.getQueryParam('post') !== '0';
    this.debugShot = this.getQueryParam('shot') ? parseInt(this.getQueryParam('shot')!) : null;
    
    this.initRenderer(isLowQuality);
    this.initScene(isLowQuality);
    this.initCamera();
    this.initCameraRig();
    this.initPostProcessing(postEnabled);
    this.initPerformanceGovernor(isLowQuality);
    this.initHostelScene(isLowQuality);
    this.initViewportCards();
    this.initEventListeners();
    this.handleResize();
    
    this.startTime = performance.now();
    this.dollyStartTime = this.startTime;
    
    // Expose debug API in development
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
    if (isDev) {
      (window as any).__hmcs = {
        runtime: this,
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
      };
    }
    
    this.animate();
  }
  
  // ─── Initialization ──────────────────────────────────────────────────────────
  
  private initRenderer(lowQuality: boolean): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !lowQuality,
      alpha: false,
      powerPreference: 'high-performance',
    });
    
    const isCoarse = this.isCoarsePointer();
    const maxPixelRatio = isCoarse ? 1.4 : 1.8;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(this.getLayoutWidth(), window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !lowQuality;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false; // Static scene
    
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.zIndex = '0';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    
    this.container.appendChild(this.renderer.domElement);
    
    // Context loss handling
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLostHandler);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.contextRestoredHandler);
  }
  
  private initScene(lowQuality: boolean): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050a0e);
    
    // FogExp2 — near-black teal, distant things melt into dark
    this.scene.fog = new THREE.FogExp2(0x050a0e, 0.017);
    
    // ─── Lighting ────────────────────────────────────────────────────────────
    
    // Dim teal hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x1a3040, 0x050a0e, 0.3);
    this.scene.add(hemiLight);
    
    // Cool directional "sky" key with baked shadow map
    const dirLight = new THREE.DirectionalLight(0x88aacc, 0.6);
    dirLight.position.set(-10, 15, 5);
    dirLight.castShadow = !lowQuality;
    if (!lowQuality) {
      dirLight.shadow.mapSize.set(1024, 1024);
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 50;
      dirLight.shadow.camera.left = -20;
      dirLight.shadow.camera.right = 20;
      dirLight.shadow.camera.top = 20;
      dirLight.shadow.camera.bottom = -20;
      dirLight.shadow.bias = -0.001;
    }
    this.scene.add(dirLight);
    
    // Faint warm rim from moon side
    const rimLight = new THREE.DirectionalLight(0xffe4b5, 0.2);
    rimLight.position.set(10, 8, -5);
    this.scene.add(rimLight);
  }
  
  private initCamera(): void {
    const aspect = this.getLayoutWidth() / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    this.camera.position.set(0, 2, 10);
  }
  
  private initCameraRig(): void {
    // Define waypoints for 6 chapters (site plan: hostel at z=-40, gate at z=-8)
    this.waypoints = [
      // 0 Hero: wide and slightly low, whole block, moon over the water tank
      { position: new THREE.Vector3(0, 3, 5), lookAt: new THREE.Vector3(0, 7, -40), fov: 55, anchor: 0 },
      
      // 1 Report: low, left of the path, gate and notice board filling the right of frame
      { position: new THREE.Vector3(-8, 2, -5), lookAt: new THREE.Vector3(2, 2, -8), fov: 50, anchor: 0.2 },
      
      // 2 Support: moves along the facade at window height so the glowing grid sweeps past
      { position: new THREE.Vector3(-15, 6, -35), lookAt: new THREE.Vector3(0, 6, -40), fov: 48, anchor: 0.4 },
      
      // 3 Resolve: close, from the right, aimed at the warden's office window (ground-floor)
      { position: new THREE.Vector3(12, 3, -38), lookAt: new THREE.Vector3(-5, 3, -40), fov: 45, anchor: 0.6 },
      
      // 4 Daybreak: rises over the roof as the sky lightens slightly toward the horizon
      { position: new THREE.Vector3(5, 18, -45), lookAt: new THREE.Vector3(0, 14, -40), fov: 50, anchor: 0.8 },
      
      // 5 Colophon: high, still, dawn haze, roof edge
      { position: new THREE.Vector3(0, 20, -50), lookAt: new THREE.Vector3(0, 15, -40), fov: 52, anchor: 1.0 },
    ];
    
    // Build CatmullRom curves
    this.positionCurve = new THREE.CatmullRomCurve3(
      this.waypoints.map(w => w.position),
      false,
      'catmullrom',
      0.5
    );
    
    this.lookAtCurve = new THREE.CatmullRomCurve3(
      this.waypoints.map(w => w.lookAt),
      false,
      'catmullrom',
      0.5
    );
    
    // If debug shot is set, jump to that chapter
    if (this.debugShot !== null && this.debugShot >= 0 && this.debugShot < this.waypoints.length) {
      this.targetProgress = this.waypoints[this.debugShot].anchor;
      this.currentProgress = this.targetProgress;
      this.smoothedProgress = this.targetProgress;
      this.dollyComplete = true;
    }
  }
  
  private initPostProcessing(enabled: boolean): void {
    this.postProcessing = new PostProcessingPipeline(this.renderer, {
      enabled,
      bloomStrength: 0.8,
      bloomThreshold: 0.85,
      chromaticAberration: 0.003,
      vignetteStrength: 0.4,
      grainStrength: 0.05,
      msaa: 2,
    });
  }
  
  private initPerformanceGovernor(lowQuality: boolean): void {
    this.governor = new PerformanceGovernor(this.renderer, lowQuality);
  }
  
  private initHostelScene(lowQuality: boolean): void {
    this.hostelScene = new HostelScene(this.scene, { lowQuality });
    
    // Bake shadows once
    if (!lowQuality) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }
  
  private initViewportCards(): void {
    this.viewportCards = new ViewportCards(this.renderer);
  }
  
  // ─── Event Listeners ─────────────────────────────────────────────────────────
  
  private initEventListeners(): void {
    this.resizeHandler = () => this.handleResize();
    this.scrollHandler = () => this.handleScroll();
    this.pointerMoveHandler = (e: PointerEvent) => this.handlePointerMove(e);
    this.visibilityHandler = () => this.handleVisibilityChange();
    this.contextLostHandler = (e: Event) => this.handleContextLost(e);
    this.contextRestoredHandler = () => this.handleContextRestored();
    
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    window.addEventListener('pointermove', this.pointerMoveHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }
  
  private handleResize(): void {
    const width = this.getLayoutWidth();
    const height = window.innerHeight;
    
    // Write --vw CSS variable (fixes mobile browser issues)
    document.documentElement.style.setProperty('--vw', `${width}px`);
    
    // Adjust pixel ratio based on performance governor
    const basePixelRatio = this.isCoarsePointer() ? 1.4 : 1.8;
    const scaledPixelRatio = Math.min(basePixelRatio, window.devicePixelRatio * this.governor.getPixelRatioScale());
    this.renderer.setPixelRatio(scaledPixelRatio);
    
    this.renderer.setSize(width, height);
    
    // Adjust camera for tall/narrow viewports
    const aspect = width / height;
    this.camera.aspect = aspect;
    
    // Step back and widen FOV on tall/narrow viewports
    if (aspect < 0.7) {
      this.camera.fov = 65;
    } else {
      this.camera.fov = 55;
    }
    
    this.camera.updateProjectionMatrix();
    
    if (this.postProcessing.enabled) {
      this.postProcessing.resize(width, height);
    }
  }
  
  private handleScroll(): void {
    // Calculate scroll progress based on document height
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.targetProgress = Math.max(0, Math.min(1, scrollTop / scrollHeight));
  }
  
  private handlePointerMove(e: PointerEvent): void {
    // Normalize to -1 to 1
    this.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
  }
  
  private handleVisibilityChange(): void {
    this.paused = document.hidden;
  }
  
  private handleContextLost(e: Event): void {
    e.preventDefault();
    console.warn('[HMCS World] WebGL context lost');
    this.paused = true;
  }
  
  private handleContextRestored(): void {
    console.log('[HMCS World] WebGL context restored');
    this.paused = false;
    this.handleResize();
  }
  
  // ─── Animation Loop ──────────────────────────────────────────────────────────
  
  private animate = (): void => {
    if (this.disposed) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    if (this.paused) return;
    
    this.governor.beginFrame();
    
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000;
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    
    // ─── Opening Dolly ───────────────────────────────────────────────────────
    if (!this.dollyComplete) {
      const dollyProgress = Math.min(1, (now - this.dollyStartTime) / (this.dollyDuration * 1000));
      const eased = this.easeOutCubic(dollyProgress);
      
      // Start 5.6m back and 8 degrees wider
      const startPos = new THREE.Vector3(0, 2, 15.6);
      const startFov = 63;
      
      const targetPos = this.positionCurve.getPointAt(this.targetProgress);
      const targetFov = this.getFOVAtProgress(this.targetProgress);
      
      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.camera.fov = startFov + (targetFov - startFov) * eased;
      this.camera.updateProjectionMatrix();
      
      if (dollyProgress >= 1) {
        this.dollyComplete = true;
      }
    } else {
      // ─── Scroll-Driven Camera ──────────────────────────────────────────────
      
      // Smooth progress (frame-rate independent damping)
      const dampingFactor = 1 - Math.pow(0.001, 1 / 60); // ~60fps equivalent
      this.smoothedProgress += (this.targetProgress - this.smoothedProgress) * dampingFactor;
      
      // Sample curves
      const pos = this.positionCurve.getPointAt(this.smoothedProgress);
      const lookAt = this.lookAtCurve.getPointAt(this.smoothedProgress);
      const fov = this.getFOVAtProgress(this.smoothedProgress);
      
      // Apply pointer parallax (fades as you leave hero)
      const parallaxFade = Math.max(0, 1 - this.smoothedProgress * 2);
      const parallaxOffset = new THREE.Vector3(
        this.pointerX * this.parallaxStrength * parallaxFade,
        -this.pointerY * this.parallaxStrength * 0.5 * parallaxFade,
        0
      );
      
      this.camera.position.copy(pos).add(parallaxOffset);
      this.camera.lookAt(lookAt);
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    
    // ─── Update Scene ──────────────────────────────────────────────────────────
    
    // Update hostel scene (windows, lamps, atmosphere)
    if (this.hostelScene) {
      this.hostelScene.update(deltaTime, this.smoothedProgress);
    }
    
    // Update viewport cards
    if (this.viewportCards) {
      this.viewportCards.update(this.scene, elapsed * 1000);
    }
    
    // ─── Render ──────────────────────────────────────────────────────────────
    
    // Update post-processing uniforms
    if (this.postProcessing.enabled) {
      this.postProcessing.setTime(elapsed);
      
      // Fade in over first 2 seconds
      const fadeProgress = Math.min(1, elapsed / 2);
      this.postProcessing.setFade(this.easeOutCubic(fadeProgress));
      
      this.postProcessing.render(this.scene, this.camera);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    this.governor.endFrame();
  };
  
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  
  private getLayoutWidth(): number {
    // Use documentElement.clientWidth, NOT window.innerWidth
    // (mobile browsers report a wider initial containing block)
    return document.documentElement.clientWidth;
  }
  
  private isCoarsePointer(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
  }
  
  private getQueryParam(name: string): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
  
  private getFOVAtProgress(progress: number): number {
    // Piecewise linear interpolation of FOV
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const w0 = this.waypoints[i];
      const w1 = this.waypoints[i + 1];
      
      if (progress >= w0.anchor && progress <= w1.anchor) {
        const t = (progress - w0.anchor) / (w1.anchor - w0.anchor);
        return w0.fov + (w1.fov - w0.fov) * t;
      }
    }
    
    return this.waypoints[this.waypoints.length - 1].fov;
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  
  // ─── Disposal ────────────────────────────────────────────────────────────────
  
  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    
    cancelAnimationFrame(this.animationFrameId);
    
    // Remove event listeners
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('pointermove', this.pointerMoveHandler);
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLostHandler);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.contextRestoredHandler);
    
    // Dispose post-processing
    this.postProcessing.dispose();
    
    // Dispose hostel scene
    if (this.hostelScene) {
      this.hostelScene.dispose();
    }
    
    // Dispose viewport cards
    if (this.viewportCards) {
      this.viewportCards.dispose();
    }
    
    // Dispose scene
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.Sprite) {
        obj.material.dispose();
      }
    });
    
    // Dispose textures
    disposeAllTextures();
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Remove canvas from DOM
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    
    // Remove debug API
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
    if (isDev) {
      delete (window as any).__hmcs;
    }
    
    console.log('[HMCS World] Disposed. Renderer info:', this.renderer.info);
  }
}
