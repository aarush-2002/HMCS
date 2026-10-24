import React, { useEffect, useRef } from "react";

/**
 * Film grain overlay — generated noise canvas at 5.5% opacity, overlay blend.
 * Renders once on mount; animates subtly if motion is allowed.
 */
export function FilmGrain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    const draw = () => {
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    draw();

    if (!prefersReduced) {
      const interval = setInterval(draw, 110);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="atmosphere-grain"
      aria-hidden="true"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

/**
 * The full atmosphere stack: grain + vignette + scrim.
 * Fixed to viewport, pointer-events none, aria-hidden.
 */
export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <FilmGrain />
      <div className="atmosphere-vignette" />
      <div className="atmosphere-scrim" />
    </div>
  );
}

/**
 * Section scrim — a faint dark wash behind text so it reads over any background.
 */
export function SectionScrim({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`scrim relative ${className}`}>
      {children}
    </div>
  );
}
