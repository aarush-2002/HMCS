/**
 * HMCS World Canvas — React Component
 * Mounts the Three.js world runtime and fully disposes it on unmount.
 */

import { useEffect, useRef, useState } from 'react';
import { WorldRuntime, isWebGLAvailable, showFallback, hideFallback } from '../world';
import type { SceneType } from '../world';

interface WorldCanvasProps {
  scene: SceneType;
  className?: string;
}

export function WorldCanvas({ scene, className = '' }: WorldCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<WorldRuntime | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check for ?nogl=1 query parameter
    const noGL = new URLSearchParams(window.location.search).get('nogl') === '1';
    
    if (noGL || !isWebGLAvailable()) {
      setWebglSupported(false);
      showFallback(container);
      return;
    }

    // Check quality preference
    const quality = new URLSearchParams(window.location.search).get('q') === 'low' ? 'low' : 'high';
    const postProcessing = new URLSearchParams(window.location.search).get('post') !== '0';

    try {
      // Create runtime
      runtimeRef.current = new WorldRuntime({
        container,
        scene,
        quality,
        postProcessing,
      });
    } catch (error) {
      console.error('[WorldCanvas] Failed to initialize WebGL:', error);
      setWebglSupported(false);
      showFallback(container);
    }

    // Cleanup on unmount
    return () => {
      if (runtimeRef.current) {
        runtimeRef.current.dispose();
        runtimeRef.current = null;
      }
      
      if (!webglSupported) {
        hideFallback(container);
      }
    };
  }, [scene]);

  return (
    <div
      ref={containerRef}
      className={`world-canvas-container ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
