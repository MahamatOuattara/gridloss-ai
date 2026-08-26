export function LogoMark({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 100" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" fill="none">
        <line x1="28" y1="30" x2="66" y2="22" />
        <line x1="66" y1="22" x2="60" y2="60" />
        <line x1="60" y1="60" x2="24" y2="66" />
        <line x1="24" y1="66" x2="28" y2="30" />
        <line x1="28" y1="30" x2="60" y2="60" />
      </g>
      <line
        x1="60"
        y1="60"
        x2="82"
        y2="76"
        stroke="#FF6600"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="1 7"
      />
      <circle cx="82" cy="76" r="15.5" fill="none" stroke="#FF6600" strokeWidth="1.3" opacity="0.28" />
      <circle cx="82" cy="76" r="10.5" fill="none" stroke="#FF6600" strokeWidth="2" opacity="0.55" />
      <circle cx="28" cy="30" r="5.2" fill="currentColor" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="66" cy="22" r="5.2" fill="currentColor" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="24" cy="66" r="5.2" fill="currentColor" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="60" cy="60" r="5.2" fill="currentColor" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx="82" cy="76" r="5.8" fill="#FFFFFF" stroke="#FF6600" strokeWidth="3" />
    </svg>
  );
}

export function LogoMarkMono({ className = "w-10 h-10" }: { className?: string }) {
  return <LogoMark className={className} />;
}
