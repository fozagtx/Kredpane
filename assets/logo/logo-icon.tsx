export default function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M5 3v18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M19 3L7.5 12 19 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
