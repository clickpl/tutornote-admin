'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { notificationsApi } from '@/lib/api';
import type { KakaoChartData } from '../../_lib/types';

interface KakaoChartProps {
  onRefresh?: number;
}

export function KakaoChart({ onRefresh }: KakaoChartProps) {
  const [data, setData] = useState<KakaoChartData[]>([]);
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
      const response = await notificationsApi.kakao.getChart(7);
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
          <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
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

  // 데이터 포맷팅 (날짜를 MM/DD 형식으로)
  const formattedData = data.map((item) => {
    const date = new Date(item.date);
    return {
      ...item,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });

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
        <CardTitle className="text-gray-900 dark:text-white">발송 추이</CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">최근 7일간 알림톡 발송 통계</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-gray-400">
            발송 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="displayDate"
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
                tickFormatter={(value) => `${value}`}
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
                  const label = name === 'success' ? '성공' : name === 'failed' ? '실패' : '전체';
                  return [`${value ?? 0}건`, label];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value) => {
                  if (value === 'success') return '성공';
                  if (value === 'failed') return '실패';
                  return value;
                }}
                wrapperStyle={{ color: colors.axis }}
              />
              <Bar
                dataKey="success"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="success"
              />
              <Bar
                dataKey="failed"
                fill="#EF4444"
                radius={[4, 4, 0, 0]}
                name="failed"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
