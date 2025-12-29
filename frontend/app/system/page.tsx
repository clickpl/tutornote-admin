'use client';

import { useState, useEffect } from 'react';
import { Database, Zap, Bell, Server, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { systemApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface HealthStatus {
  status: string;
  components: {
    database: string;
    gemini_api: string;
    kakao_api: string;
    image_service?: string;
  };
  version?: string;
  timestamp?: string;
}

export default function SystemPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    const { data } = await systemApi.getHealth();
    if (data) setHealth(data);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-destructive" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'connected':
        return '연결됨';
      case 'operational':
      case 'healthy':
        return '정상';
      case 'pending':
        return '대기';
      case 'degraded':
        return '저하';
      default:
        return '오류';
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'connected':
      case 'operational':
      case 'healthy':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">시스템</h1>
          <p className="text-sm text-muted-foreground">시스템 상태 및 설정</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Overall Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      health?.status === 'healthy' ? 'bg-green-500/10' : 'bg-yellow-500/10'
                    }`}>
                      <Server className={`h-6 w-6 ${
                        health?.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                    </div>
                    <div>
                      <CardTitle>시스템 상태</CardTitle>
                      <Badge variant={getStatusVariant(health?.status || '')} className="mt-1">
                        {getStatusLabel(health?.status || '')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">버전</p>
                    <p className="font-mono text-sm">{health?.version || '1.0.0'}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Components */}
            <Card>
              <CardHeader>
                <CardTitle>컴포넌트 상태</CardTitle>
                <CardDescription>연결된 서비스 상태를 확인합니다</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Database */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">데이터베이스</p>
                      <p className="text-xs text-muted-foreground">MySQL</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(health?.components.database || '')}
                    <Badge variant={getStatusVariant(health?.components.database || '')}>
                      {getStatusLabel(health?.components.database || '')}
                    </Badge>
                  </div>
                </div>

                {/* Gemini API */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Zap className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium">Gemini API</p>
                      <p className="text-xs text-muted-foreground">AI 피드백 생성</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(health?.components.gemini_api || '')}
                    <Badge variant={getStatusVariant(health?.components.gemini_api || '')}>
                      {getStatusLabel(health?.components.gemini_api || '')}
                    </Badge>
                  </div>
                </div>

                {/* Kakao API */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                      <Bell className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">카카오 API</p>
                      <p className="text-xs text-muted-foreground">알림톡 발송</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(health?.components.kakao_api || '')}
                    <Badge variant={getStatusVariant(health?.components.kakao_api || '')}>
                      {getStatusLabel(health?.components.kakao_api || '')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Info */}
            <Card>
              <CardHeader>
                <CardTitle>관리자 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">관리자 이메일</span>
                  <span className="text-sm font-medium">admin@tutornote.kr</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">서버 시간</span>
                  <span className="text-sm font-medium">
                    {health?.timestamp
                      ? new Date(health.timestamp).toLocaleString('ko-KR')
                      : new Date().toLocaleString('ko-KR')
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
