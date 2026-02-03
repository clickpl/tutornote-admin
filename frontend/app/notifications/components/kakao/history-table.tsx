'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
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
import type { KakaoHistoryResponse, KakaoHistoryFilters } from '../../_lib/types';

interface KakaoHistoryTableProps {
  onRefresh?: number;
}

export function KakaoHistoryTable({ onRefresh }: KakaoHistoryTableProps) {
  const [data, setData] = useState<KakaoHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<KakaoHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.kakao.getHistory(page, filters);
      if (response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('발송 이력을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, onRefresh]);

  const handleFilterChange = (key: keyof KakaoHistoryFilters, value: string | undefined) => {
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

  const maskPhone = (phone: string) => {
    if (phone.length >= 11) {
      return phone.slice(0, 3) + '-****-' + phone.slice(-4);
    }
    return phone;
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
              <Skeleton key={i} className="h-12 bg-gray-100 dark:bg-gray-700" />
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
            <CardTitle className="text-gray-900 dark:text-white">발송 이력</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              {data?.summary && (
                <>
                  전체 {data.summary.total_count.toLocaleString()}건 ·
                  성공 {data.summary.success_count.toLocaleString()} ·
                  실패 {data.summary.failed_count.toLocaleString()} ·
                  비용 {data.summary.total_cost.toLocaleString()}원
                </>
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
                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">상태</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(v) => handleFilterChange('status', v === 'all' ? undefined : v as 'success' | 'failed')}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="success">성공</SelectItem>
                    <SelectItem value="failed">실패</SelectItem>
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
        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">발송시간</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">학원</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">템플릿</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">수신자</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">상태</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-600 dark:text-gray-400">비용</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    발송 이력이 없습니다
                  </td>
                </tr>
              ) : (
                data?.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="py-3 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.sent_at)}
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-gray-900 dark:text-white truncate max-w-[120px]">
                        {item.academy_name}
                      </p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-gray-900 dark:text-white truncate max-w-[100px]">
                        {item.template_name || item.template_code}
                      </p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.receiver_name || maskPhone(item.phone)}
                      </p>
                    </td>
                    <td className="py-3 px-2">
                      {item.status === 'success' ? (
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          성공
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
                          <XCircle className="w-3 h-3" />
                          실패
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      {item.cost.toLocaleString()}원
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
