import { cn } from '@/lib/utils'

interface TudorMascotProps {
  className?: string
  pointing?: boolean
}

export function TudorMascot({ className, pointing = false }: TudorMascotProps) {
  return (
    <div className={cn('relative w-32 h-32 md:w-40 md:h-40 animate-float', className)}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        {/* Book Body (Blue Cover) */}
        <rect
          x="40"
          y="30"
          width="120"
          height="140"
          rx="15"
          fill="#0ea5e9"
          stroke="#0284c7"
          strokeWidth="4"
        />
        {/* Pages (White) */}
        <rect
          x="50"
          y="40"
          width="100"
          height="120"
          rx="8"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        <line x1="100" y1="40" x2="100" y2="160" stroke="#cbd5e1" strokeWidth="2" />

        {/* Smiling Face */}
        <path
          d="M 75 75 Q 80 65 85 75"
          fill="none"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 115 75 Q 120 65 125 75"
          fill="none"
          stroke="#0f172a"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 75 95 Q 100 120 125 95"
          fill="none"
          stroke="#0f172a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M 85 105 Q 100 125 115 105 Z" fill="#ef4444" />

        {/* Arms and Gloves */}
        {pointing ? (
          <>
            {/* Right Arm (Pointing up-left) */}
            <path
              d="M 150 100 Q 170 80 180 70"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="180" cy="70" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <rect
              x="175"
              y="65"
              width="15"
              height="6"
              rx="3"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1"
              transform="rotate(-30 180 70)"
            />
            {/* Pencil */}
            <g transform="translate(175, 55) rotate(-30)">
              <rect x="0" y="0" width="8" height="40" fill="#1e293b" />
              <polygon points="0,0 4,-10 8,0" fill="#fbbf24" />
              <polygon points="2,-5 4,-10 6,-5" fill="#0f172a" />
            </g>

            {/* Left Arm (Resting) */}
            <path
              d="M 50 110 Q 30 110 25 130"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="20" cy="135" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Arms Resting */}
            <path
              d="M 40 110 Q 20 110 25 130"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="20" cy="135" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />

            <path
              d="M 160 110 Q 180 110 175 130"
              fill="none"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <circle cx="180" cy="135" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  )
}
