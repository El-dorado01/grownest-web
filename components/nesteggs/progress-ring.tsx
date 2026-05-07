// components/nesteggs/progress-ring.tsx

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
}

export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
}: ProgressRingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clampedProgress / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground leading-none">
          {label ?? `${Math.round(clampedProgress)}%`}
        </span>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</span>
        )}
      </div>
    </div>
  )
}

interface SemiProgressRingProps {
  progress: number
  savedAmount: number
  targetAmount: number
  formatCurrency: (n: number) => string
}

export function SemiProgressRing({
  progress,
  savedAmount,
  targetAmount,
  formatCurrency,
}: SemiProgressRingProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const SIZE = 220
  const STROKE = 14
  const R = (SIZE - STROKE) / 2
  const cx = SIZE / 2
  const cy = SIZE / 2
  const halfCirc = Math.PI * R
  const progressArc = (clampedProgress / 100) * halfCirc

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE / 2 + STROKE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute top-0 left-0"
          style={{ overflow: 'visible' }}
        >
          {/* Track semicircle */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={`${halfCirc} ${Math.PI * R * 2}`}
            strokeLinecap="round"
            className="text-border"
            transform={`rotate(180 ${cx} ${cy})`}
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeDasharray={`${progressArc} ${Math.PI * R * 2}`}
            strokeLinecap="round"
            className="text-primary transition-all duration-700 ease-out"
            transform={`rotate(180 ${cx} ${cy})`}
          />
        </svg>
        {/* Labels */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-2">
          <span className="text-4xl font-extrabold text-foreground leading-none">
            {Math.round(clampedProgress)}%
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {formatCurrency(savedAmount)} of {formatCurrency(targetAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
