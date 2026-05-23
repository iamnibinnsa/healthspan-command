export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute inset-0 drift-grid opacity-50" />
      <div className="absolute inset-0 particles" />
      <div className="absolute inset-x-0 h-32 scan-beam" />
      <div className="absolute inset-0 scanlines" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_50%,oklch(0.12_0.03_250/0.85)_100%)]" />
    </div>
  );
}
