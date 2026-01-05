'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Alert {
  id: string;
  severity: 'critical' | 'warning';
  type: string;
  title: string;
  description: string;
  action: string;
  value: number;
  threshold: number;
  created_at: string;
  academy_id?: number;
}

interface AlertsResponse {
  alerts: Alert[];
  total_count: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

async function fetchAlerts(): Promise<AlertsResponse | null> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    const response = await fetch(`${API_URL}/api/admin/dashboard/alerts`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return null;
  }
}

export default function CriticalAlerts() {
  const router = useRouter();
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleAction = useCallback((alert: Alert) => {
    // AI 인텔리전스 페이지로 이동하여 해당 학원에 대한 조치 수행
    if (alert.academy_id) {
      router.push(`/ai-intelligence?academyId=${alert.academy_id}&type=${alert.type}&days=${alert.value}`);
    } else {
      router.push('/ai-intelligence');
    }
  }, [router]);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchAlerts();

    if (result) {
      setData(result);
      setLastUpdated(new Date());
    } else {
      setError('Alert 정보를 불러올 수 없습니다');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAlerts();

    // 1분마다 자동 갱신
    const interval = setInterval(loadAlerts, 60000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Loading state
  if (loading && !data) {
    return (
      <div className="mb-6">
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={loadAlerts}>
            <RefreshCw className="mr-2 h-4 w-4" />
            재시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No alerts - All systems normal
  if (!data || data.alerts.length === 0) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">모든 시스템 정상</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            {lastUpdated && (
              <span>마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAlerts}
              disabled={loading}
              className="text-green-700 hover:text-green-800 dark:text-green-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has alerts
  const criticalCount = data.alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = data.alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="mb-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Critical Alerts
          </h2>
          <span className="flex items-center gap-1">
            {criticalCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                {warningCount} warning
              </span>
            )}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          {lastUpdated && (
            <span>{lastUpdated.toLocaleTimeString('ko-KR')}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAlerts}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alert Cards */}
      {expanded && (
        <div className="space-y-3">
          {data.alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onAction }: { alert: Alert; onAction: (alert: Alert) => void }) {
  const isCritical = alert.severity === 'critical';

  return (
    <div
      className={`
        rounded-lg border-l-4 p-4
        ${isCritical
          ? 'border-red-500 bg-red-50 dark:bg-red-950'
          : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            {isCritical ? (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
            <h3
              className={`font-bold ${
                isCritical
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}
            >
              {alert.title}
            </h3>
          </div>
          <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
            {alert.description}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>권장 조치:</strong> {alert.action}
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {new Date(alert.created_at).toLocaleString('ko-KR')}
          </p>
        </div>

        <Button
          variant={isCritical ? 'destructive' : 'default'}
          size="sm"
          className={`ml-4 ${
            !isCritical &&
            'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
          }`}
          onClick={() => onAction(alert)}
        >
          조치하기
        </Button>
      </div>
    </div>
  );
}
