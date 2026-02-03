'use client';

import { useState, useCallback } from 'react';
import { Bell, MessageSquare, RefreshCw, Send } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 카카오 알림톡 컴포넌트
import {
  KakaoMetricsCards,
  KakaoChart,
  KakaoTemplatesCard,
  KakaoHistoryTable,
} from './components/kakao';

// 텔레그램 알림 컴포넌트
import {
  TelegramStatusCards,
  TelegramChart,
  TelegramErrorTable,
  TelegramSettingsDialog,
} from './components/telegram';

import type { TelegramNotificationType, TelegramStatus } from './_lib/types';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('kakao');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 텔레그램 설정 다이얼로그 상태
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TelegramStatus | null>(null);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsRefreshing(false);
  }, []);

  const handleSettingsClick = (type: TelegramNotificationType) => {
    // 임시로 상태 객체 생성 (실제로는 API에서 가져와야 함)
    const statusMap: Record<TelegramNotificationType, TelegramStatus> = {
      server_check: {
        notification_type: 'server_check',
        name: '서버 점검',
        description: '5분마다 서버 리소스 체크',
        is_enabled: true,
        check_interval: 5,
        schedule_time: null,
        last_sent_at: null,
        today_count: 0,
        today_failed: 0,
        config: { cpu_threshold: 80, memory_threshold: 85, disk_threshold: 90 },
      },
      daily_report: {
        notification_type: 'daily_report',
        name: '일일 점검 리포트',
        description: '매일 오전 9시 발송',
        is_enabled: true,
        check_interval: null,
        schedule_time: '09:00:00',
        last_sent_at: null,
        today_count: 0,
        today_failed: 0,
        config: {},
      },
      service_report: {
        notification_type: 'service_report',
        name: '서비스 리포트',
        description: '매일 오전 9시 발송',
        is_enabled: true,
        check_interval: null,
        schedule_time: '09:00:00',
        last_sent_at: null,
        today_count: 0,
        today_failed: 0,
        config: {},
      },
      error: {
        notification_type: 'error',
        name: '에러 알림',
        description: '서비스 에러 즉시 알림',
        is_enabled: true,
        check_interval: null,
        schedule_time: null,
        last_sent_at: null,
        today_count: 0,
        today_failed: 0,
        config: { min_severity: 'medium' },
      },
    };

    setSelectedStatus(statusMap[type]);
    setSettingsOpen(true);
  };

  const handleSettingsSaved = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6" />
              알림 관리
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              카카오 알림톡 및 텔레그램 알림 현황을 모니터링합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              실시간
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger
              value="kakao"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              카카오 알림톡
            </TabsTrigger>
            <TabsTrigger
              value="telegram"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              텔레그램 알림
            </TabsTrigger>
          </TabsList>

          {/* 카카오 알림톡 탭 */}
          <TabsContent value="kakao" className="space-y-6">
            <KakaoMetricsCards onRefresh={refreshTrigger} />
            <div className="grid gap-6 lg:grid-cols-2">
              <KakaoChart onRefresh={refreshTrigger} />
              <KakaoTemplatesCard onRefresh={refreshTrigger} />
            </div>
            <KakaoHistoryTable onRefresh={refreshTrigger} />
          </TabsContent>

          {/* 텔레그램 알림 탭 */}
          <TabsContent value="telegram" className="space-y-6">
            <TelegramStatusCards
              onRefresh={refreshTrigger}
              onSettingsClick={handleSettingsClick}
            />
            <TelegramChart onRefresh={refreshTrigger} />
            <TelegramErrorTable onRefresh={refreshTrigger} />
          </TabsContent>
        </Tabs>

        {/* 텔레그램 설정 다이얼로그 */}
        <TelegramSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          status={selectedStatus}
          onSaved={handleSettingsSaved}
        />
      </div>
    </AdminLayout>
  );
}
