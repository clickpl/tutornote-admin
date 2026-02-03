'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Send, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/lib/api';
import type { KakaoMetrics } from '../../_lib/types';

interface KakaoMetricsCardsProps {
  onRefresh?: number; // 새로고침 트리거
}

export function KakaoMetricsCards({ onRefresh }: KakaoMetricsCardsProps) {
  const [metrics, setMetrics] = useState<KakaoMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.kakao.getMetrics();
      if (response.data) {
        setMetrics(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('메트릭을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [onRefresh]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 bg-gray-200 dark:bg-gray-700 mb-2" />
              <Skeleton className="h-3 w-32 bg-gray-200 dark:bg-gray-700" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!metrics) return null;

  const trendValue = parseFloat(metrics.trend);
  const isTrendUp = trendValue > 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 카드 1: 채널 상태 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">채널 상태</CardTitle>
          <CheckCircle2 className={`h-4 w-4 ${
            metrics.channel_status === 'approved' ? 'text-green-500' :
            metrics.channel_status === 'pending' ? 'text-yellow-500' : 'text-red-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.channel_status === 'approved' ? '승인 완료' :
             metrics.channel_status === 'pending' ? '심사 중' : '거절'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            카카오 비즈니스 채널
          </p>
          <Badge
            className={`mt-2 ${
              metrics.channel_status === 'approved'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                : metrics.channel_status === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}
          >
            {metrics.channel_status === 'approved' ? '정상 운영' :
             metrics.channel_status === 'pending' ? '대기 중' : '재심사 필요'}
          </Badge>
        </CardContent>
      </Card>

      {/* 카드 2: 오늘 발송 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">오늘 발송</CardTitle>
          <Send className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.today_count}건</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className={isTrendUp ? 'text-green-600 dark:text-green-400' : trendValue < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
              {metrics.trend}%
            </span>
            {' '}어제 대비
          </p>
          {metrics.today_count > 0 && (
            <Progress
              value={(metrics.today_success / metrics.today_count) * 100}
              className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700"
            />
          )}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>성공 {metrics.today_success}</span>
            <span>실패 {metrics.today_failed}</span>
          </div>
        </CardContent>
      </Card>

      {/* 카드 3: 이번달 발송 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">이번달 발송</CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.month_count}건</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            비용: <span className="text-amber-600 dark:text-amber-400">{metrics.month_cost.toLocaleString()}원</span>
          </p>
          <div className="flex gap-2 mt-2">
            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
              성공 {metrics.month_success}
            </Badge>
            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
              실패 {metrics.month_failed}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 카드 4: 성공률 */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">성공률</CardTitle>
          <Activity className={`h-4 w-4 ${
            metrics.success_rate >= 95 ? 'text-green-500' :
            metrics.success_rate >= 80 ? 'text-yellow-500' : 'text-red-500'
          }`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${
            metrics.success_rate >= 95 ? 'text-green-600 dark:text-green-400' :
            metrics.success_rate >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>
            {metrics.success_rate}%
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            실패 {metrics.month_failed}건 / 전체 {metrics.month_count}건
          </p>
          <Badge
            className={`mt-2 ${
              metrics.success_rate >= 95
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                : metrics.success_rate >= 80
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}
          >
            {metrics.success_rate >= 95 ? '정상 범위' :
             metrics.success_rate >= 80 ? '주의 필요' : '점검 필요'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
