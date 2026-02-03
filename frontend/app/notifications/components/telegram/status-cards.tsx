'use client';

import { useEffect, useState } from 'react';
import {
  Server,
  FileText,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  Settings,
  Power,
  PowerOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/lib/api';
import type { TelegramStatus, TelegramNotificationType } from '../../_lib/types';

interface TelegramStatusCardsProps {
  onRefresh?: number;
  onSettingsClick?: (type: TelegramNotificationType) => void;
}

const typeIcons: Record<TelegramNotificationType, React.ReactNode> = {
  server_check: <Server className="w-5 h-5" />,
  daily_report: <FileText className="w-5 h-5" />,
  service_report: <BarChart3 className="w-5 h-5" />,
  error: <AlertTriangle className="w-5 h-5" />,
};

const typeColors: Record<TelegramNotificationType, string> = {
  server_check: 'text-blue-500',
  daily_report: 'text-green-500',
  service_report: 'text-purple-500',
  error: 'text-red-500',
};

export function TelegramStatusCards({ onRefresh, onSettingsClick }: TelegramStatusCardsProps) {
  const [statuses, setStatuses] = useState<TelegramStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingType, setTogglingType] = useState<TelegramNotificationType | null>(null);

  const loadStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.telegram.getStatus();
      if (response.data) {
        setStatuses(response.data.types);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('상태를 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [onRefresh]);

  const handleToggle = async (type: TelegramNotificationType, currentEnabled: boolean) => {
    try {
      setTogglingType(type);
      const response = await notificationsApi.telegram.updateConfig({
        notification_type: type,
        is_enabled: !currentEnabled,
      });
      if (response.data?.success) {
        setStatuses((prev) =>
          prev.map((s) =>
            s.notification_type === type ? { ...s, is_enabled: !currentEnabled } : s
          )
        );
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setTogglingType(null);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    const date = new Date(timeStr);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatSchedule = (status: TelegramStatus) => {
    if (status.schedule_time) {
      return `매일 ${status.schedule_time.slice(0, 5)}`;
    }
    if (status.check_interval) {
      return `${status.check_interval}분마다`;
    }
    return '즉시';
  };

  const getDescription = (status: TelegramStatus) => {
    if (status.schedule_time) {
      return `매일 ${status.schedule_time.slice(0, 5)} 발송`;
    }
    if (status.check_interval) {
      return `${status.check_interval}분마다 서버 리소스 체크`;
    }
    if (status.notification_type === 'error') {
      return '서비스 에러 즉시 알림';
    }
    return status.description;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-gray-700 mb-2" />
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statuses.map((status) => (
        <Card key={status.notification_type} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span className={typeColors[status.notification_type]}>
                {typeIcons[status.notification_type]}
              </span>
              {status.name}
            </CardTitle>
            <Switch
              checked={status.is_enabled}
              onCheckedChange={() => handleToggle(status.notification_type, status.is_enabled)}
              disabled={togglingType === status.notification_type}
              className="data-[state=checked]:bg-green-500"
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {status.today_count}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">건</span>
              </div>
              {status.is_enabled ? (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
                  <Power className="w-3 h-3" />
                  활성
                </Badge>
              ) : (
                <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 gap-1">
                  <PowerOff className="w-3 h-3" />
                  비활성
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getDescription(status)}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-gray-600 dark:text-gray-300">{formatSchedule(status)}</span>
                {status.last_sent_at && (
                  <>
                    {' · '}최근 {formatTime(status.last_sent_at)}
                  </>
                )}
              </div>
              {onSettingsClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSettingsClick(status.notification_type)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            {status.today_failed > 0 && (
              <Badge className="mt-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
                실패 {status.today_failed}건
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
