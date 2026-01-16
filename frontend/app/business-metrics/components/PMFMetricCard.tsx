'use client';

import { Card, CardContent } from '@/components/ui/card';
import CircularGauge from './CircularGauge';

interface PMFMetricCardProps {
  title: string;
  target: string;
  current: number | null;
  targetValue: number;
  unit?: string;
  status: 'green' | 'yellow' | 'red' | 'gray';
  disabled?: boolean;
  disabledText?: string;
  size?: 'large' | 'small';
}

const statusBadge = {
  green: { bg: 'bg-green-500', label: '달성' },
  yellow: { bg: 'bg-yellow-500', label: '주의' },
  red: { bg: 'bg-red-500', label: '위험' },
  gray: { bg: 'bg-gray-400', label: '비활성' },
};

export default function PMFMetricCard({
  title,
  target,
  current,
  targetValue,
  unit = '%',
  status,
  disabled = false,
  disabledText = '준비 중',
  size = 'large',
}: PMFMetricCardProps) {
  const badge = statusBadge[status];
  const isSmall = size === 'small';

  // Size-based values
  const gaugeSize = isSmall ? 80 : 120;
  const gaugeStrokeWidth = isSmall ? 6 : 8;
  const containerHeight = isSmall ? 80 : 120;

  return (
    <Card className="relative overflow-hidden">
      {/* Status badge */}
      <div className={`absolute ${isSmall ? 'right-2 top-2' : 'right-3 top-3'}`}>
        <div className={`${isSmall ? 'h-2 w-2' : 'h-3 w-3'} rounded-full ${badge.bg}`} title={badge.label} />
      </div>

      <CardContent className={`flex flex-col items-center ${isSmall ? 'p-4' : 'p-6'}`}>
        {disabled ? (
          <>
            <div className="flex items-center justify-center" style={{ height: containerHeight }}>
              <span className={`${isSmall ? 'text-sm' : 'text-lg'} text-muted-foreground`}>{disabledText}</span>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">목표: {target}</p>
            </div>
          </>
        ) : (
          <>
            <CircularGauge
              value={current ?? 0}
              target={targetValue}
              status={status}
              unit={unit}
              size={gaugeSize}
              strokeWidth={gaugeStrokeWidth}
            />
            <div className="mt-2 text-center">
              <p className="text-xs text-muted-foreground">목표: {target}</p>
            </div>
          </>
        )}
        <p className={`${isSmall ? 'mt-2 text-xs' : 'mt-3 text-sm'} font-medium`}>{title}</p>
      </CardContent>
    </Card>
  );
}
