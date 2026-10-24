/**
 * HMCS Live Viewport Cards
 * Each card is a window onto a different corner of the scene, rendered into its own render target.
 * Re-renders only on hover or slow rota, never every frame.
 */

import * as THREE from 'three';

export interface ViewportCard {
  id: string;
  element: HTMLElement;
  camera: THREE.PerspectiveCamera;
  renderTarget: THREE.WebGLRenderTarget;
  needsRender: boolean;
  lastRenderTime: number;
  isHovered: boolean;
}

export class ViewportCards {
  private cards: ViewportCard[] = [];
  private renderer: THREE.WebGLRenderer;
  private rotaInterval = 2000; // Re-render each card every 2 seconds
  private lastRotaTime = 0;
  private rotaIndex = 0;

  constructor(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer;
  }

  /**
   * Add a viewport card
   */
  public addCard(
    id: string,
    element: HTMLElement,
    cameraPosition: THREE.Vector3,
    lookAt: THREE.Vector3,
    fov: number = 50
  ): void {
    // Create camera for this card
    const aspect = element.clientWidth / element.clientHeight;
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    camera.position.copy(cameraPosition);
    camera.lookAt(lookAt);

    // Create render target
    const renderTarget = new THREE.WebGLRenderTarget(
      element.clientWidth * window.devicePixelRatio,
      element.clientHeight * window.devicePixelRatio,
      {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      }
    );

    const card: ViewportCard = {
      id,
      element,
      camera,
      renderTarget,
      needsRender: true,
      lastRenderTime: 0,
      isHovered: false,
    };

    // Set up hover detection
    element.addEventListener('mouseenter', () => {
      card.isHovered = true;
      card.needsRender = true;
    });

    element.addEventListener('mouseleave', () => {
      card.isHovered = false;
    });

    // Create canvas to display the render target
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    element.appendChild(canvas);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(() => {
      this.resizeCard(card);
    });
    resizeObserver.observe(element);

    this.cards.push(card);
  }

  /**
   * Resize a card's render target
   */
  private resizeCard(card: ViewportCard): void {
    const width = card.element.clientWidth;
    const height = card.element.clientHeight;

    card.camera.aspect = width / height;
    card.camera.updateProjectionMatrix();

    card.renderTarget.setSize(
      width * window.devicePixelRatio,
      height * window.devicePixelRatio
    );

    card.needsRender = true;
  }

  /**
   * Check if card element is visible
   */
  private isCardVisible(card: ViewportCard): boolean {
    const rect = card.element.getBoundingClientRect();
    const isVisible =
      rect.top < window.innerHeight &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.right > 0;

    // Check opacity
    const style = window.getComputedStyle(card.element);
    const opacity = parseFloat(style.opacity);

    return isVisible && opacity > 0.1;
  }

  /**
   * Update all cards (called every frame)
   */
  public update(scene: THREE.Scene, time: number): void {
    // Rota: re-render one card every rotaInterval
    if (time - this.lastRotaTime > this.rotaInterval) {
      this.lastRotaTime = time;
      
      // Find next visible card
      for (let i = 0; i < this.cards.length; i++) {
        const idx = (this.rotaIndex + i) % this.cards.length;
        const card = this.cards[idx];
        
        if (this.isCardVisible(card)) {
          card.needsRender = true;
          this.rotaIndex = (idx + 1) % this.cards.length;
          break;
        }
      }
    }

    // Render cards that need it
    this.cards.forEach(card => {
      if (!card.needsRender) return;
      if (!this.isCardVisible(card)) return;

      // Render scene from card's camera
      this.renderer.setRenderTarget(card.renderTarget);
      this.renderer.render(scene, card.camera);
      this.renderer.setRenderTarget(null);

      // Copy render target to card's canvas
      const canvas = card.element.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Read pixels from render target
          const width = card.renderTarget.width;
          const height = card.renderTarget.height;
          const pixels = new Uint8Array(width * height * 4);
          
          this.renderer.readRenderTargetPixels(
            card.renderTarget,
            0,
            0,
            width,
            height,
            pixels
          );

          // Create ImageData and draw to canvas
          const imageData = new ImageData(
            new Uint8ClampedArray(pixels.buffer),
            width,
            height
          );

          canvas.width = width;
          canvas.height = height;
          ctx.putImageData(imageData, 0, 0);
        }
      }

      card.needsRender = false;
      card.lastRenderTime = time;
    });
  }

  /**
   * Mark all cards as needing render (e.g., after scene change)
   */
  public invalidateAll(): void {
    this.cards.forEach(card => {
      card.needsRender = true;
    });
  }

  /**
   * Dispose all cards
   */
  public dispose(): void {
    this.cards.forEach(card => {
      card.renderTarget.dispose();
    });
    this.cards = [];
  }
}
