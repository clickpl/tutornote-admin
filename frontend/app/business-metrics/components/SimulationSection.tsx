'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Settings, ArrowRight, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface SimulationData {
  current: { totalAcademies: number; proAcademies: number; revenue: number; cost: number; profit: number };
  target: { totalAcademies: number; proAcademies: number; revenue: number; cost: number; profit: number };
  breakdown: {
    revenue: {
      proSubscription: { label: string; current: number; target: number };
      paymentFee: { label: string; current: number; target: number };
      alimtalk: { label: string; current: number; target: number };
    };
    cost: {
      fixed: {
        total: { current: number; target: number };
        items: { label: string; current: number; target: number }[];
      };
      variable: {
        total: { current: number; target: number };
        items: { label: string; current: number; target: number }[];
      };
    };
  };
  breakeven: { academies: number; proAcademies: number };
}

interface SimulationSectionProps {
  onOpenSettings?: () => void;
}

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return `${(amount / 10000).toFixed(1)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export default function SimulationSection({ onOpenSettings }: SimulationSectionProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SimulationData | null>(null);

  useEffect(() => {
    loadSimulation();
  }, []);

  const loadSimulation = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/business-metrics/simulation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to load simulation:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const { current, target, breakdown, breakeven } = data;
  const progressPercent = target.revenue > 0 ? Math.round((current.revenue / target.revenue) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            수익 시뮬레이션
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onOpenSettings}>
            <Settings className="mr-2 h-4 w-4" />
            비용 설정
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 현재 vs 목표 비교 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 현재 상태 */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <h3 className="text-sm font-medium text-muted-foreground">현재 상태</h3>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 학원</span>
                <span className="font-medium">{current.totalAcademies}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pro 학원</span>
                <span className="font-medium">{current.proAcademies}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">월 수익</span>
                <span className="font-medium">{formatCurrency(current.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">월 비용</span>
                <span className="font-medium">{formatCurrency(current.cost)}</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">월 손익</span>
                  <span className={`font-bold ${current.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {current.profit >= 0 ? '+' : ''}{formatCurrency(current.profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 목표 상태 */}
          <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
            <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">목표 ({target.totalAcademies}개 학원)</h3>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">총 학원</span>
                <span className="font-medium">{target.totalAcademies}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pro 학원</span>
                <span className="font-medium">{target.proAcademies}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">월 수익</span>
                <span className="font-medium">{formatCurrency(target.revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">월 비용</span>
                <span className="font-medium">{formatCurrency(target.cost)}</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">월 손익</span>
                  <span className={`font-bold ${target.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {target.profit >= 0 ? '+' : ''}{formatCurrency(target.profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 진행률 */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">목표 대비 진행률</span>
            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatCurrency(current.revenue)}</span>
            <ArrowRight className="h-3 w-3" />
            <span>{formatCurrency(target.revenue)}</span>
          </div>
        </div>

        {/* 손익분기점 */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50/50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">손익분기점</h3>
          <div className="mt-2 flex items-center gap-4">
            <div>
              <span className="text-2xl font-bold text-yellow-600">{breakeven.academies}</span>
              <span className="ml-1 text-sm text-muted-foreground">개 학원</span>
            </div>
            <span className="text-muted-foreground">또는</span>
            <div>
              <span className="text-2xl font-bold text-yellow-600">{breakeven.proAcademies}</span>
              <span className="ml-1 text-sm text-muted-foreground">개 Pro 학원</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            * 현재 고정비용 기준으로 계산됨
          </p>
        </div>

        {/* 수익/비용 상세 (접힌 상태로 기본 숨김) */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
            상세 내역 보기
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* 수익 상세 */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">수익 구성</h4>
              <div className="mt-3 space-y-2">
                {Object.values(breakdown.revenue).map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{formatCurrency(item.current)} → {formatCurrency(item.target)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 비용 상세 */}
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">비용 구성</h4>
              <div className="mt-3 space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground">고정비용</span>
                  {breakdown.cost.fixed.items.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{formatCurrency(item.current)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2">
                  <span className="text-xs text-muted-foreground">변동비용</span>
                  {breakdown.cost.variable.items.map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{formatCurrency(item.current)} → {formatCurrency(item.target)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
