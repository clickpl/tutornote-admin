'use client';

import { useState } from 'react';
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
import { AlertTriangle, Zap, TrendingUp, Phone } from 'lucide-react';
import {
  AtRiskAcademy,
  ActiveAcademy,
  OnboardingFunnelAcademy,
} from '@/lib/api';

interface DashboardTablesProps {
  atRiskAcademies: AtRiskAcademy[];
  activeAcademies: ActiveAcademy[];
  onboardingAcademies: OnboardingFunnelAcademy[];
  funnelSummary?: {
    signup: number;
    student_added: number;
    report_created: number;
    shared: number;
  };
  conversionRates?: {
    signup_to_student: number;
    student_to_report: number;
    report_to_share: number;
    overall: number;
  };
  loading?: boolean;
}

export default function DashboardTables({
  atRiskAcademies,
  activeAcademies,
  onboardingAcademies,
  funnelSummary,
  conversionRates,
  loading = false,
}: DashboardTablesProps) {
  const [activeTab, setActiveTab] = useState('at-risk');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">위험</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">주의</Badge>;
      default:
        return <Badge variant="outline">관심</Badge>;
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      login: '로그인',
      report: '리포트',
      attendance: '출석',
      student: '학생등록',
      progress: '수업기록',
      signup: '가입',
    };
    return labels[type] || type;
  };

  const getStepBadge = (step: number) => {
    const steps = ['가입만', '학생 등록', '리포트 생성', '공유 완료'];
    const colors = ['bg-gray-100', 'bg-blue-100', 'bg-yellow-100', 'bg-green-100'];
    const textColors = ['text-gray-600', 'text-blue-600', 'text-yellow-600', 'text-green-600'];
    return (
      <Badge variant="outline" className={`${colors[step - 1]} ${textColors[step - 1]}`}>
        {steps[step - 1]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          학원 상세 현황
        </CardTitle>
        <CardDescription>
          이탈 위험 학원, 활성 학원, 온보딩 퍼널 분석
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="at-risk" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              이탈 위험 ({atRiskAcademies.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <Zap className="h-4 w-4" />
              활성 학원 ({activeAcademies.length})
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              온보딩 퍼널 ({onboardingAcademies.length})
            </TabsTrigger>
          </TabsList>

          {/* 이탈 위험 학원 */}
          <TabsContent value="at-risk" className="mt-4">
            {/* 범례 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium mb-2">판단 기준</div>
              <div className="text-muted-foreground mb-2">
                가입 7일 이상 경과 + 최근 7일간 활동 없음 (로그인, 학생등록, 리포트, 출석, 수업기록)
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">위험</Badge>
                  <span className="text-muted-foreground">21일 이상</span>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 text-xs">주의</Badge>
                  <span className="text-muted-foreground">14~20일</span>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">관심</Badge>
                  <span className="text-muted-foreground">7~13일</span>
                </span>
              </div>
            </div>
            {atRiskAcademies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                이탈 위험 학원이 없습니다
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원명</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>학생수</TableHead>
                    <TableHead>무활동 일수</TableHead>
                    <TableHead>위험도</TableHead>
                    <TableHead>마지막 활동</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atRiskAcademies.slice(0, 10).map((academy) => (
                    <TableRow key={academy.id}>
                      <TableCell className="font-medium">{academy.academy_name}</TableCell>
                      <TableCell>{academy.owner_name}</TableCell>
                      <TableCell>{academy.student_count}명</TableCell>
                      <TableCell className="text-red-500 font-medium">
                        {academy.inactive_days}일
                      </TableCell>
                      <TableCell>{getRiskBadge(academy.risk_level)}</TableCell>
                      <TableCell className="text-sm">
                        <div className="text-muted-foreground">
                          {academy.last_activity
                            ? new Date(academy.last_activity).toLocaleDateString('ko-KR')
                            : '-'}
                        </div>
                        {academy.last_activity_type && (
                          <div className="text-xs text-blue-500">
                            {getActivityTypeLabel(academy.last_activity_type)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* 활성 학원 */}
          <TabsContent value="active" className="mt-4">
            {/* 범례 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium mb-2">판단 기준</div>
              <div className="text-muted-foreground mb-2">
                최근 7일 내 활동 기록이 있는 학원 (로그인, 학생등록, 리포트, 출석, 수업기록)
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-600 text-xs">헤비유저</Badge>
                  <span className="text-muted-foreground">월 20건 이상 리포트</span>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="default" className="text-xs">Pro</Badge>
                  <span className="text-muted-foreground">월 50건+</span>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs">Standard</Badge>
                  <span className="text-muted-foreground">월 20~49건</span>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs">Free</Badge>
                  <span className="text-muted-foreground">월 20건 미만</span>
                </span>
              </div>
            </div>
            {activeAcademies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                활성 학원이 없습니다
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원명</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>학생수</TableHead>
                    <TableHead>월간 리포트</TableHead>
                    <TableHead>공유 수</TableHead>
                    <TableHead>추천 플랜</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAcademies.slice(0, 10).map((academy) => (
                    <TableRow key={academy.id}>
                      <TableCell className="font-medium">
                        {academy.academy_name}
                        {academy.is_heavy_user && (
                          <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-600">
                            헤비유저
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{academy.owner_name}</TableCell>
                      <TableCell>{academy.student_count}명</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {academy.monthly_reports}건
                      </TableCell>
                      <TableCell>{academy.total_shares}회</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            academy.recommended_plan === 'Pro'
                              ? 'default'
                              : academy.recommended_plan === 'Standard'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {academy.recommended_plan}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* 온보딩 퍼널 */}
          <TabsContent value="funnel" className="mt-4">
            {/* 범례 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium mb-2">판단 기준</div>
              <div className="text-muted-foreground">
                최근 30일 내 신규 가입 학원의 온보딩 진행 현황
              </div>
            </div>
            {/* 퍼널 요약 */}
            {funnelSummary && conversionRates && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold">{funnelSummary.signup}</div>
                  <div className="text-sm text-muted-foreground">가입</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{funnelSummary.student_added}</div>
                  <div className="text-sm text-muted-foreground">학생 등록</div>
                  <div className="text-xs text-blue-500">{conversionRates.signup_to_student}%</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{funnelSummary.report_created}</div>
                  <div className="text-sm text-muted-foreground">리포트 생성</div>
                  <div className="text-xs text-yellow-500">{conversionRates.student_to_report}%</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{funnelSummary.shared}</div>
                  <div className="text-sm text-muted-foreground">공유 완료</div>
                  <div className="text-xs text-green-500">{conversionRates.report_to_share}%</div>
                </div>
              </div>
            )}

            {onboardingAcademies.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                최근 30일 내 신규 학원이 없습니다
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원명</TableHead>
                    <TableHead>대표자</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>학생수</TableHead>
                    <TableHead>리포트</TableHead>
                    <TableHead>현재 단계</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardingAcademies.slice(0, 10).map((academy) => (
                    <TableRow key={academy.id}>
                      <TableCell className="font-medium">{academy.academy_name}</TableCell>
                      <TableCell>{academy.owner_name}</TableCell>
                      <TableCell>
                        {new Date(academy.signup_date).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell>{academy.student_count}명</TableCell>
                      <TableCell>{academy.report_count}건</TableCell>
                      <TableCell>{getStepBadge(academy.current_step)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
