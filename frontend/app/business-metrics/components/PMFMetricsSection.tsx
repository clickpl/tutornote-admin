'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Loader2 } from 'lucide-react';
import PMFMetricCard from './PMFMetricCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface PMFData {
  mauRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; mau: number; total: number };
  aiFeedbackRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; monthlyReports: number; activeAcademies: number };
  shareRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; sharedReports: number; totalReports: number };
  proConversionRate: { current: number; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
  paymentUsageRate: { current: number | null; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
  churnRate: { current: number | null; target: number; status: 'green' | 'yellow' | 'red' | 'gray'; enabled: boolean };
}

export default function PMFMetricsSection() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PMFData | null>(null);

  useEffect(() => {
    loadPMFData();
  }, []);

  const loadPMFData = async () => {
    try {
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

  // 전체 달성률 계산 (활성 지표만)
  const overallProgress = data ? Math.round(
    [
      Math.min((data.mauRate.current / data.mauRate.target) * 100, 100),
      Math.min((data.aiFeedbackRate.current / data.aiFeedbackRate.target) * 100, 100),
      Math.min((data.shareRate.current / data.shareRate.target) * 100, 100),
    ].reduce((acc, v) => acc + v, 0) / 3
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
      </CardHeader>
      <CardContent>
        {/* Row 1: 핵심 지표 3개 (크게) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PMFMetricCard
            title="월간 활성 사용률"
            target="70%+"
            current={data.mauRate.current}
            targetValue={data.mauRate.target}
            status={data.mauRate.status}
            unit="%"
            size="large"
          />
          <PMFMetricCard
            title="AI 피드백 생성률"
            target="3건+/월"
            current={data.aiFeedbackRate.current}
            targetValue={data.aiFeedbackRate.target}
            status={data.aiFeedbackRate.status}
            unit="건"
            size="large"
          />
          <PMFMetricCard
            title="학부모 공유율"
            target="50%+"
            current={data.shareRate.current}
            targetValue={data.shareRate.target}
            status={data.shareRate.status}
            unit="%"
            size="large"
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
          />
        </div>
      </CardContent>
    </Card>
  );
}
