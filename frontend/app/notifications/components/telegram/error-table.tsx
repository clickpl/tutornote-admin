'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { notificationsApi } from '@/lib/api';
import type { TelegramErrorResponse, TelegramErrorFilters, TelegramSeverity } from '../../_lib/types';

interface TelegramErrorTableProps {
  onRefresh?: number;
}

const severityConfig: Record<TelegramSeverity, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  critical: {
    icon: <AlertOctagon className="w-4 h-4" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
    label: '심각',
  },
  high: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    label: '높음',
  },
  medium: {
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
    label: '보통',
  },
  low: {
    icon: <Info className="w-4 h-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    label: '낮음',
  },
};

export function TelegramErrorTable({ onRefresh }: TelegramErrorTableProps) {
  const [data, setData] = useState<TelegramErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TelegramErrorFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const loadErrors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.telegram.getErrors(page, filters);
      if (response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('에러 이력을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors, onRefresh]);

  const handleFilterChange = (key: keyof TelegramErrorFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading && !data) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
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

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              에러 알림 이력
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {data?.summary && (
                <span className="flex items-center gap-3 mt-1">
                  <span className="text-red-600 dark:text-red-400">심각 {data.summary.critical}</span>
                  <span className="text-orange-600 dark:text-orange-400">높음 {data.summary.high}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">보통 {data.summary.medium}</span>
                  <span className="text-blue-600 dark:text-blue-400">낮음 {data.summary.low}</span>
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-gray-300 dark:border-gray-600 ${hasActiveFilters ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            필터
            {hasActiveFilters && (
              <Badge className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">심각도</label>
                <Select
                  value={filters.severity || 'all'}
                  onValueChange={(v) => handleFilterChange('severity', v === 'all' ? undefined : v as TelegramSeverity)}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="critical">심각</SelectItem>
                    <SelectItem value="high">높음</SelectItem>
                    <SelectItem value="medium">보통</SelectItem>
                    <SelectItem value="low">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">시작일</label>
                <Input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">종료일</label>
                <Input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  필터 초기화
                </Button>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* 에러 목록 */}
        {data?.items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            에러 알림이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((item) => {
              const severity = severityConfig[item.severity];
              return (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-0.5 ${severity.color}`}>
                        {severity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${severity.bgColor} ${severity.color} text-xs`}>
                            {severity.label}
                          </Badge>
                          {item.error_code && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {item.error_code}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {item.message}
                        </p>
                        {item.academy_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            학원: {item.academy_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(item.sent_at)}
                      </p>
                      {item.status === 'failed' && (
                        <Badge className="mt-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">
                          발송 실패
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 페이지네이션 */}
        {data && data.pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {data.pagination.total.toLocaleString()}건 중{' '}
              {((page - 1) * data.pagination.page_size + 1).toLocaleString()}-
              {Math.min(page * data.pagination.page_size, data.pagination.total).toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {page} / {data.pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.total_pages, p + 1))}
                disabled={page === data.pagination.total_pages || isLoading}
                className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
