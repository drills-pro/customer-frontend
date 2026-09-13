export function Sparkline({ points }: { points: string }) {
  return (
    <svg
      viewBox="0 0 100 34"
      className="h-8 w-24 text-indigo-600"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
