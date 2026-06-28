/**
 * Ambient app background: two soft accent blooms + a faint noise texture.
 * Fixed behind all content (-z-10), non-interactive. The blooms + grain are
 * what make flat #0A0A0B read as "expensive" instead of "empty".
 */
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-bg-primary">
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[#6366F1]/[0.07] blur-[130px]" />
      <div className="absolute bottom-[-10rem] right-[-8rem] h-[420px] w-[420px] rounded-full bg-[#8B5CF6]/[0.05] blur-[130px]" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: NOISE }} />
    </div>
  );
}
