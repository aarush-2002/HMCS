/**
 * HMCS World Runtime — Post-Processing
 * Bloom chain, chromatic aberration, ACES tone mapping,
 * teal shadows, warm highlights, vignette, film grain, fade-in.
 */

import * as THREE from 'three';

// ─── Shader Sources ────────────────────────────────────────────────────────────

const QUAD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BRIGHT_PASS_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float threshold;
  uniform float softKnee;
  varying vec2 vUv;

  vec3 acesApprox(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float knee = threshold * softKnee;
    float soft = brightness - threshold + knee;
    soft = clamp(soft, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 0.0001);
    float contribution = max(soft, brightness - threshold) / max(brightness, 0.0001);
    gl_FragColor = vec4(color * contribution, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 direction;
  uniform vec2 resolution;
  varying vec2 vUv;

  void main() {
    vec2 texelSize = 1.0 / resolution;
    vec2 off1 = 1.3846153846 * direction * texelSize;
    vec2 off2 = 3.2307692308 * direction * texelSize;

    vec3 color = vec3(0.0);
    color += texture2D(tDiffuse, vUv).rgb * 0.2270270270;
    color += texture2D(tDiffuse, vUv + off1).rgb * 0.3162162162;
    color += texture2D(tDiffuse, vUv - off1).rgb * 0.3162162162;
    color += texture2D(tDiffuse, vUv + off2).rgb * 0.0702702703;
    color += texture2D(tDiffuse, vUv - off2).rgb * 0.0702702703;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float bloomStrength;
  uniform float chromaticAberration;
  uniform float vignetteStrength;
  uniform float grainStrength;
  uniform float fade;
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  // ACES tone mapping
  vec3 aces(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  // Film grain (hash-based)
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float dist = length(center);

    // Chromatic aberration (increases toward edges)
    float caAmount = chromaticAberration * dist * dist;
    vec3 sceneColor;
    sceneColor.r = texture2D(tScene, uv + center * caAmount).r;
    sceneColor.g = texture2D(tScene, uv).g;
    sceneColor.b = texture2D(tScene, uv - center * caAmount).b;

    // Bloom
    vec3 bloom = texture2D(tBloom, uv).rgb * bloomStrength;
    vec3 color = sceneColor + bloom;

    // Color grading: teal shadows, warm highlights
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 shadows = vec3(0.05, 0.12, 0.15); // teal
    vec3 highlights = vec3(1.05, 0.98, 0.92); // warm
    vec3 graded = mix(shadows, highlights, smoothstep(0.0, 1.0, luma));
    color *= graded;

    // ACES tone mapping
    color = aces(color);

    // Vignette
    float vignette = 1.0 - dist * dist * vignetteStrength * 2.0;
    vignette = clamp(vignette, 0.0, 1.0);
    color *= vignette;

    // Film grain
    float grain = (hash(uv * resolution + time * 100.0) - 0.5) * grainStrength;
    color += grain;

    // Fade in
    color *= fade;

    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Post-Processing Pipeline ──────────────────────────────────────────────────

export interface PostProcessingOptions {
  bloomStrength?: number;
  bloomThreshold?: number;
  bloomRadius?: number;
  chromaticAberration?: number;
  vignetteStrength?: number;
  grainStrength?: number;
  msaa?: number;
  enabled?: boolean;
}

export class PostProcessingPipeline {
  private renderer: THREE.WebGLRenderer;
  private sceneTarget: THREE.WebGLRenderTarget;
  private brightTarget: THREE.WebGLRenderTarget;
  private blurTargetsH: THREE.WebGLRenderTarget[] = [];
  private blurTargetsV: THREE.WebGLRenderTarget[] = [];
  
  private quadGeometry: THREE.BufferGeometry;
  private brightMaterial: THREE.ShaderMaterial;
  private blurMaterial: THREE.ShaderMaterial;
  private compositeMaterial: THREE.ShaderMaterial;
  private quadMesh: THREE.Mesh;
  
  private bloomLevels = 4;
  
  // Public uniforms for external control
  public fadeUniform = { value: 0.0 };
  public timeUniform = { value: 0.0 };
  
  constructor(
    renderer: THREE.WebGLRenderer,
    options: PostProcessingOptions = {}
  ) {
    this.renderer = renderer;
    
    const {
      bloomStrength = 0.8,
      bloomThreshold = 0.85,
      chromaticAberration = 0.003,
      vignetteStrength = 0.4,
      grainStrength = 0.05,
      msaa = 2,
      enabled = true,
    } = options;
    
    if (!enabled) {
      // Create dummy values so dispose() doesn't crash
      this.sceneTarget = null as any;
      this.brightTarget = null as any;
      this.quadGeometry = null as any;
      this.brightMaterial = null as any;
      this.blurMaterial = null as any;
      this.compositeMaterial = null as any;
      this.quadMesh = null as any;
      return;
    }
    
    const size = renderer.getSize(new THREE.Vector2());
    const pixelRatio = renderer.getPixelRatio();
    const width = Math.floor(size.x * pixelRatio);
    const height = Math.floor(size.y * pixelRatio);
    
    // Scene render target (half-float, with MSAA)
    this.sceneTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      samples: msaa,
    });
    
    // Bright-pass target (half resolution)
    const bw = Math.floor(width / 2);
    const bh = Math.floor(height / 2);
    this.brightTarget = new THREE.WebGLRenderTarget(bw, bh, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    
    // Blur targets (4 levels, each half the previous)
    let w = bw;
    let h = bh;
    for (let i = 0; i < this.bloomLevels; i++) {
      w = Math.max(1, Math.floor(w / 2));
      h = Math.max(1, Math.floor(h / 2));
      
      this.blurTargetsH.push(new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }));
      this.blurTargetsV.push(new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }));
    }
    
    // Full-screen quad
    this.quadGeometry = new THREE.PlaneGeometry(2, 2);
    
    // Bright-pass material
    this.brightMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: BRIGHT_PASS_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        threshold: { value: bloomThreshold },
        softKnee: { value: 0.3 },
      },
    });
    
    // Blur material
    this.blurMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        direction: { value: new THREE.Vector2(1, 0) },
        resolution: { value: new THREE.Vector2(1, 1) },
      },
    });
    
    // Composite material
    this.compositeMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        bloomStrength: { value: bloomStrength },
        chromaticAberration: { value: chromaticAberration },
        vignetteStrength: { value: vignetteStrength },
        grainStrength: { value: grainStrength },
        fade: this.fadeUniform,
        time: this.timeUniform,
        resolution: { value: new THREE.Vector2(width, height) },
      },
    });
    
    this.quadMesh = new THREE.Mesh(this.quadGeometry, this.brightMaterial);
    this.quadMesh.frustumCulled = false;
  }
  
  public get enabled(): boolean {
    return this.sceneTarget !== null;
  }
  
  public getSceneTarget(): THREE.WebGLRenderTarget | null {
    return this.sceneTarget;
  }
  
  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    if (!this.enabled) {
      this.renderer.render(scene, camera);
      return;
    }
    
    const renderer = this.renderer;
    const currentTarget = renderer.getRenderTarget();
    const currentAutoClear = renderer.autoClear;
    
    // 1. Render scene to sceneTarget
    renderer.setRenderTarget(this.sceneTarget);
    renderer.autoClear = true;
    renderer.render(scene, camera);
    
    // 2. Bright-pass
    this.quadMesh.material = this.brightMaterial;
    (this.brightMaterial.uniforms.tDiffuse as any).value = this.sceneTarget.texture;
    renderer.setRenderTarget(this.brightTarget);
    this.renderQuad();
    
    // 3. Blur chain (4 levels)
    let sourceTexture = this.brightTarget.texture;
    for (let i = 0; i < this.bloomLevels; i++) {
      const hTarget = this.blurTargetsH[i];
      const vTarget = this.blurTargetsV[i];
      
      // Horizontal blur
      this.quadMesh.material = this.blurMaterial;
      (this.blurMaterial.uniforms.tDiffuse as any).value = sourceTexture;
      (this.blurMaterial.uniforms.direction as any).value.set(1, 0);
      (this.blurMaterial.uniforms.resolution as any).value.set(hTarget.width, hTarget.height);
      renderer.setRenderTarget(hTarget);
      this.renderQuad();
      
      // Vertical blur
      (this.blurMaterial.uniforms.tDiffuse as any).value = hTarget.texture;
      (this.blurMaterial.uniforms.direction as any).value.set(0, 1);
      (this.blurMaterial.uniforms.resolution as any).value.set(vTarget.width, vTarget.height);
      renderer.setRenderTarget(vTarget);
      this.renderQuad();
      
      sourceTexture = vTarget.texture;
    }
    
    // 4. Composite: combine all bloom levels
    // For simplicity, use the largest blur level
    const finalBloom = this.blurTargetsV[0].texture;
    
    // 5. Final composite to screen
    this.quadMesh.material = this.compositeMaterial;
    (this.compositeMaterial.uniforms.tScene as any).value = this.sceneTarget.texture;
    (this.compositeMaterial.uniforms.tBloom as any).value = finalBloom;
    renderer.setRenderTarget(null);
    this.renderQuad();
    
    // Restore state
    renderer.setRenderTarget(currentTarget);
    renderer.autoClear = currentAutoClear;
  }
  
  private renderQuad(): void {
    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    scene.add(this.quadMesh);
    this.renderer.render(scene, camera);
    scene.remove(this.quadMesh);
  }
  
  public resize(width: number, height: number): void {
    if (!this.enabled) return;
    
    const pixelRatio = this.renderer.getPixelRatio();
    const w = Math.floor(width * pixelRatio);
    const h = Math.floor(height * pixelRatio);
    
    this.sceneTarget.setSize(w, h);
    this.brightTarget.setSize(Math.floor(w / 2), Math.floor(h / 2));
    
    let bw = Math.floor(w / 2);
    let bh = Math.floor(h / 2);
    for (let i = 0; i < this.bloomLevels; i++) {
      bw = Math.max(1, Math.floor(bw / 2));
      bh = Math.max(1, Math.floor(bh / 2));
      this.blurTargetsH[i].setSize(bw, bh);
      this.blurTargetsV[i].setSize(bw, bh);
    }
    
    (this.compositeMaterial.uniforms.resolution as any).value.set(w, h);
  }
  
  public setFade(value: number): void {
    this.fadeUniform.value = value;
  }
  
  public setTime(value: number): void {
    this.timeUniform.value = value;
  }
  
  public dispose(): void {
    if (!this.enabled) return;
    
    this.sceneTarget.dispose();
    this.brightTarget.dispose();
    this.blurTargetsH.forEach(t => t.dispose());
    this.blurTargetsV.forEach(t => t.dispose());
    this.quadGeometry.dispose();
    this.brightMaterial.dispose();
    this.blurMaterial.dispose();
    this.compositeMaterial.dispose();
  }
}
