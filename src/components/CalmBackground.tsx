import { Atmosphere } from './ui/Atmosphere';

/**
 * Calm Mode Background
 * Fixed layer behind content: blurred hostel scene at 12% opacity,
 * two soft radial glows (amber top-right, teal bottom-left),
 * then the global grain and vignette.
 */
export function CalmBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Blurred hostel scene at 12% opacity */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect fill='%23050a0e' width='800' height='600'/%3E%3Crect fill='%231a1f24' x='200' y='150' width='400' height='350' rx='4'/%3E%3Crect fill='%23f5a524' x='240' y='200' width='60' height='80' opacity='0.6'/%3E%3Crect fill='%23f5a524' x='340' y='200' width='60' height='80' opacity='0.4'/%3E%3Crect fill='%23f5a524' x='440' y='200' width='60' height='80' opacity='0.7'/%3E%3Crect fill='%23f5a524' x='240' y='320' width='60' height='80' opacity='0.5'/%3E%3Crect fill='%23f5a524' x='340' y='320' width='60' height='80' opacity='0.3'/%3E%3Crect fill='%23f5a524' x='440' y='320' width='60' height='80' opacity='0.6'/%3E%3Ccircle fill='%23fff0c8' cx='650' cy='100' r='40' opacity='0.3'/%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
        }}
      />

      {/* Amber glow top-right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(245, 165, 36, 0.15), transparent 70%)',
        }}
      />

      {/* Teal glow bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle, rgba(127, 180, 201, 0.1), transparent 70%)',
        }}
      />

      {/* Global grain and vignette */}
      <Atmosphere />
    </div>
  );
}
