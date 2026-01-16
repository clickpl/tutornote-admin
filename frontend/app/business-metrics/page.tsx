'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import BusinessMetricsHeader from './components/BusinessMetricsHeader';
import PMFMetricsSection from './components/PMFMetricsSection';
import MilestoneSection from './components/MilestoneSection';
import SimulationSection from './components/SimulationSection';
import CostSettingsPanel from './components/CostSettingsPanel';

export default function BusinessMetricsPage() {
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [costSettingsOpen, setCostSettingsOpen] = useState(false);

  // 자동 새로고침
  useEffect(() => {
    if (!refreshInterval) return;

    const timer = setInterval(() => {
      setLastRefresh(new Date());
      console.log('Auto refresh triggered at', new Date().toLocaleTimeString());
    }, refreshInterval * 1000);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  // 전체화면 상태 체크 (초기 로드 시)
  useEffect(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  const handleRefreshIntervalChange = useCallback((interval: number | null) => {
    setRefreshInterval(interval);
  }, []);

  const handleFullscreenChange = useCallback((fs: boolean) => {
    setIsFullscreen(fs);
  }, []);

  const handleOpenCostSettings = useCallback(() => {
    setCostSettingsOpen(true);
  }, []);

  // 전체보기 모드 (사이드바 없음)
  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-background">
        {/* 전체화면 헤더 */}
        <BusinessMetricsHeader
          onRefreshIntervalChange={handleRefreshIntervalChange}
          onFullscreenChange={handleFullscreenChange}
          isFullscreen={true}
        />

        {/* 콘텐츠 */}
        <div className="p-6">
          <div className="mx-auto max-w-[1800px] space-y-6">
            {/* PMF 지표 섹션 */}
            <PMFMetricsSection />

            {/* 마일스톤 섹션 */}
            <MilestoneSection />

            {/* 수익 시뮬레이션 섹션 */}
            <SimulationSection onOpenSettings={handleOpenCostSettings} />
          </div>
        </div>

        {/* 비용 설정 패널 */}
        <CostSettingsPanel
          open={costSettingsOpen}
          onClose={() => setCostSettingsOpen(false)}
        />
      </div>
    );
  }

  // 일반 모드 (사이드바 있음)
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 페이지 헤더 */}
        <BusinessMetricsHeader
          onRefreshIntervalChange={handleRefreshIntervalChange}
          onFullscreenChange={handleFullscreenChange}
          isFullscreen={false}
        />

        {/* PMF 지표 섹션 */}
        <PMFMetricsSection />

        {/* 마일스톤 섹션 */}
        <MilestoneSection />

        {/* 수익 시뮬레이션 섹션 */}
        <SimulationSection onOpenSettings={handleOpenCostSettings} />
      </div>

      {/* 비용 설정 패널 */}
      <CostSettingsPanel
        open={costSettingsOpen}
        onClose={() => setCostSettingsOpen(false)}
      />
    </AdminLayout>
  );
}
