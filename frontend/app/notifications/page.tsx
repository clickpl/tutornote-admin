'use client';

import { Bell, Clock, CheckCircle, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';

export default function NotificationsPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">알림 관리</h1>
          <p className="text-sm text-gray-400 mt-1">카카오 알림톡 발송 현황</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">채널 상태</p>
                <p className="text-xl font-bold text-yellow-400">심사 대기</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-900/50 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">오늘 발송</p>
                <p className="text-xl font-bold text-white">0건</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-900/50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">성공률</p>
                <p className="text-xl font-bold text-white">-%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">카카오 비즈니스 심사 대기 중</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            카카오 비즈니스 채널 심사가 완료되면 알림톡 발송 현황을 확인할 수 있습니다.
            심사는 영업일 기준 3~5일 소요됩니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
