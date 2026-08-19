interface IconProps {
  className?: string;
}

export function IconPlay({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.52.86l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.64A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}

export function IconPause({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <rect x="6" y="4.5" width="4.2" height="15" rx="1.2" />
      <rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" />
    </svg>
  );
}

export function IconRestart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 8.5A9 9 0 1 1 3 13" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 11 12 3.5 20.5 11" />
      <path d="M6 10v10h12V10" />
    </svg>
  );
}

export function IconSoundOn({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" stroke="none" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path d="M18 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}

export function IconSoundOff({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" stroke="none" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </svg>
  );
}

export function IconTrophy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 4h8v6a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H4.5v1.5A3.5 3.5 0 0 0 8 10M16 5h3.5v1.5A3.5 3.5 0 0 1 16 10" />
      <path d="M12 14v3M8.5 20h7M10 20v-3h4v3" />
    </svg>
  );
}

export function IconCrown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="m3 7 4.5 4L12 4.5 16.5 11 21 7l-1.6 10.2a1 1 0 0 1-1 .8H5.6a1 1 0 0 1-1-.8L3 7Z" />
    </svg>
  );
}

export function IconChevron({ className, dir }: IconProps & { dir: "up" | "down" | "left" | "right" }) {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ transform: `rotate(${rot}deg)` }} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 14.5 7-7 7 7" />
    </svg>
  );
}

export function SnakeLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="6" fill="#0e3524" stroke="#2aa95d" strokeWidth="1.5" />
      <rect x="6" y="8" width="6" height="6" rx="1.5" fill="#35c46f" />
      <rect x="12" y="8" width="6" height="6" rx="1.5" fill="#2aa95d" />
      <rect x="18" y="8" width="6" height="6" rx="1.5" fill="#2aa95d" />
      <rect x="18" y="14" width="6" height="6" rx="1.5" fill="#2aa95d" />
      <rect x="12" y="14" width="6" height="6" rx="1.5" fill="#8fdcae" />
      <rect x="6" y="14" width="6" height="6" rx="1.5" fill="#f2b23c" />
      <circle cx="8" cy="10.4" r="1" fill="#0a241a" />
      <circle cx="10.4" cy="10.4" r="1" fill="#0a241a" />
    </svg>
  );
}

export function AppleMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 7c-3.5-2-7 .5-7 4.5C5 16 8 20 10.2 20c.8 0 1.2-.4 1.8-.4s1 .4 1.8.4C16 20 19 16 19 11.5 19 7.5 15.5 5 12 7Z" fill="#e8503f" />
      <path d="M12 7c0-2 1-3.4 2.6-4" stroke="#6b4a26" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M13.5 5.5c1.8-.4 3 .2 3.6 1.6-1.6.6-3 0-3.6-1.6Z" fill="#3e9d4e" />
      <ellipse cx="9.4" cy="11" rx="1.3" ry="1.9" fill="rgba(255,255,255,0.4)" transform="rotate(-18 9.4 11)" />
    </svg>
  );
}
