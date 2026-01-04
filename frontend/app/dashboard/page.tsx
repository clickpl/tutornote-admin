'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Bell,
  Zap,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  academies: { total: number; new_this_month: number };
  students: { total: number; new_this_month: number };
  reports: { today: number; this_month: number };
  attendance: { today: number };
}

interface ActivityItem {
  time: string;
  category: string;
  content: string;
  status: string;
}

interface ApiHealth {
  gemini: {
    status: string;
    success_rate: number;
    avg_response_time: number;
    estimated_cost_this_month: number;
  };
  kakao: {
    channel_status: string;
    templates_pending: number;
    sent_today: number;
    success_rate: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [apiHealth, setApiHealth] = useState<ApiHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activityRes, healthRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getActivity(),
        dashboardApi.getApiHealth(),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (activityRes.data) setActivities(activityRes.data.activities);
      if (healthRes.data) setApiHealth(healthRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case '완료':
      case '성공':
        return 'default';
      case '대기':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '학원가입':
        return 'text-primary';
      case '보호자동의':
        return 'text-yellow-500';
      case 'AI 리포트':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">대시보드</h1>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            실시간
          </Badge>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* 핵심 지표 요약 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Building2}
                label="누적 학원"
                value={stats?.academies.total ?? 0}
                subtext={`이번 달 +${stats?.academies.new_this_month ?? 0}`}
                trend="up"
              />
              <StatCard
                icon={Users}
                label="누적 학생"
                value={stats?.students.total ?? 0}
                subtext={`이번 달 +${stats?.students.new_this_month ?? 0}`}
                trend="up"
              />
              <StatCard
                icon={FileText}
                label="오늘 리포트"
                value={stats?.reports.today ?? 0}
                subtext={`이번 달 ${stats?.reports.this_month ?? 0}건`}
              />
              <StatCard
                icon={Bell}
                label="알림톡 상태"
                value="대기중"
                subtext="카카오 심사 대기"
              />
            </div>

            {/* 서비스 건강도 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Claude AI */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                    <Zap className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Claude AI (피드백 생성)</CardTitle>
                    <CardDescription>AI 피드백 서비스 상태</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">성공률</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${apiHealth?.gemini.success_rate ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{apiHealth?.gemini.success_rate ?? 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">지연시간</span>
                    <span className="text-sm font-medium">{apiHealth?.gemini.avg_response_time ?? 0}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">이번 달 비용</span>
                    <span className="text-sm font-medium">${apiHealth?.gemini.estimated_cost_this_month?.toFixed(2) ?? '0.00'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 카카오 비즈니스 */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Bell className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">카카오 비즈니스/알림톡</CardTitle>
                    <CardDescription>알림톡 서비스 상태</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">채널</span>
                    <Badge variant={apiHealth?.kakao.channel_status === 'approved' ? 'default' : 'secondary'}>
                      {apiHealth?.kakao.channel_status === 'approved' ? '승인 완료' : '심사 대기'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">템플릿</span>
                    <span className="text-sm font-medium">{apiHealth?.kakao.templates_pending ?? 0}건 심사 중</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">오늘 발송</span>
                    <span className="text-sm font-medium">{apiHealth?.kakao.sent_today ?? 0}건</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 실시간 활동 피드 */}
            <Card>
              <CardHeader>
                <CardTitle>실시간 활동 피드</CardTitle>
                <CardDescription>최근 시스템 활동 내역</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>시간</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>활동 내용</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          최근 활동이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">{activity.time}</TableCell>
                          <TableCell className={`font-medium ${getCategoryColor(activity.category)}`}>
                            {activity.category}
                          </TableCell>
                          <TableCell>{activity.content}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(activity.status)}>
                              {activity.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        </div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}
