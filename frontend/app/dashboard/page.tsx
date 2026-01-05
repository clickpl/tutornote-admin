'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  FileText,
  Activity,
  Image,
  Eye,
  Sparkles,
  TrendingUp,
  DollarSign,
  CreditCard,
  Cpu,
  Wifi,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import CriticalAlerts from '@/components/dashboard/CriticalAlerts';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardTables from '@/components/dashboard/DashboardTables';
import QuickActions from '@/components/dashboard/QuickActions';
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
    student_added: number;
    report_created: number;
    shared: number;
  } | null>(null);
  const [conversionRates, setConversionRates] = useState<{
    signup_to_student: number;
    student_to_report: number;
    report_to_share: number;
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

  const handleContactAtRisk = () => {
    // 이탈 위험 학원 연락 기능
    alert(`이탈 위험 학원 ${atRiskAcademies.length}개에 연락을 시도합니다.`);
  };

  const handleSendPromotion = () => {
    // 유료 전환 안내 기능
    alert(`헤비유저 ${monetization?.heavy_users || 0}개 학원에 유료 전환 안내를 발송합니다.`);
  };

  const handleExportReport = () => {
    // 주간 리포트 생성
    alert('주간 리포트를 PDF로 생성합니다.');
  };

  const handleDownloadData = () => {
    // 데이터 내보내기
    alert('대시보드 데이터를 Excel/CSV로 내보냅니다.');
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
          {/* Row 1: 학원 현황 */}
          <MetricCard
            icon={Building2}
            label="활성 학원"
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
            value={studentStats?.total_students?.toLocaleString() ?? 0}
            subValue={`학원당 평균 ${studentStats?.avg_per_academy?.toFixed(1) ?? 0}명`}
            trend="up"
            trendLabel={`+${studentStats?.new_this_month ?? 0}`}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={FileText}
            label="리포트 활동"
            value={`${reportActivity?.this_month?.toLocaleString() ?? 0}건`}
            subValue={`오늘 ${reportActivity?.today ?? 0} / 일평균 ${reportActivity?.avg_daily ?? 0}`}
            color="yellow"
            loading={loading}
          />
          <MetricCard
            icon={Activity}
            label="고착도 (Stickiness)"
            value={`${engagement?.stickiness?.toFixed(1) ?? 0}%`}
            subValue={`DAU ${engagement?.dau ?? 0} / MAU ${engagement?.mau ?? 0}`}
            trend={engagement && engagement.stickiness >= 20 ? 'up' : 'down'}
            trendLabel={engagement?.stickiness_label}
            color="purple"
            loading={loading}
          />

          {/* Row 2: 콘텐츠 & 도달 */}
          <MetricCard
            icon={Image}
            label="카드뉴스 생성"
            value={`${contentGeneration?.card_news_month ?? 0}건`}
            subValue={`오늘 ${contentGeneration?.card_news_today ?? 0} / 생성률 ${contentGeneration?.generation_rate ?? 0}%`}
            color="orange"
            loading={loading}
          />
          <MetricCard
            icon={Eye}
            label="학부모 열람률"
            value={`${parentReach?.view_rate?.toFixed(1) ?? 0}%`}
            subValue={`${parentReach?.total_views ?? 0}회 열람 / ${parentReach?.total_shares ?? 0}회 공유`}
            trend={parentReach && parentReach.view_rate >= 50 ? 'up' : 'down'}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={Sparkles}
            label="AI 리포트 비율"
            value={`${aiEfficiency?.ai_rate?.toFixed(1) ?? 0}%`}
            subValue={`평균 ${aiEfficiency?.avg_generation_time?.toFixed(1) ?? 0}초 생성`}
            color="purple"
            loading={loading}
          />
          <MetricCard
            icon={TrendingUp}
            label="온보딩 전환율"
            value={`${onboardingFunnel?.conversion_rate?.toFixed(1) ?? 0}%`}
            subValue={`가입 ${onboardingFunnel?.signup ?? 0} → 공유 ${onboardingFunnel?.shared ?? 0}`}
            color="blue"
            loading={loading}
          />

          {/* Row 3: 수익화 & 운영 */}
          <MetricCard
            icon={DollarSign}
            label="헤비유저"
            value={`${monetization?.heavy_users ?? 0}개`}
            subValue={`전환율 ${monetization?.heavy_user_rate?.toFixed(1) ?? 0}% / 예상 MRR $${monetization?.estimated_mrr ?? 0}`}
            trend={monetization && monetization.heavy_user_rate >= 5 ? 'up' : 'neutral'}
            color="green"
            loading={loading}
          />
          <MetricCard
            icon={CreditCard}
            label="운영 비용"
            value={`$${costBreakdown?.total_cost_month?.toFixed(2) ?? 0}`}
            subValue={`AI $${costBreakdown?.ai_cost_month?.toFixed(2) ?? 0} / 리포트당 $${costBreakdown?.cost_per_report?.toFixed(4) ?? 0}`}
            color="red"
            loading={loading}
          />
          <MetricCard
            icon={Cpu}
            label="시스템 상태"
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
            value={apiStatus?.claude?.status === 'healthy' ? '정상' : '점검 중'}
            subValue={`Claude ${apiStatus?.claude?.success_rate ?? 0}% / Kakao ${apiStatus?.kakao?.success_rate ?? 0}%`}
            trend={apiStatus?.claude?.status === 'healthy' ? 'up' : 'down'}
            color={apiStatus?.claude?.status === 'healthy' ? 'green' : 'yellow'}
            loading={loading}
          />
        </div>

        {/* 하단 섹션: 테이블 + 빠른 액션 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* 테이블 섹션 - 3/4 너비 */}
          <div className="lg:col-span-3">
            <DashboardTables
              atRiskAcademies={atRiskAcademies}
              activeAcademies={activeAcademies}
              onboardingAcademies={onboardingAcademies}
              funnelSummary={funnelSummary || undefined}
              conversionRates={conversionRates || undefined}
              loading={tablesLoading}
            />
          </div>

          {/* 빠른 액션 - 1/4 너비 */}
          <div className="lg:col-span-1">
            <QuickActions
              atRiskCount={atRiskAcademies.length}
              heavyUserCount={monetization?.heavy_users ?? 0}
              onContactAtRisk={handleContactAtRisk}
              onSendPromotion={handleSendPromotion}
              onExportReport={handleExportReport}
              onDownloadData={handleDownloadData}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
