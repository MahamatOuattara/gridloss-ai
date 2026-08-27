import type { ReactNode } from "react";

type IconProps = { className?: string };

const base = "w-5 h-5 shrink-0";

function Svg({ className = base, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 16V5" />
      <path d="M8 9l4-4 4 4" />
      <path d="M4 18h16" />
    </Svg>
  );
}

export function IconDashboard({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="3" width="8" height="9" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="14" width="8" height="7" rx="1.5" />
    </Svg>
  );
}

export function IconMap({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 4l-5 2v14l5-2 6 2 5-2V4l-5 2-6-2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </Svg>
  );
}

export function IconSubstation({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20V9l8-5 8 5v11" />
      <path d="M9 20v-6h6v6" />
      <path d="M12 9v2" />
    </Svg>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.4-3.2 3.8-5 7-5s5.6 1.8 7 5" />
    </Svg>
  );
}

export function IconClipboard({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </Svg>
  );
}

export function IconLogout({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
      <path d="M12 12h9" />
      <path d="M17 8l4 4-4 4" />
    </Svg>
  );
}

export function IconPanelClose({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M15 9l-3 3 3 3" />
    </Svg>
  );
}

export function IconPanelOpen({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      <path d="M12 9l3 3-3 3" />
    </Svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export type NavIcon = typeof IconUpload;
