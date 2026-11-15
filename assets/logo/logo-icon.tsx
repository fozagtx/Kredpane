export default function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M6 3v18" />
        <path d="M6 12.4 17.4 3" />
        <path d="M6 11.6 18.4 21" />
      </g>
    </svg>
  );
}
