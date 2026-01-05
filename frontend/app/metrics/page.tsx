'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Share2,
  Clock,
  AlertTriangle,
  Crown,
  Eye,
  FileText,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { metricsApi, MetricsOverview, ChurnRiskAcademy, HeavyUserAcademy } from '@/lib/api';
import { formatKSTDateOnly } from '@/lib/utils';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Phase 2 완료 시 true로 변경하여 페이지 활성화
const ENABLE_METRICS_PAGE = false;

export default function MetricsPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [churnRisk, setChurnRisk] = useState<ChurnRiskAcademy[]>([]);
  const [heavyUsers, setHeavyUsers] = useState<HeavyUserAcademy[]>([]);
  const [loading, setLoading] = useState(true);

  // Phase 2 완료 전까지 대시보드로 리다이렉트
  useEffect(() => {
    if (!ENABLE_METRICS_PAGE) {
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (ENABLE_METRICS_PAGE) {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, churnRes, heavyRes] = await Promise.all([
        metricsApi.getOverview(),
        metricsApi.getChurnRisk(),
        metricsApi.getHeavyUsers(),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (churnRes.data) setChurnRisk(churnRes.data.academies);
      if (heavyRes.data) setHeavyUsers(heavyRes.data.academies);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">인사이트 지표</h1>
            <p className="text-muted-foreground">
              서비스 성장과 수익화를 위한 핵심 지표
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3 w-3" />
            실시간 분석
          </Badge>
        </div>

        {/* 1. 리텐션 및 고착도 지표 */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            리텐션 및 고착도
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Activity}
              iconColor="text-blue-500"
              label="DAU / MAU"
              value={`${overview?.retention.dau ?? 0} / ${overview?.retention.mau ?? 0}`}
              subtext="일간/월간 활성 학원"
            />
            <MetricCard
              icon={TrendingUp}
              iconColor="text-green-500"
              label="학원 고착도"
              value={overview?.retention.stickiness_label ?? '0%'}
              subtext="DAU/MAU 비율 (높을수록 좋음)"
              highlight={(overview?.retention.stickiness ?? 0) > 20}
            />
            <MetricCard
              icon={Users}
              iconColor="text-purple-500"
              label="리포트 리텐션"
              value={overview?.retention.retention_label ?? '0%'}
              subtext="2주 내 재발행 학원 비율"
            />
            <MetricCard
              icon={AlertTriangle}
              iconColor="text-orange-500"
              label="이탈 징후"
              value={overview?.retention.churn_risk_count ?? 0}
              subtext="7일간 활동 없는 학원"
              warning={(overview?.retention.churn_risk_count ?? 0) > 0}
            />
          </div>
        </div>

        {/* 2. 콘텐츠 전파력 지표 */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-pink-500" />
            콘텐츠 전파력
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={FileText}
              iconColor="text-pink-500"
              label="카드뉴스 생성"
              value={overview?.viral.cardnews_count ?? 0}
              subtext="생성된 카드뉴스 이미지"
            />
            <MetricCard
              icon={Share2}
              iconColor="text-cyan-500"
              label="리포트 공유"
              value={overview?.viral.total_shares ?? 0}
              subtext="학부모에게 공유된 링크"
            />
            <MetricCard
              icon={Eye}
              iconColor="text-indigo-500"
              label="학부모 열람률"
              value={overview?.viral.ctr_label ?? '0%'}
              subtext="공유 대비 실제 열람 비율"
              highlight={(overview?.viral.share_ctr ?? 0) > 50}
            />
            <MetricCard
              icon={TrendingUp}
              iconColor="text-teal-500"
              label="총 열람수"
              value={overview?.viral.total_views ?? 0}
              subtext="학부모 페이지 조회 합계"
            />
          </div>
        </div>

        {/* 3. AI 효율성 지표 */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            AI 효율성 및 가치
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={FileText}
              iconColor="text-emerald-500"
              label="총 AI 리포트"
              value={overview?.ai_efficiency.total_reports ?? 0}
              subtext="생성된 피드백 수"
            />
            <MetricCard
              icon={Clock}
              iconColor="text-amber-500"
              label="절감된 시간"
              value={overview?.ai_efficiency.time_saved_label ?? '0시간'}
              subtext="리포트당 9분 × 총 리포트 수"
            />
            <MetricCard
              icon={ShieldCheck}
              iconColor="text-green-600"
              label="동의 완료율"
              value={overview?.ai_efficiency.consent_label ?? '0%'}
              subtext="보호자 동의 완료 비율"
              highlight={(overview?.ai_efficiency.consent_rate ?? 0) > 80}
            />
            <MetricCard
              icon={Activity}
              iconColor="text-slate-500"
              label="학원당 평균"
              value={overview?.ai_efficiency.avg_reports_per_academy ?? 0}
              subtext="활성 학원당 월 리포트 수"
            />
          </div>
        </div>

        {/* 4. 수익화 준비 지표 */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            수익화 준비
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Crown}
              iconColor="text-yellow-500"
              label="헤비 유저"
              value={overview?.monetization.heavy_users ?? 0}
              subtext="월 20건+ 리포트 학원"
              highlight={(overview?.monetization.heavy_users ?? 0) > 0}
            />
            <MetricCard
              icon={TrendingUp}
              iconColor="text-yellow-600"
              label="헤비 유저 비율"
              value={overview?.monetization.heavy_user_label ?? '0%'}
              subtext="MAU 대비 유료 전환 유망"
            />
            <MetricCard
              icon={Users}
              iconColor="text-blue-500"
              label="월간 활성 학원"
              value={overview?.monetization.mau ?? 0}
              subtext="이번 달 활동 학원"
            />
            <MetricCard
              icon={Activity}
              iconColor="text-slate-400"
              label="알림톡 전환율"
              value="준비중"
              subtext="추가 충전 의사 분석"
            />
          </div>
        </div>

        {/* 상세 분석 탭 */}
        <Tabs defaultValue="churn" className="mt-8">
          <TabsList>
            <TabsTrigger value="churn" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              이탈 징후 학원
            </TabsTrigger>
            <TabsTrigger value="heavy" className="gap-2">
              <Crown className="h-4 w-4" />
              헤비 유저 학원
            </TabsTrigger>
          </TabsList>

          <TabsContent value="churn">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  이탈 징후 학원 ({churnRisk.length}개)
                </CardTitle>
                <CardDescription>
                  최근 7일간 활동이 없는 학원 목록 - 선제적 CS 지원 필요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학원명</TableHead>
                      <TableHead>원장</TableHead>
                      <TableHead>학생 수</TableHead>
                      <TableHead>총 리포트</TableHead>
                      <TableHead>마지막 활동</TableHead>
                      <TableHead>비활성 기간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnRisk.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          이탈 징후 학원이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      churnRisk.map((academy) => (
                        <TableRow key={academy.id}>
                          <TableCell className="font-medium">{academy.name}</TableCell>
                          <TableCell>{academy.owner_name || '-'}</TableCell>
                          <TableCell>{academy.student_count}</TableCell>
                          <TableCell>{academy.total_reports}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {academy.last_activity
                              ? formatKSTDateOnly(academy.last_activity)
                              : '없음'}
                          </TableCell>
                          <TableCell>
                            {academy.days_inactive !== null ? (
                              <Badge variant={academy.days_inactive > 14 ? 'destructive' : 'secondary'}>
                                {academy.days_inactive}일
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heavy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  헤비 유저 학원 ({heavyUsers.length}개)
                </CardTitle>
                <CardDescription>
                  월 20건 이상 리포트 발행 - 유료 전환 유망 학원
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학원명</TableHead>
                      <TableHead>원장</TableHead>
                      <TableHead>학생 수</TableHead>
                      <TableHead>월간 리포트</TableHead>
                      <TableHead>총 공유</TableHead>
                      <TableHead>가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {heavyUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          헤비 유저 학원이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      heavyUsers.map((academy) => (
                        <TableRow key={academy.id}>
                          <TableCell className="font-medium">{academy.name}</TableCell>
                          <TableCell>{academy.owner_name || '-'}</TableCell>
                          <TableCell>{academy.student_count}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-yellow-500">
                              {academy.monthly_reports}건
                            </Badge>
                          </TableCell>
                          <TableCell>{academy.total_shares}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatKSTDateOnly(academy.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

function MetricCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtext,
  highlight,
  warning,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string | number;
  subtext: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <Card className={warning ? 'border-orange-500/50' : highlight ? 'border-green-500/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          warning ? 'bg-orange-500/10' : highlight ? 'bg-green-500/10' : 'bg-muted'
        }`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}
