'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Check, Clock, AlertTriangle, Lock, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming' | 'overdue';

interface Criterion {
  metric: string;
  target: number;
  current: number;
  unit: string;
}

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
  status: MilestoneStatus;
  criteria?: Criterion[];
}

function calculateDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calculateProgress(criteria: Criterion[]): number {
  if (!criteria.length) return 0;
  const total = criteria.reduce((acc, c) => acc + Math.min((c.current / c.target) * 100, 100), 0);
  return Math.round(total / criteria.length);
}

function formatCriterionValue(current: number, unit: string): string {
  if (unit === '원') {
    if (current >= 10000) return `${(current / 10000).toFixed(1)}만원`;
    return `${current.toLocaleString()}원`;
  }
  return `${current}${unit}`;
}

function formatCriterionTarget(target: number, unit: string): string {
  if (unit === '원') {
    if (target >= 10000) return `${(target / 10000).toFixed(0)}만원`;
    return `${target.toLocaleString()}원`;
  }
  return `${target}${unit}`;
}

interface MilestoneSectionProps {
  refreshKey?: number;
}

const statusConfig: Record<MilestoneStatus, {
  icon: typeof Check;
  bg: string;
  border: string;
  text: string;
  badge: string;
  badgeText: string;
  label: string;
}> = {
  completed: {
    icon: Check,
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-900/40',
    badgeText: 'text-green-700 dark:text-green-400',
    label: '완료',
  },
  'in-progress': {
    icon: Clock,
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-900/40',
    badgeText: 'text-blue-700 dark:text-blue-400',
    label: '진행 중',
  },
  overdue: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 dark:bg-red-900/40',
    badgeText: 'text-red-700 dark:text-red-400',
    label: '기한 초과',
  },
  upcoming: {
    icon: Lock,
    bg: 'bg-muted/30',
    border: 'border-muted',
    text: 'text-muted-foreground',
    badge: 'bg-muted',
    badgeText: 'text-muted-foreground',
    label: '예정',
  },
};

export default function MilestoneSection({ refreshKey = 0 }: MilestoneSectionProps) {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    loadMilestones();
  }, [refreshKey]);

  const loadMilestones = async () => {
    try {
      if (milestones.length === 0) setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/business-metrics/milestones`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setMilestones(result.data);
      }
    } catch (error) {
      console.error('Failed to load milestones:', error);
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

  if (!milestones.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            핵심 마일스톤 진행 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">마일스톤 데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const currentMilestone = milestones.find(m => m.status === 'in-progress' || m.status === 'overdue');
  const currentIndex = currentMilestone ? milestones.indexOf(currentMilestone) : -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          핵심 마일스톤 진행 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 스텝 카드 그리드 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {milestones.map((milestone, index) => {
            const config = statusConfig[milestone.status];
            const Icon = config.icon;
            const isCurrent = milestone.status === 'in-progress' || milestone.status === 'overdue';
            const daysRemaining = calculateDaysRemaining(milestone.targetDate);
            const progress = milestone.criteria ? calculateProgress(milestone.criteria) : 0;

            return (
              <div
                key={milestone.id}
                className={`relative rounded-lg border p-3 transition-all ${config.border} ${config.bg} ${isCurrent ? 'ring-2 ring-offset-1 ' + (milestone.status === 'overdue' ? 'ring-red-400' : 'ring-blue-400') : ''}`}
              >
                {/* 스텝 번호 + 아이콘 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      milestone.status === 'completed' ? 'bg-green-500 text-white' :
                      isCurrent ? (milestone.status === 'overdue' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white') :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.status === 'completed' ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </div>
                    <span className={`text-sm font-semibold ${config.text}`}>
                      {milestone.name}
                    </span>
                  </div>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${config.badge} ${config.badgeText}`}>
                    {config.label}
                  </span>
                </div>

                {/* 목표 날짜 */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {new Date(milestone.targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
                  {isCurrent && (
                    <span className={`ml-2 font-semibold ${milestone.status === 'overdue' ? 'text-red-600' : 'text-blue-600'}`}>
                      {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
                    </span>
                  )}
                </div>

                {/* 기준 표시: 현재=진행률 바, 예정=목표만 */}
                {milestone.criteria && (
                  <div className="mt-3 space-y-2">
                    {milestone.criteria.map((criterion) => {
                      const pct = Math.min((criterion.current / criterion.target) * 100, 100);
                      return (
                        <div key={criterion.metric}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{criterion.metric}</span>
                            {isCurrent ? (
                              <span className="font-medium">
                                {formatCriterionValue(criterion.current, criterion.unit)} / {formatCriterionTarget(criterion.target, criterion.unit)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                목표 {formatCriterionTarget(criterion.target, criterion.unit)}
                              </span>
                            )}
                          </div>
                          {isCurrent && (
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full transition-all duration-500 ${milestone.status === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {isCurrent && (
                      <div className="mt-1 text-right">
                        <span className={`text-sm font-bold ${milestone.status === 'overdue' ? 'text-red-600' : 'text-blue-600'}`}>
                          {progress}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* 연결 화살표 (모바일 제외) */}
                {index < milestones.length - 1 && (
                  <div className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <div className={`text-xs ${index < currentIndex ? 'text-green-400' : 'text-muted-foreground/40'}`}>›</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
