'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import PMFMetricCard from './PMFMetricCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface PMFData {
  mauRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; mau: number; total: number };
  kioskRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; kioskAcademies: number; activeAcademies: number };
  journalRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; journalAcademies: number; activeAcademies: number };
  aiFeedbackRate: { current: number; target: number; unit?: string; status: 'green' | 'yellow' | 'red' | 'gray'; reportAcademies?: number; monthlyReports: number; activeAcademies: number };
  shareRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; sharedReports: number; totalReports: number };
  proConversionRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
  paymentUsageRate: { current: number | null; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
  churnRate: { current: number | null; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
}

interface PMFMetricsSectionProps {
  refreshKey?: number;
}

export default function PMFMetricsSection({ refreshKey = 0 }: PMFMetricsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PMFData | null>(null);

  useEffect(() => {
    loadPMFData();
  }, [refreshKey]);

  const loadPMFData = async () => {
    try {
      if (!data) setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/business-metrics/pmf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load PMF data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 전체 달성률 계산 (가중 평균: 퍼널 5단계)
  // MAU 30% > 키오스크 20% > 수업일지 20% > 리포트 15% > 공유 15%
  const overallProgress = data ? Math.round(
    Math.min((data.mauRate.current / data.mauRate.target) * 100, 100) * 0.30 +
    Math.min((data.kioskRate.current / data.kioskRate.target) * 100, 100) * 0.20 +
    Math.min((data.journalRate.current / data.journalRate.target) * 100, 100) * 0.20 +
    Math.min((data.aiFeedbackRate.current / data.aiFeedbackRate.target) * 100, 100) * 0.15 +
    Math.min((data.shareRate.current / data.shareRate.target) * 100, 100) * 0.15
  ) : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-muted-foreground">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            PMF 지표 달성 현황
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">전체 달성률:</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-sm font-medium">{overallProgress}%</span>
            </div>
          </div>
        </div>
        {/* 퍼널 흐름 표시 */}
        <p className="mt-1 text-xs text-muted-foreground">
          접속(MAU) → 출석체크(Kiosk) → 수업일지 → AI 리포트 → 학부모 공유
        </p>
      </CardHeader>
      <CardContent>
        {/* Row 1: 핵심 퍼널 지표 5개 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <PMFMetricCard
            title="월간 활성 사용률"
            target="70%+"
            current={data.mauRate.current}
            targetValue={data.mauRate.target}
            status={data.mauRate.status}
            unit="%"
            size="large"
            tooltip={`활성 학원 중 이번 달 1회 이상 활동한 학원 비율\n\n활동 학원: ${data.mauRate.mau}개 / 전체: ${data.mauRate.total}개\n(리포트·출석·학생등록 중 1건 이상)`}
          />
          <PMFMetricCard
            title="키오스크 출석률"
            target="60%+"
            current={data.kioskRate.current}
            targetValue={data.kioskRate.target}
            status={data.kioskRate.status}
            unit="%"
            size="large"
            tooltip={`활성 학원 중 키오스크 출석체크를 사용한 학원 비율\n\n키오스크 사용: ${data.kioskRate.kioskAcademies}개 / MAU: ${data.kioskRate.activeAcademies}개\n(수동 출석 제외, 키오스크만 집계)`}
          />
          <PMFMetricCard
            title="수업일지 기록률"
            target="50%+"
            current={data.journalRate.current}
            targetValue={data.journalRate.target}
            status={data.journalRate.status}
            unit="%"
            size="large"
            tooltip={`활성 학원 중 수업일지를 1건 이상 작성한 학원 비율\n\n수업일지 작성: ${data.journalRate.journalAcademies}개 / MAU: ${data.journalRate.activeAcademies}개`}
          />
          <PMFMetricCard
            title="AI 리포트 생성률"
            target="50%+"
            current={data.aiFeedbackRate.current}
            targetValue={data.aiFeedbackRate.target}
            status={data.aiFeedbackRate.status}
            unit="%"
            size="large"
            tooltip={`활성 학원 중 AI 리포트를 생성한 학원 비율\n\n리포트 생성: ${data.aiFeedbackRate.reportAcademies}개 / MAU: ${data.aiFeedbackRate.activeAcademies}개\n이번 달 총 리포트: ${data.aiFeedbackRate.monthlyReports}건`}
          />
          <PMFMetricCard
            title="학부모 공유율"
            target="50%+"
            current={data.shareRate.current}
            targetValue={data.shareRate.target}
            status={data.shareRate.status}
            unit="%"
            size="large"
            tooltip={`생성된 리포트 중 학부모에게 공유된 비율\n\n공유 리포트: ${data.shareRate.sharedReports}건 / 전체: ${data.shareRate.totalReports}건`}
          />
        </div>

        {/* Row 2: 부가 지표 3개 (작게) */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <PMFMetricCard
            title="Free→Pro 전환율"
            target="10%+"
            current={data.proConversionRate.current}
            targetValue={data.proConversionRate.target}
            status={data.proConversionRate.status}
            unit="%"
            disabled={!data.proConversionRate.enabled}
            disabledText="베타 기간"
            size="small"
            tooltip="전체 학원 중 Pro 플랜 전환 비율"
          />
          <PMFMetricCard
            title="결제 기능 사용률"
            target="30%+"
            current={data.paymentUsageRate.current}
            targetValue={data.paymentUsageRate.target}
            status={data.paymentUsageRate.status}
            unit="%"
            disabled={!data.paymentUsageRate.enabled}
            disabledText="준비 중"
            size="small"
            tooltip="학원비 결제 기능을 사용하는 학원 비율"
          />
          <PMFMetricCard
            title="월간 이탈률"
            target="<5%"
            current={data.churnRate.current}
            targetValue={data.churnRate.target}
            status={data.churnRate.status}
            unit="%"
            disabled={!data.churnRate.enabled}
            disabledText="해당 없음"
            size="small"
            tooltip="전월 활성 학원 중 이번 달 비활성으로 전환된 비율"
          />
        </div>
      </CardContent>
    </Card>
  );
}
