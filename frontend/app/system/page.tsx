'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Database, Zap, Bell, Server, CheckCircle, XCircle, AlertTriangle,
  Cpu, HardDrive, MemoryStick, Clock, Terminal, RefreshCw, Sparkles,
  Activity, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  systemApi, ServerMetrics, GeminiQuota, LogEntry, DiagnosisResult, QuotaDetail
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

// 30초 폴링 간격
const POLLING_INTERVAL = 30000;

// 게이지 색상 결정
const getGaugeColor = (value: number) => {
  if (value >= 90) return 'text-red-500';
  if (value >= 70) return 'text-yellow-500';
  return 'text-green-500';
};

const getProgressBgColor = (value: number) => {
  if (value >= 90) return 'bg-red-500';
  if (value >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

// 게이지 카드 컴포넌트
function GaugeCard({
  icon: Icon,
  label,
  value,
  unit,
  subtext
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  subtext?: string;
}) {
  const color = getGaugeColor(value);
  const bgColor = getProgressBgColor(value);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              value >= 90 ? 'bg-red-500/10' :
              value >= 70 ? 'bg-yellow-500/10' : 'bg-green-500/10'
            }`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="font-medium">{label}</p>
              {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
            </div>
          </div>
          <div className={`text-2xl font-bold ${color}`}>
            {value.toFixed(1)}{unit}
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${bgColor}`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Claude AI 쿼터 카드 컴포넌트
function QuotaCard({ quota, type }: { quota: QuotaDetail; type: string }) {
  const label = type === 'SERVICE' ? '서비스 API' : '어드민 API';
  const description = type === 'SERVICE' ? '학원 리포트 생성용' : '서버 진단용';
  const isWarning = quota.daily.usage_percent >= 80 || quota.monthly.usage_percent >= 80;

  return (
    <Card className={isWarning ? 'border-yellow-500' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={`h-5 w-5 ${type === 'SERVICE' ? 'text-purple-500' : 'text-blue-500'}`} />
            <div>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          {isWarning && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              주의
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">일일 사용량</span>
            <span className="font-medium">{quota.daily.usage_percent}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBgColor(quota.daily.usage_percent)}`}
              style={{ width: `${Math.min(quota.daily.usage_percent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{quota.daily.used.toLocaleString()} tokens</span>
            <span>/ {quota.daily.limit.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">월간 사용량</span>
            <span className="font-medium">{quota.monthly.usage_percent}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBgColor(quota.monthly.usage_percent)}`}
              style={{ width: `${Math.min(quota.monthly.usage_percent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>${quota.monthly.total_cost.toFixed(4)}</span>
            <span>추정 비용</span>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">요청 수</p>
            <p className="font-medium">{quota.daily.request_count}</p>
          </div>
          <div>
            <p className="text-muted-foreground">성공률</p>
            <p className="font-medium">{quota.daily.success_rate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">평균 응답</p>
            <p className="font-medium">{quota.daily.avg_response_ms}ms</p>
          </div>
          <div>
            <p className="text-muted-foreground">잔여량</p>
            <p className="font-medium">{quota.daily.remaining.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 로그 뷰어 컴포넌트
function LogViewer({
  logs,
  selectedApp,
  onAppChange,
  onDiagnose,
  diagnosing
}: {
  logs: LogEntry[];
  selectedApp: string;
  onAppChange: (app: string) => void;
  onDiagnose: () => void;
  diagnosing: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle className="text-base">에러 로그</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedApp} onValueChange={onAppChange}>
              <SelectTrigger className="w-[180px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutornote-backend">tutornote-backend</SelectItem>
                <SelectItem value="tutornote-frontend">tutornote-frontend</SelectItem>
                <SelectItem value="tutornote-admin">tutornote-admin</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={onDiagnose}
              disabled={diagnosing || logs.length === 0}
              size="sm"
              variant="outline"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {diagnosing ? '분석 중...' : 'AI 분석'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-zinc-950 dark:bg-zinc-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-zinc-500">로그가 없습니다.</p>
          ) : (
            logs.map((log, i) => (
              <div
                key={i}
                className={`py-0.5 ${log.is_error ? 'text-red-400' : 'text-zinc-400'}`}
              >
                {log.content}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemPage() {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [quota, setQuota] = useState<GeminiQuota | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedApp, setSelectedApp] = useState('tutornote-backend');
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [health, setHealth] = useState<{
    status: string;
    components: { database: string; gemini_api: string; kakao_api: string };
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, quotaRes, logsRes, healthRes] = await Promise.all([
        systemApi.getMetrics(),
        systemApi.getGeminiQuota(),
        systemApi.getLogs(selectedApp, 100, true),
        systemApi.getHealth(),
      ]);

      if (metricsRes.data) setMetrics(metricsRes.data);
      if (quotaRes.data) setQuota(quotaRes.data);
      if (logsRes.data) setLogs(logsRes.data.logs);
      if (healthRes.data) setHealth(healthRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedApp]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleDiagnose = async () => {
    if (logs.length === 0) return;

    setDiagnosing(true);
    const errorLogs = logs
      .filter(l => l.is_error)
      .map(l => l.content)
      .join('\n');

    const { data } = await systemApi.diagnoseLogs(errorLogs, `PM2 앱: ${selectedApp}`);
    if (data) {
      setDiagnosis(data);
      setShowDiagnosis(true);
    }
    setDiagnosing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'operational':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const showQuotaWarning = quota && (
    quota.SERVICE.daily.usage_percent >= 80 ||
    quota.ADMIN.daily.usage_percent >= 80
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* 할당량 경고 배너 */}
        {showQuotaWarning && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">
                API 할당량 경고
              </p>
              <p className="text-sm text-muted-foreground">
                일일 API 사용량이 80%를 초과했습니다. 할당량 증가를 검토해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">시스템 모니터링</h1>
            <p className="text-sm text-muted-foreground">
              서버 상태 및 API 할당량 관리
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}</span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="api">API 할당량</TabsTrigger>
            <TabsTrigger value="logs">로그</TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="space-y-6">
            {/* 서버 상태 게이지 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {metrics?.latest ? (
                <>
                  <GaugeCard
                    icon={Cpu}
                    label="CPU"
                    value={metrics.latest.cpu_usage}
                    unit="%"
                  />
                  <GaugeCard
                    icon={MemoryStick}
                    label="RAM"
                    value={metrics.latest.ram_usage}
                    unit="%"
                    subtext={`${metrics.latest.ram_available_mb}MB 가용`}
                  />
                  <GaugeCard
                    icon={HardDrive}
                    label="Disk"
                    value={metrics.latest.disk_usage}
                    unit="%"
                    subtext={`${metrics.latest.disk_free_gb}GB 여유`}
                  />
                </>
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  메트릭 데이터가 없습니다.
                </div>
              )}
            </div>

            {/* 24시간 추이 차트 */}
            {metrics?.trends && metrics.trends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    24시간 추이
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.trends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(v) => {
                          // UTC 시간을 한국 시간(KST, UTC+9)으로 변환
                          const utcDate = new Date(v + 'Z'); // UTC로 파싱
                          return utcDate.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        }}
                        className="text-xs"
                      />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelFormatter={(v) => {
                          const utcDate = new Date(v + 'Z');
                          return utcDate.toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                          });
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="avg_cpu"
                        name="CPU"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_ram"
                        name="RAM"
                        stroke="#eab308"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg_disk"
                        name="Disk"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* PM2 프로세스 및 컴포넌트 상태 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* PM2 프로세스 상태 */}
              {metrics?.latest?.pm2_status && metrics.latest.pm2_status.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      PM2 프로세스
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {metrics.latest.pm2_status.map((proc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          {proc.status === 'online' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{proc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              재시작: {proc.restarts}회
                            </p>
                          </div>
                        </div>
                        <Badge variant={proc.status === 'online' ? 'default' : 'destructive'}>
                          {proc.status === 'online' ? '실행 중' : '중지됨'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 컴포넌트 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">컴포넌트 상태</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">데이터베이스</span>
                    </div>
                    {getStatusIcon(health?.components.database || '')}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Claude API</span>
                    </div>
                    {getStatusIcon(health?.components.gemini_api || '')}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">카카오 API</span>
                    </div>
                    {getStatusIcon(health?.components.kakao_api || '')}
                  </div>
                  {metrics?.latest && (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-sm">서버 가동시간</span>
                      </div>
                      <span className="text-sm font-medium">{metrics.latest.uptime}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API 할당량 탭 */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {quota && (
                <>
                  <QuotaCard quota={quota.SERVICE} type="SERVICE" />
                  <QuotaCard quota={quota.ADMIN} type="ADMIN" />
                </>
              )}
            </div>
          </TabsContent>

          {/* 로그 탭 */}
          <TabsContent value="logs" className="space-y-6">
            <LogViewer
              logs={logs}
              selectedApp={selectedApp}
              onAppChange={setSelectedApp}
              onDiagnose={handleDiagnose}
              diagnosing={diagnosing}
            />
          </TabsContent>
        </Tabs>

        {/* AI 진단 결과 다이얼로그 */}
        <Dialog open={showDiagnosis} onOpenChange={setShowDiagnosis}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI 진단 결과
              </DialogTitle>
              <DialogDescription>
                Gemini AI가 에러 로그를 분석했습니다.
              </DialogDescription>
            </DialogHeader>
            {diagnosis && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      diagnosis.severity === 'critical' ? 'destructive' :
                      diagnosis.severity === 'warning' ? 'secondary' : 'outline'
                    }
                  >
                    {diagnosis.severity === 'critical' ? '심각' :
                     diagnosis.severity === 'warning' ? '경고' : '정보'}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-1">원인</h4>
                  <p className="text-sm text-muted-foreground">{diagnosis.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-1">해결 명령어</h4>
                  <code className="block bg-zinc-950 dark:bg-zinc-900 text-green-400 p-3 rounded-lg text-sm font-mono">
                    {diagnosis.solution}
                  </code>
                </div>

                <div>
                  <h4 className="font-medium mb-1">설명</h4>
                  <p className="text-sm text-muted-foreground">{diagnosis.explanation}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
