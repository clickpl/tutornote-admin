'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, MapPin, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

type MilestoneStatus = 'completed' | 'in-progress' | 'upcoming';

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

const statusStyles: Record<MilestoneStatus, { dot: string; line: string; text: string }> = {
  completed: {
    dot: 'bg-green-500 border-green-500',
    line: 'bg-green-500',
    text: 'text-green-600',
  },
  'in-progress': {
    dot: 'bg-blue-500 border-blue-500 animate-pulse',
    line: 'bg-gray-300 dark:bg-gray-600',
    text: 'text-blue-600',
  },
  upcoming: {
    dot: 'bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600',
    line: 'bg-gray-300 dark:bg-gray-600',
    text: 'text-muted-foreground',
  },
};

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

export default function MilestoneSection() {
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
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

  const currentMilestone = milestones.find(m => m.status === 'in-progress');
  const daysRemaining = currentMilestone ? calculateDaysRemaining(currentMilestone.targetDate) : 0;
  const progress = currentMilestone?.criteria ? calculateProgress(currentMilestone.criteria) : 0;

  // 진행 상태 판단
  const getHealthStatus = () => {
    if (progress >= 50) return { label: '순조로움', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' };
    if (progress >= 25) return { label: '주의 필요', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    return { label: '가속 필요', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' };
  };
  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-green-500" />
          핵심 마일스톤 진행 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 타임라인 */}
        <div className="relative">
          <div className="flex items-center justify-between px-4">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex flex-col items-center">
                {/* 연결선 */}
                {index < milestones.length - 1 && (
                  <div
                    className={`absolute top-3 left-1/2 h-0.5 ${statusStyles[milestone.status].line}`}
                    style={{ width: 'calc(100% + 40px)' }}
                  />
                )}
                {/* 점 */}
                <div
                  className={`relative z-10 h-6 w-6 rounded-full border-2 ${statusStyles[milestone.status].dot}`}
                />
                {/* 날짜 */}
                <span className="mt-2 text-xs text-muted-foreground">
                  {new Date(milestone.targetDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' })}
                </span>
                {/* 이름 */}
                <span className={`mt-1 text-sm font-medium ${statusStyles[milestone.status].text}`}>
                  {milestone.name}
                </span>
                {/* 진행률 (현재 마일스톤만) */}
                {milestone.status === 'in-progress' && (
                  <span className="mt-1 text-xs font-bold text-blue-600">{progress}%</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 현재 마일스톤 상세 */}
        {currentMilestone && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    현재 마일스톤: {currentMilestone.name} ({currentMilestone.targetDate})
                  </h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${healthStatus.bg} ${healthStatus.color}`}>
                    {healthStatus.label}
                  </span>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  성공 기준: {currentMilestone.criteria?.length}개 학원 중 {currentMilestone.criteria?.[1]?.target}개 이상 주 3회+ 사용
                </p>

                {/* 진행률 바 */}
                {currentMilestone.criteria && (
                  <div className="mt-4 space-y-3">
                    {currentMilestone.criteria.map((criterion) => (
                      <div key={criterion.metric}>
                        <div className="flex items-center justify-between text-sm">
                          <span>{criterion.metric}</span>
                          <span className="font-medium">
                            {criterion.current}{criterion.unit} / {criterion.target}{criterion.unit} 목표
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.min((criterion.current / criterion.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    남은 기간: <strong className="text-foreground">D-{daysRemaining}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
