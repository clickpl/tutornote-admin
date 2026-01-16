'use client';

interface CircularGaugeProps {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  status: 'green' | 'yellow' | 'red' | 'gray';
  unit?: string;
}

const statusColors = {
  green: { stroke: '#22c55e', bg: '#22c55e20' },
  yellow: { stroke: '#eab308', bg: '#eab30820' },
  red: { stroke: '#ef4444', bg: '#ef444420' },
  gray: { stroke: '#6b7280', bg: '#6b728020' },
};

export default function CircularGauge({
  value,
  target,
  size = 120,
  strokeWidth = 8,
  status,
  unit = '%',
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / target) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  const colors = statusColors[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color: colors.stroke }}>
          {value !== null ? value : '-'}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
