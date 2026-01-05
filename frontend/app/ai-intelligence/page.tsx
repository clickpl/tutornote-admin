'use client';

import { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Send,
  FileText,
  MessageSquare,
  RefreshCcw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aiIntelligenceApi,
  AIIntelligenceLog,
  AICostSummary,
  AITodayInsights,
  AIInsight,
} from '@/lib/api';

export default function AIIntelligencePage() {
  // 상태 관리
  const [insights, setInsights] = useState<AITodayInsights | null>(null);
  const [costSummary, setCostSummary] = useState<AICostSummary | null>(null);
  const [logs, setLogs] = useState<AIIntelligenceLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logType, setLogType] = useState('');

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // 생성된 콘텐츠
  const [dailyIntelligence, setDailyIntelligence] = useState('');
  const [playbook, setPlaybook] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [selectedAcademy, setSelectedAcademy] = useState<number | null>(null);

  // 다이얼로그 상태
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showPlaybook, setShowPlaybook] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [logsPage, logType]);

  const fetchData = async () => {
    try {
      const [insightsRes, costRes] = await Promise.all([
        aiIntelligenceApi.getTodayInsights(),
        aiIntelligenceApi.getCostSummary(),
      ]);

      if (insightsRes.data) setInsights(insightsRes.data);
      if (costRes.data) setCostSummary(costRes.data);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await aiIntelligenceApi.getLogs(logsPage, 10, logType);
      if (res.data) {
        setLogs(res.data.logs);
        setLogsTotal(res.data.total);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleGenerateDailyIntelligence = async () => {
    setGenerating(true);
    try {
      const res = await aiIntelligenceApi.generateDailyIntelligence();
      if (res.data) {
        setDailyIntelligence(res.data.intelligence);
        setShowIntelligence(true);
        fetchLogs();
      } else if (res.error) {
        alert(`생성 실패: ${res.error}`);
      }
    } catch (error) {
      console.error('Failed to generate intelligence:', error);
      alert('인텔리전스 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePlaybook = async (academyId: number, situationType: string) => {
    setGenerating(true);
    setSelectedAcademy(academyId);
    try {
      const res = await aiIntelligenceApi.generatePlaybook({
        academy_id: academyId,
        situation_type: situationType as 'inactivity_7d' | 'inactivity_14d' | 'inactivity_21d' | 'inactivity_30d' | 'low_engagement' | 'heavy_user',
      });
      if (res.data) {
        setPlaybook(res.data.playbook);
        setShowPlaybook(true);
        fetchLogs();
      } else if (res.error) {
        alert(`생성 실패: ${res.error}`);
      }
    } catch (error) {
      console.error('Failed to generate playbook:', error);
      alert('Playbook 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMessage = async (academyId: number, messageType: string) => {
    setGenerating(true);
    setSelectedAcademy(academyId);
    try {
      const res = await aiIntelligenceApi.generateMessage({
        academy_id: academyId,
        message_type: messageType as 'check_in' | 'engagement_tips' | 'thank_you' | 'upgrade_soft',
      });
      if (res.data) {
        setGeneratedMessage(res.data.message);
        setShowMessage(true);
        fetchLogs();
      } else if (res.error) {
        alert(`생성 실패: ${res.error}`);
      }
    } catch (error) {
      console.error('Failed to generate message:', error);
      alert('메시지 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendApproval = async (messageType: string) => {
    if (!selectedAcademy || !generatedMessage) return;

    try {
      const res = await aiIntelligenceApi.sendApprovalRequest({
        academy_id: selectedAcademy,
        message: generatedMessage,
        message_type: messageType,
      });
      if (res.data?.success) {
        alert('텔레그램으로 승인 요청이 발송되었습니다.');
        setShowMessage(false);
      } else {
        alert(`발송 실패: ${res.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Failed to send approval:', error);
      alert('승인 요청 발송 중 오류가 발생했습니다.');
    }
  };

  const getLogTypeBadge = (type: string) => {
    const styles = {
      daily: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      playbook: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      message: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    const labels = { daily: '일일', alert: '알림', playbook: 'Playbook', message: '메시지' };
    return (
      <Badge className={styles[type as keyof typeof styles] || 'bg-gray-100'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const getSituationType = (daysInactive: number) => {
    if (daysInactive >= 30) return 'inactivity_30d';
    if (daysInactive >= 21) return 'inactivity_21d';
    if (daysInactive >= 14) return 'inactivity_14d';
    return 'inactivity_7d';
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-500" />
            <div>
              <h1 className="text-2xl font-bold">AI 인텔리전스</h1>
              <p className="text-sm text-muted-foreground">
                Gemini 2.0 Flash 기반 자동 분석 및 대응 시스템
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerateDailyIntelligence}
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            일일 인텔리전스 생성
          </Button>
        </div>

        {/* 상단 카드 그리드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Critical Alerts */}
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-red-600">
                    {insights?.summary.critical || 0}건
                  </p>
                  <p className="text-xs text-muted-foreground">
                    14일 이상 무활동 학원
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-yellow-200 dark:border-yellow-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                주의 필요
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-yellow-600">
                    {insights?.summary.warning || 0}건
                  </p>
                  <p className="text-xs text-muted-foreground">
                    7일 이상 무활동 학원
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-500" />
                기회 신호
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-green-600">
                    {insights?.summary.opportunity || 0}건
                  </p>
                  <p className="text-xs text-muted-foreground">
                    헤비유저 학원 (월 20건 이상)
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Cost */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                이번 달 AI 비용
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className="text-2xl font-bold">
                    ${costSummary?.total_cost_usd.toFixed(4) || '0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {costSummary?.total_requests || 0}회 요청 /{' '}
                    {(costSummary?.total_tokens || 0).toLocaleString()} 토큰
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 탭 섹션 */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              알림 대응
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              기회 활용
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <FileText className="h-4 w-4" />
              AI 로그
            </TabsTrigger>
          </TabsList>

          {/* 알림 대응 탭 */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  무활동 학원 대응
                </CardTitle>
                <CardDescription>
                  7일 이상 활동이 없는 학원에 대한 AI 대응 Playbook 및 메시지 생성
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : insights?.insights.filter(i => i.type === 'critical' || i.type === 'warning').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="mb-2 h-12 w-12 text-green-500" />
                    <p className="text-lg font-medium">모든 학원이 활성 상태입니다</p>
                    <p className="text-sm text-muted-foreground">
                      7일 이상 무활동 학원이 없습니다
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상태</TableHead>
                        <TableHead>학원 정보</TableHead>
                        <TableHead>설명</TableHead>
                        <TableHead className="text-right">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights?.insights
                        .filter(i => i.type === 'critical' || i.type === 'warning')
                        .map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>
                            <Badge
                              variant={alert.type === 'critical' ? 'destructive' : 'secondary'}
                            >
                              {alert.type === 'critical' ? '긴급' : '주의'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{alert.title}</TableCell>
                          <TableCell className="text-muted-foreground">{alert.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {alert.playbookReady && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleGeneratePlaybook(
                                      alert.academyId,
                                      'inactivity_14d'
                                    )
                                  }
                                  disabled={generating}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  Playbook
                                </Button>
                              )}
                              {alert.messageReady && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleGenerateMessage(alert.academyId, 'check_in')
                                  }
                                  disabled={generating}
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />
                                  메시지
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기회 활용 탭 */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  헤비유저 기회
                </CardTitle>
                <CardDescription>
                  활발하게 서비스를 사용하는 학원에 감사 메시지 또는 업그레이드 제안
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : insights?.insights.filter(i => i.type === 'opportunity').length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <XCircle className="mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-lg font-medium">헤비유저가 없습니다</p>
                    <p className="text-sm text-muted-foreground">
                      월 20건 이상 리포트를 생성한 학원이 없습니다
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>학원 정보</TableHead>
                        <TableHead>설명</TableHead>
                        <TableHead className="text-right">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insights?.insights
                        .filter(i => i.type === 'opportunity')
                        .map((opp) => (
                        <TableRow key={opp.id}>
                          <TableCell className="font-medium">{opp.title}</TableCell>
                          <TableCell className="text-muted-foreground">{opp.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleGenerateMessage(opp.academyId, 'thank_you')
                                }
                                disabled={generating}
                              >
                                감사 메시지
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleGenerateMessage(opp.academyId, 'upgrade_soft')
                                }
                                disabled={generating}
                              >
                                업그레이드 제안
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI 로그 탭 */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>AI 활동 로그</CardTitle>
                    <CardDescription>
                      AI 인텔리전스 생성 및 메시지 기록
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={logType || 'all'} onValueChange={(v) => setLogType(v === 'all' ? '' : v)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="전체 유형" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="daily">일일 인텔리전스</SelectItem>
                        <SelectItem value="playbook">Playbook</SelectItem>
                        <SelectItem value="message">메시지</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchLogs}>
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="mb-2 h-12 w-12 text-gray-400" />
                    <p className="text-lg font-medium">로그가 없습니다</p>
                    <p className="text-sm text-muted-foreground">
                      AI 인텔리전스를 생성하면 여기에 기록됩니다
                    </p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>유형</TableHead>
                          <TableHead>대상</TableHead>
                          <TableHead>토큰</TableHead>
                          <TableHead>생성일</TableHead>
                          <TableHead>조치</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{getLogTypeBadge(log.type)}</TableCell>
                            <TableCell>
                              {log.academy_name || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.input_tokens + log.output_tokens}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(log.created_at).toLocaleString('ko-KR')}
                            </TableCell>
                            <TableCell>
                              {log.action_taken ? (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  완료
                                </Badge>
                              ) : (
                                <Badge variant="secondary">대기</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* 페이지네이션 */}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        총 {logsTotal}건
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                          disabled={logsPage === 1}
                        >
                          이전
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPage((p) => p + 1)}
                          disabled={logs.length < 10}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 일일 인텔리전스 다이얼로그 */}
        <Dialog open={showIntelligence} onOpenChange={setShowIntelligence}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                일일 인텔리전스 리포트
              </DialogTitle>
              <DialogDescription>
                AI가 분석한 오늘의 TutorNote 운영 현황
              </DialogDescription>
            </DialogHeader>
            <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
              {dailyIntelligence}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowIntelligence(false)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Playbook 다이얼로그 */}
        <Dialog open={showPlaybook} onOpenChange={setShowPlaybook}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                대응 Playbook
              </DialogTitle>
              <DialogDescription>
                AI가 생성한 4단계 대응 전략
              </DialogDescription>
            </DialogHeader>
            <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
              {playbook}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPlaybook(false)}>
                닫기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 메시지 다이얼로그 */}
        <Dialog open={showMessage} onOpenChange={setShowMessage}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                AI 생성 메시지
              </DialogTitle>
              <DialogDescription>
                발송 전 내용을 확인하고 수정할 수 있습니다
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowMessage(false)}>
                취소
              </Button>
              <Button onClick={() => handleSendApproval('check_in')} className="gap-2">
                <Send className="h-4 w-4" />
                텔레그램으로 승인 요청
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
