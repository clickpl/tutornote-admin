'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { notificationsApi } from '@/lib/api';
import type { TelegramStatus, TelegramNotificationType } from '../../_lib/types';

interface TelegramSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: TelegramStatus | null;
  onSaved?: () => void;
}

const typeLabels: Record<TelegramNotificationType, string> = {
  server_check: '서버 점검',
  daily_report: '일일 리포트',
  service_report: '서비스 리포트',
  error: '에러 알림',
};

const typeDescriptions: Record<TelegramNotificationType, string> = {
  server_check: '서버 리소스를 주기적으로 체크하여 임계치 초과 시 알림을 발송합니다.',
  daily_report: '매일 지정된 시간에 일일 점검 리포트를 발송합니다.',
  service_report: '매일 지정된 시간에 서비스 현황 리포트를 발송합니다.',
  error: '서비스 에러 발생 시 즉시 알림을 발송합니다.',
};

export function TelegramSettingsDialog({
  open,
  onOpenChange,
  status,
  onSaved,
}: TelegramSettingsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    is_enabled: true,
    check_interval: 5,
    schedule_time: '09:00',
    cpu_threshold: 80,
    memory_threshold: 85,
    disk_threshold: 90,
    min_severity: 'medium',
  });

  useEffect(() => {
    if (status) {
      setFormData({
        is_enabled: status.is_enabled,
        check_interval: status.check_interval || 5,
        schedule_time: status.schedule_time?.slice(0, 5) || '09:00',
        cpu_threshold: (status.config?.cpu_threshold as number) || 80,
        memory_threshold: (status.config?.memory_threshold as number) || 85,
        disk_threshold: (status.config?.disk_threshold as number) || 90,
        min_severity: (status.config?.min_severity as string) || 'medium',
      });
    }
  }, [status]);

  const handleSave = async () => {
    if (!status) return;

    try {
      setIsLoading(true);

      const config: Record<string, unknown> = {};

      // 유형별 설정 구성
      if (status.notification_type === 'server_check') {
        config.cpu_threshold = formData.cpu_threshold;
        config.memory_threshold = formData.memory_threshold;
        config.disk_threshold = formData.disk_threshold;
      } else if (status.notification_type === 'error') {
        config.min_severity = formData.min_severity;
      }

      const response = await notificationsApi.telegram.updateConfig({
        notification_type: status.notification_type,
        is_enabled: formData.is_enabled,
        check_interval: status.notification_type === 'server_check' ? formData.check_interval : undefined,
        schedule_time: ['daily_report', 'service_report'].includes(status.notification_type)
          ? `${formData.schedule_time}:00`
          : undefined,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response.data?.success) {
        onSaved?.();
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!status) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5" />
            {typeLabels[status.notification_type]} 설정
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {typeDescriptions[status.notification_type]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 활성화 여부 */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-900 dark:text-white">알림 활성화</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                알림 발송을 활성화/비활성화합니다
              </p>
            </div>
            <Switch
              checked={formData.is_enabled}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_enabled: checked }))}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* 서버 점검 설정 */}
          {status.notification_type === 'server_check' && (
            <>
              <div className="space-y-2">
                <Label className="text-gray-900 dark:text-white">점검 주기 (분)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={formData.check_interval}
                  onChange={(e) => setFormData((prev) => ({ ...prev, check_interval: parseInt(e.target.value) || 5 }))}
                  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-gray-900 dark:text-white">임계값 설정</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">CPU (%)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      value={formData.cpu_threshold}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cpu_threshold: parseInt(e.target.value) || 80 }))}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">메모리 (%)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      value={formData.memory_threshold}
                      onChange={(e) => setFormData((prev) => ({ ...prev, memory_threshold: parseInt(e.target.value) || 85 }))}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 dark:text-gray-400">디스크 (%)</Label>
                    <Input
                      type="number"
                      min={50}
                      max={100}
                      value={formData.disk_threshold}
                      onChange={(e) => setFormData((prev) => ({ ...prev, disk_threshold: parseInt(e.target.value) || 90 }))}
                      className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  설정한 값을 초과하면 알림이 발송됩니다
                </p>
              </div>
            </>
          )}

          {/* 일일/서비스 리포트 설정 */}
          {['daily_report', 'service_report'].includes(status.notification_type) && (
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">발송 시간</Label>
              <Input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, schedule_time: e.target.value }))}
                className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                매일 설정한 시간에 리포트가 발송됩니다
              </p>
            </div>
          )}

          {/* 에러 알림 설정 */}
          {status.notification_type === 'error' && (
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">최소 심각도</Label>
              <select
                value={formData.min_severity}
                onChange={(e) => setFormData((prev) => ({ ...prev, min_severity: e.target.value }))}
                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md p-2"
              >
                <option value="low">낮음 (모든 에러)</option>
                <option value="medium">보통 이상</option>
                <option value="high">높음 이상</option>
                <option value="critical">심각만</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                설정한 심각도 이상의 에러만 알림이 발송됩니다
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-600 dark:text-gray-400"
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
