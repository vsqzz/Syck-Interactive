export function PayPalIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* Back P (light blue) */}
      <path
        d="M9.5 3.5h5.8c2.4 0 3.9 1.3 3.6 3.6-.4 3-2.5 4.6-5.3 4.6H11l-1 5.8H7.2L9.5 3.5Z"
        fill="#009CDE"
      />
      {/* Front P (dark blue) */}
      <path
        d="M7.5 5.5h5.8c2.4 0 3.9 1.3 3.6 3.6-.4 3-2.5 4.6-5.3 4.6H9l-1 5.8H5.2L7.5 5.5Z"
        fill="#003087"
      />
    </svg>
  )
}
