'use client';

import { useEffect, useState } from 'react';
import { FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { notificationsApi } from '@/lib/api';
import type { KakaoTemplate } from '../../_lib/types';

interface KakaoTemplatesCardProps {
  onRefresh?: number;
}

export function KakaoTemplatesCard({ onRefresh }: KakaoTemplatesCardProps) {
  const [templates, setTemplates] = useState<KakaoTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationsApi.kakao.getTemplates();
      if (response.data) {
        setTemplates(response.data.templates);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError('템플릿을 불러오는데 실패했습니다');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [onRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            승인
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
            심사중
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
            거절
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <Skeleton className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[200px] text-red-500">
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
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          템플릿 현황
        </CardTitle>
        <CardDescription className="text-gray-500 dark:text-gray-400">
          등록된 알림톡 템플릿 {templates.length}개
        </CardDescription>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-gray-400">
            등록된 템플릿이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(template.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {template.template_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.template_code}
                      {template.category && ` · ${template.category}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-white">{template.use_count.toLocaleString()}회</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {template.last_used_at ? `최근 ${formatDate(template.last_used_at)}` : '미사용'}
                    </p>
                  </div>
                  {getStatusBadge(template.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
