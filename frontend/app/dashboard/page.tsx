'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Send,
  Eye,
  Sparkles,
  TrendingUp,
  Award,
  CreditCard,
  Cpu,
  Wifi,
  BarChart3,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import CriticalAlerts from '@/components/dashboard/CriticalAlerts';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardTables from '@/components/dashboard/DashboardTables';
import { Badge } from '@/components/ui/badge';
import {
  dashboardMetricsApi,
  dashboardTablesApi,
  AcademyStatusMetrics,
  StudentStatsMetrics,
  ReportActivityMetrics,
  EngagementMetrics,
  ContentGenerationMetrics,
  ParentReachMetrics,
  AIEfficiencyMetrics,
  OnboardingFunnelMetrics,
  MonetizationMetrics,
  CostBreakdownMetrics,
  SystemHealthMetrics,
  ApiStatusMetrics,
  AtRiskAcademy,
  ActiveAcademy,
  OnboardingFunnelAcademy,
} from '@/lib/api';

export default function DashboardPage() {
  // 12개 지표 상태
  const [academyStatus, setAcademyStatus] = useState<AcademyStatusMetrics | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStatsMetrics | null>(null);
  const [reportActivity, setReportActivity] = useState<ReportActivityMetrics | null>(null);
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null);
  const [contentGeneration, setContentGeneration] = useState<ContentGenerationMetrics | null>(null);
  const [parentReach, setParentReach] = useState<ParentReachMetrics | null>(null);
  const [aiEfficiency, setAIEfficiency] = useState<AIEfficiencyMetrics | null>(null);
  const [onboardingFunnel, setOnboardingFunnel] = useState<OnboardingFunnelMetrics | null>(null);
  const [monetization, setMonetization] = useState<MonetizationMetrics | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatusMetrics | null>(null);

  // 테이블 데이터 상태
  const [atRiskAcademies, setAtRiskAcademies] = useState<AtRiskAcademy[]>([]);
  const [activeAcademies, setActiveAcademies] = useState<ActiveAcademy[]>([]);
  const [onboardingAcademies, setOnboardingAcademies] = useState<OnboardingFunnelAcademy[]>([]);
  const [funnelSummary, setFunnelSummary] = useState<{
    signup: number;
    owner_name: number;
    student_added: number;
    wizard_completed: number;
  } | null>(null);
  const [conversionRates, setConversionRates] = useState<{
    signup_to_name: number;
    name_to_student: number;
    student_to_complete: number;
    overall: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    fetchTables();
  }, []);

  const fetchMetrics = async () => {
    try {
      // 12개 지표 API 병렬 호출
      const [
        academyRes,
        studentRes,
        reportRes,
        engagementRes,
        contentRes,
        parentRes,
        aiRes,
        funnelRes,
        monetizationRes,
        costRes,
        healthRes,
        apiRes,
      ] = await Promise.all([
        dashboardMetricsApi.getAcademyStatus(),
        dashboardMetricsApi.getStudentStats(),
        dashboardMetricsApi.getReportActivity(),
        dashboardMetricsApi.getEngagement(),
        dashboardMetricsApi.getContentGeneration(),
        dashboardMetricsApi.getParentReach(),
        dashboardMetricsApi.getAIEfficiency(),
        dashboardMetricsApi.getOnboardingFunnel(),
        dashboardMetricsApi.getMonetization(),
        dashboardMetricsApi.getCostBreakdown(),
        dashboardMetricsApi.getSystemHealth(),
        dashboardMetricsApi.getApiStatus(),
      ]);

      if (academyRes.data) setAcademyStatus(academyRes.data);
      if (studentRes.data) setStudentStats(studentRes.data);
      if (reportRes.data) setReportActivity(reportRes.data);
      if (engagementRes.data) setEngagement(engagementRes.data);
      if (contentRes.data) setContentGeneration(contentRes.data);
      if (parentRes.data) setParentReach(parentRes.data);
      if (aiRes.data) setAIEfficiency(aiRes.data);
      if (funnelRes.data) setOnboardingFunnel(funnelRes.data);
      if (monetizationRes.data) setMonetization(monetizationRes.data);
      if (costRes.data) setCostBreakdown(costRes.data);
      if (healthRes.data) setSystemHealth(healthRes.data);
      if (apiRes.data) setApiStatus(apiRes.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const [atRiskRes, activeRes, funnelRes] = await Promise.all([
        dashboardTablesApi.getAtRiskAcademies(),
        dashboardTablesApi.getActiveAcademies(),
        dashboardTablesApi.getOnboardingFunnel(),
      ]);

      if (atRiskRes.data) setAtRiskAcademies(atRiskRes.data.academies);
      if (activeRes.data) setActiveAcademies(activeRes.data.academies);
      if (funnelRes.data) {
        setOnboardingAcademies(funnelRes.data.academies);
        setFunnelSummary(funnelRes.data.funnel_summary);
        setConversionRates(funnelRes.data.conversion_rates);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setTablesLoading(false);
    }
  };


  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Critical Alerts - 최상단 */}
        <CriticalAlerts />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">대시보드</h1>
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            실시간
          </Badge>
        </div>

        {/* 12개 핵심 지표 카드 - 4x3 Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Row 1: 학원/학생 + 리포트 */}
          <MetricCard
            icon={Building2}
            label="활성 학원"
            tooltip="최근 7일 내 로그인, 출석, 수업일지 중 하나라도 활동이 있는 학원 수"
            value={academyStatus?.active_academies ?? 0}
            subValue={`전체 ${academyStatus?.total_academies ?? 0} / 이탈 ${academyStatus?.churned_this_month ?? 0}`}
            trend="up"
            trendLabel={`+${academyStatus?.new_this_month ?? 0} 신규`}
            color="blue"
            loading={loading}
          />
          <MetricCard
            icon={Users}
            label="총 학생 수"
            tooltip="삭제되지 않은 전체 등록 학생 수 (현재 기준)"
            value={studentStats?.total_students?.toLocaleString() ?? 0}
            subValue={`학원당 평균 ${studentStats?.avg_per_academy?.toFixed(1) ?? 0}명`}
            trend="up"
            trendLabel={`+${studentStats?.new_this_month ?? 0}`}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={FileText}
            label="진도 저장"
            tooltip="이번 달 수업일지에서 진도를 저장한 횟수"
            value={`${reportActivity?.saved_month?.toLocaleString() ?? 0}건`}
            subValue={`오늘 ${reportActivity?.saved_today ?? 0} / 일평균 ${reportActivity?.avg_daily ?? 0}`}
            color="yellow"
            loading={loading}
          />
          <MetricCard
            icon={Sparkles}
            label="AI 수업일지"
            tooltip="이번 달 AI(Claude)로 수업일지를 자동 생성한 횟수"
            value={`${aiEfficiency?.ai_generated_month ?? 0}건`}
            subValue={`오늘 ${aiEfficiency?.ai_generated_today ?? 0} / 평균 ${aiEfficiency?.avg_generation_time?.toFixed(1) ?? 0}초`}
            color="purple"
            loading={loading}
          />

          {/* Row 2: 전송 + 사용자 행동 */}
          <MetricCard
            icon={Send}
            label="수업일지 전송"
            tooltip="이번 달 학부모에게 수업일지를 전송(카카오/링크)한 횟수"
            value={`${contentGeneration?.sent_month ?? 0}건`}
            subValue={`카카오 ${contentGeneration?.kakao_count ?? 0} / 링크 ${contentGeneration?.link_count ?? 0}`}
            color="orange"
            loading={loading}
          />
          <MetricCard
            icon={Eye}
            label="학부모 열람률"
            tooltip="이번 달 학부모 열람 수 / 공유한 수업일지 수 × 100"
            value={`${parentReach?.view_rate?.toFixed(1) ?? 0}%`}
            subValue={`${parentReach?.total_views ?? 0}회 열람 / ${parentReach?.total_shares ?? 0}회 공유`}
            trend={parentReach && parentReach.view_rate >= 50 ? 'up' : 'down'}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={BarChart3}
            label="종합 성장 지수"
            tooltip="(활성학원 성장률 + 학생 성장률 + 일지 성장률) / 3. 지난달 대비 이번달 증감률 평균"
            value={`${engagement?.growth_index?.toFixed(1) ?? 0}%`}
            subValue={`학원 ${engagement?.academy_growth ?? 0 > 0 ? '+' : ''}${engagement?.academy_growth ?? 0}% / 학생 ${engagement?.student_growth ?? 0 > 0 ? '+' : ''}${engagement?.student_growth ?? 0}% / 일지 ${engagement?.report_growth ?? 0 > 0 ? '+' : ''}${engagement?.report_growth ?? 0}%`}
            trend={engagement && engagement.growth_index > 0 ? 'up' : engagement && engagement.growth_index < 0 ? 'down' : 'neutral'}
            trendLabel="지난달 대비"
            color="purple"
            loading={loading}
          />
          <MetricCard
            icon={TrendingUp}
            label="온보딩 완료율"
            tooltip="이번 달 가입한 학원 중 온보딩 위자드를 완료한 비율"
            value={`${onboardingFunnel?.completion_rate?.toFixed(1) ?? 0}%`}
            subValue={`가입 ${onboardingFunnel?.signup_count ?? 0} → 완료 ${onboardingFunnel?.completed_count ?? 0}`}
            color="blue"
            loading={loading}
          />

          {/* Row 3: 운영 + 시스템 */}
          <MetricCard
            icon={Award}
            label="충성 학원"
            tooltip="이번 달 영업일 기준 로그인 80% 이상 AND 키오스크 80% 이상 학원 수"
            value={`${monetization?.loyal_count ?? 0}개`}
            subValue={`로그인 ${monetization?.login_qualified ?? 0} / 키오스크 ${monetization?.kiosk_qualified ?? 0} (영업일 ${monetization?.business_days ?? 0}일)`}
            trend={monetization && monetization.loyal_count > 0 ? 'up' : 'neutral'}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={CreditCard}
            label="AI 비용 (Claude)"
            tooltip="이번 달 Claude API 호출 비용 합계 (USD)"
            value={`$${costBreakdown?.ai_cost_month?.toFixed(4) ?? 0}`}
            subValue={`리포트당 $${costBreakdown?.cost_per_report?.toFixed(4) ?? 0}`}
            color="purple"
            loading={loading}
          />
          <MetricCard
            icon={Cpu}
            label="시스템 상태"
            tooltip="서버 CPU, RAM, Disk 사용률 (실시간)"
            value={`CPU ${systemHealth?.cpu_usage?.toFixed(0) ?? 0}%`}
            subValue={`RAM ${systemHealth?.ram_usage?.toFixed(0) ?? 0}% / Disk ${systemHealth?.disk_usage?.toFixed(0) ?? 0}%`}
            trend={
              systemHealth && (systemHealth.cpu_usage > 80 || systemHealth.ram_usage > 80)
                ? 'down'
                : 'up'
            }
            color={
              systemHealth && (systemHealth.cpu_usage > 80 || systemHealth.ram_usage > 80)
                ? 'red'
                : 'green'
            }
            loading={loading}
          />
          <MetricCard
            icon={Wifi}
            label="API 상태"
            tooltip="Claude API, Kakao API 응답 성공률 (실시간)"
            value={apiStatus?.claude?.status === 'healthy' ? '정상' : '점검 중'}
            subValue={`Claude ${apiStatus?.claude?.success_rate ?? 0}% / Kakao ${apiStatus?.kakao?.success_rate ?? 0}%`}
            trend={apiStatus?.claude?.status === 'healthy' ? 'up' : 'down'}
            color={apiStatus?.claude?.status === 'healthy' ? 'green' : 'yellow'}
            loading={loading}
          />
        </div>

        {/* 하단 섹션: 테이블 */}
        <DashboardTables
          atRiskAcademies={atRiskAcademies}
          activeAcademies={activeAcademies}
          onboardingAcademies={onboardingAcademies}
          funnelSummary={funnelSummary || undefined}
          conversionRates={conversionRates || undefined}
          loading={tablesLoading}
        />
      </div>
    </AdminLayout>
  );
}
