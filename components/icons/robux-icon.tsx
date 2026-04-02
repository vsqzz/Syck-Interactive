export function RobuxIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 2L36.5 11.5V28.5L20 38L3.5 28.5V11.5L20 2Z" fill="url(#rg1)" />
      <path d="M20 6L32.5 13V27L20 34L7.5 27V13L20 6Z" fill="url(#rg2)" />
      <path d="M20 9L30 14.5V25.5L20 31L10 25.5V14.5L20 9Z" fill="url(#rg3)" />
      <rect x="14" y="14" width="12" height="12" rx="1.5" fill="white" />
      <defs>
        <linearGradient id="rg1" x1="3.5" y1="2" x2="36.5" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B6914" />
          <stop offset="0.5" stopColor="#E8C55A" />
          <stop offset="1" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id="rg2" x1="7.5" y1="6" x2="32.5" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C9A227" />
          <stop offset="0.5" stopColor="#F5D778" />
          <stop offset="1" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id="rg3" x1="10" y1="9" x2="30" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4AF37" />
          <stop offset="0.5" stopColor="#FAE68A" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
    </svg>
  )
}
