'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sun, Moon, Maximize, Minimize, RefreshCw, ChevronDown } from 'lucide-react';
import LiveClock from './LiveClock';
import SystemStatus from './SystemStatus';

interface BusinessMetricsHeaderProps {
  onRefreshIntervalChange?: (interval: number | null) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  isFullscreen?: boolean;
}

const refreshOptions = [
  { label: '30초', value: 30 },
  { label: '1분', value: 60 },
  { label: '5분', value: 300 },
  { label: '끄기', value: null },
];

export default function BusinessMetricsHeader({
  onRefreshIntervalChange,
  onFullscreenChange,
  isFullscreen = false,
}: BusinessMetricsHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // 테마 초기화
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  // ESC 키로 전체화면 종료 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      onFullscreenChange?.(isFs);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullscreenChange]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('admin_theme', newIsDark ? 'dark' : 'light');
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleRefreshChange = (value: number | null) => {
    setRefreshInterval(value);
    onRefreshIntervalChange?.(value);
  };

  const currentRefreshLabel = refreshOptions.find(opt => opt.value === refreshInterval)?.label || '끄기';

  // 전체보기 모드 헤더
  if (isFullscreen) {
    return (
      <div className="flex items-center justify-between border-b bg-card/95 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="text-3xl font-bold">TutorNote 비즈니스 대시보드</h1>
          <div className="mt-1 flex items-center gap-4">
            <LiveClock />
            <span className="text-sm text-muted-foreground">
              자동 새로고침: {currentRefreshLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SystemStatus compact />

          <div className="flex items-center gap-2">
            {/* 자동 새로고침 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {currentRefreshLabel}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {refreshOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.label}
                    onClick={() => handleRefreshChange(option.value)}
                    className={refreshInterval === option.value ? 'bg-accent' : ''}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 테마 토글 */}
            <Button variant="outline" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* 전체보기 종료 */}
            <Button variant="outline" size="sm" className="gap-2" onClick={toggleFullscreen}>
              <Minimize className="h-4 w-4" />
              ESC 종료
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 일반 모드 헤더
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">비즈니스 지표</h1>
        <p className="text-muted-foreground">
          PMF 지표와 핵심 마일스톤을 실시간으로 모니터링합니다.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* 자동 새로고침 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {currentRefreshLabel}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {refreshOptions.map((option) => (
              <DropdownMenuItem
                key={option.label}
                onClick={() => handleRefreshChange(option.value)}
                className={refreshInterval === option.value ? 'bg-accent' : ''}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 테마 토글 */}
        <Button variant="outline" size="icon" onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* 전체보기 */}
        <Button variant="outline" size="sm" className="gap-2" onClick={toggleFullscreen}>
          <Maximize className="h-4 w-4" />
          전체보기
        </Button>

        {/* 기준일 */}
        <span className="text-sm text-muted-foreground">
          기준: {new Date().toLocaleDateString('ko-KR')}
        </span>
      </div>
    </div>
  );
}
