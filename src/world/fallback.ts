/**
 * HMCS World Runtime — WebGL Fallback
 * CSS-based night sky for when WebGL is unavailable.
 */

export function showFallback(container: HTMLElement): void {
  // Add no-webgl class to document
  document.documentElement.classList.add('no-webgl');
  
  // Create fallback content
  const fallback = document.createElement('div');
  fallback.className = 'world-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  
  fallback.innerHTML = `
    <div class="fallback-sky"></div>
    <div class="fallback-moon"></div>
    <div class="fallback-glow glow-1"></div>
    <div class="fallback-glow glow-2"></div>
    <div class="fallback-glow glow-3"></div>
  `;
  
  container.appendChild(fallback);
  
  // Inject fallback styles
  const style = document.createElement('style');
  style.id = 'world-fallback-styles';
  style.textContent = `
    .no-webgl .world-fallback {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      background: linear-gradient(180deg, #050a0e 0%, #0a1520 100%);
    }
    
    .no-webgl .fallback-sky {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.3), transparent),
        radial-gradient(2px 2px at 60% 70%, rgba(255, 255, 255, 0.2), transparent),
        radial-gradient(1px 1px at 50% 50%, rgba(255, 255, 255, 0.4), transparent),
        radial-gradient(1px 1px at 80% 10%, rgba(255, 255, 255, 0.3), transparent),
        radial-gradient(2px 2px at 90% 60%, rgba(255, 255, 255, 0.2), transparent),
        radial-gradient(1px 1px at 33% 80%, rgba(255, 255, 255, 0.3), transparent);
      background-size: 250px 250px;
      animation: twinkle 8s ease-in-out infinite;
    }
    
    @keyframes twinkle {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    
    .no-webgl .fallback-moon {
      position: absolute;
      top: 15%;
      right: 20%;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #fff0c8, #f5d799);
      box-shadow: 
        0 0 40px rgba(255, 240, 200, 0.4),
        0 0 80px rgba(255, 240, 200, 0.2);
    }
    
    .no-webgl .fallback-glow {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(245, 165, 36, 0.3), transparent 70%);
      filter: blur(20px);
    }
    
    .no-webgl .glow-1 {
      bottom: 30%;
      left: 25%;
    }
    
    .no-webgl .glow-2 {
      bottom: 35%;
      left: 45%;
    }
    
    .no-webgl .glow-3 {
      bottom: 25%;
      right: 30%;
    }
    
    /* Hide canvas when fallback is shown */
    .no-webgl canvas {
      display: none !important;
    }
  `;
  
  document.head.appendChild(style);
}

export function hideFallback(container: HTMLElement): void {
  document.documentElement.classList.remove('no-webgl');
  
  const fallback = container.querySelector('.world-fallback');
  if (fallback) {
    fallback.remove();
  }
  
  const style = document.getElementById('world-fallback-styles');
  if (style) {
    style.remove();
  }
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}
