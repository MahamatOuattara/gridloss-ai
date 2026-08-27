const FRAMES = [
  { src: "/hero/city-night.png", label: "Abidjan, nuit" },
  { src: "/hero/powerlines.png", label: "Départ HTA" },
  { src: "/hero/aerial.png", label: "Orthophoto départ" },
  { src: "/hero/substation.png", label: "Poste source" },
];

const STRIP = [...FRAMES, ...FRAMES];

export default function CinematicBackdrop({
  dim = "left",
}: {
  dim?: "left" | "heavy";
}) {
  const overlay =
    dim === "heavy"
      ? "linear-gradient(180deg, rgba(4,8,18,0.72) 0%, rgba(4,8,18,0.82) 55%, rgba(4,8,18,0.92) 100%)"
      : "linear-gradient(100deg, rgba(4,8,18,0.94) 0%, rgba(4,8,18,0.78) 38%, rgba(4,8,18,0.38) 72%, rgba(4,8,18,0.55) 100%)";

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#040812]" aria-hidden>
      <div className="gl-film-track absolute inset-y-0 left-0 flex h-full">
        {STRIP.map((frame, i) => (
          <figure key={`${frame.src}-${i}`} className="relative h-full shrink-0" style={{ width: "72vw", minWidth: 520 }}>
            <img src={frame.src} alt="" className="h-full w-full object-cover" />
            <figcaption className="absolute bottom-6 left-6 text-[10px] uppercase tracking-[0.22em] text-white/70 font-semibold drop-shadow">
              {frame.label}
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: overlay }} />
      <div className="absolute inset-0 gl-scanlines pointer-events-none" />
    </div>
  );
}
