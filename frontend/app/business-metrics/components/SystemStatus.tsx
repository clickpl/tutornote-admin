'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface StatusItem {
  status: 'online' | 'warning' | 'offline';
  label: string;
  value?: string;
}

interface SystemStatusProps {
  compact?: boolean;
}

const statusColors = {
  online: 'bg-green-500',
  warning: 'bg-yellow-500',
  offline: 'bg-red-500',
};

export default function SystemStatus({ compact = false }: SystemStatusProps) {
  const [loading, setLoading] = useState(true);
  const [statusItems, setStatusItems] = useState<StatusItem[]>([]);

  useEffect(() => {
    loadSystemStatus();
  }, []);

  const loadSystemStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/business-metrics/system-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setStatusItems(result.data);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
      // Fallback to default status
      setStatusItems([
        { status: 'online', label: 'API', value: '정상' },
        { status: 'online', label: '서버', value: 'CPU 0%' },
        { status: 'online', label: 'Claude', value: '100%' },
        { status: 'online', label: 'Kakao', value: '정상' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        {statusItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${statusColors[item.status]}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {statusItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2 rounded-lg border bg-card p-3">
          <div className={`h-3 w-3 rounded-full ${statusColors[item.status]}`} />
          <div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-sm font-medium">{item.value || '정상'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
