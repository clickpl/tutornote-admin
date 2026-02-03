'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { notificationsApi } from '@/lib/api';
import type { TelegramChartData } from '../../_lib/types';

interface TelegramChartProps {
  onRefresh?: number;
}

export function TelegramChart({ onRefresh }: TelegramChartProps) {
  const [data, setData] = useState<TelegramChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const loadChart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.telegram.getChart(24);
      if (response.data) {
        setData(response.data.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('차트 데이터를 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChart();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-32 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-48 bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] bg-gray-100 dark:bg-gray-700" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[300px] text-red-500">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const typeLabels: Record<string, string> = {
    server_check: '서버 점검',
    daily_report: '일일 리포트',
    service_report: '서비스 리포트',
    error: '에러 알림',
  };

  const typeColors: Record<string, string> = {
    server_check: '#3B82F6',
    daily_report: '#10B981',
    service_report: '#8B5CF6',
    error: '#EF4444',
  };

  // 테마별 색상
  const colors = {
    grid: isDark ? '#374151' : '#E5E7EB',
    axis: isDark ? '#9CA3AF' : '#6B7280',
    tooltipBg: isDark ? '#1F2937' : '#FFFFFF',
    tooltipBorder: isDark ? '#374151' : '#E5E7EB',
    tooltipLabel: isDark ? '#F9FAFB' : '#111827',
    tooltipItem: isDark ? '#D1D5DB' : '#374151',
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">알림 현황</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">최근 24시간 알림 발송 통계</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            알림 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorServerCheck" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={isDark ? 0.3 : 0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={isDark ? 0.3 : 0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="hour"
                stroke={colors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis
                stroke={colors.axis}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: colors.tooltipBg,
                  border: `1px solid ${colors.tooltipBorder}`,
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: colors.tooltipLabel }}
                itemStyle={{ color: colors.tooltipItem }}
                formatter={(value, name) => {
                  const label = typeLabels[name as string] || name;
                  return [`${value ?? 0}건`, label];
                }}
              />
              <Legend
                formatter={(value) => typeLabels[value] || value}
                wrapperStyle={{ color: colors.axis }}
              />
              <Area
                type="monotone"
                dataKey="server_check"
                stroke={typeColors.server_check}
                fill="url(#colorServerCheck)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="error"
                stroke={typeColors.error}
                fill="url(#colorError)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
