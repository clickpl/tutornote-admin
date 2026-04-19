'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  billingApi,
  BillingDashboard,
  AdminBillingSubscription,
  AdminPaymentRecord,
  FailedPayment,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  DollarSign,
  Users,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  RotateCcw,
  Star,
  MessageSquare,
  Percent,
  Building2,
} from 'lucide-react';

function formatKRW(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    active: { label: '활성', className: 'bg-green-100 text-green-700' },
    cancelled: { label: '해지', className: 'bg-amber-100 text-amber-700' },
    expired: { label: '만료', className: 'bg-gray-100 text-gray-600' },
    success: { label: '성공', className: 'bg-green-100 text-green-700' },
    failed: { label: '실패', className: 'bg-red-100 text-red-700' },
    refunded: { label: '환불', className: 'bg-purple-100 text-purple-700' },
    pending: { label: '대기', className: 'bg-blue-100 text-blue-700' },
  };
  const v = variants[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <Badge className={v.className}>{v.label}</Badge>;
}

export default function BillingManagementPage() {
  const [dashboard, setDashboard] = useState<BillingDashboard | null>(null);
  const [subscriptions, setSubscriptions] = useState<AdminBillingSubscription[]>([]);
  const [subsPage, setSubsPage] = useState(1);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsFilter, setSubsFilter] = useState({ status: '', plan_type: '' });

  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [payFilter, setPayFilter] = useState({ status: '', type: '' });

  const [failedPayments, setFailedPayments] = useState<FailedPayment[]>([]);

  const [loading, setLoading] = useState(true);

  // 환불 다이얼로그
  const [refundTarget, setRefundTarget] = useState<AdminPaymentRecord | null>(null);
  const [refunding, setRefunding] = useState(false);

  const loadDashboard = useCallback(async () => {
    const res = await billingApi.getDashboard();
    if (res.data) setDashboard(res.data);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const filters = subsFilter.status || subsFilter.plan_type
      ? { status: subsFilter.status || undefined, plan_type: subsFilter.plan_type || undefined }
      : undefined;
    const res = await billingApi.getSubscriptions(subsPage, filters);
    if (res.data) {
      setSubscriptions(res.data.subscriptions);
      setSubsTotal(res.data.pagination.total);
    }
  }, [subsPage, subsFilter]);

  const loadPayments = useCallback(async () => {
    const filters = payFilter.status || payFilter.type
      ? { status: payFilter.status || undefined, type: payFilter.type || undefined }
      : undefined;
    const res = await billingApi.getPayments(payPage, filters);
    if (res.data) {
      setPayments(res.data.payments);
      setPayTotal(res.data.pagination.total);
    }
  }, [payPage, payFilter]);

  const loadFailedPayments = useCallback(async () => {
    const res = await billingApi.getFailedPayments();
    if (res.data) setFailedPayments(res.data.failed_payments);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadDashboard(), loadSubscriptions(), loadPayments(), loadFailedPayments()]);
      setLoading(false);
    }
    init();
  }, [loadDashboard, loadSubscriptions, loadPayments, loadFailedPayments]);

  useEffect(() => { loadSubscriptions(); }, [loadSubscriptions]);
  useEffect(() => { loadPayments(); }, [loadPayments]);

  async function handleRefund() {
    if (!refundTarget) return;
    setRefunding(true);
    const res = await billingApi.refund(refundTarget.payment_key, '관리자 환불');
    setRefunding(false);
    setRefundTarget(null);
    if (res.data?.success) {
      alert(res.data.message);
      loadPayments();
      loadDashboard();
    } else {
      alert(res.error || '환불 실패');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">결제 관리</h1>
          <p className="text-muted-foreground">구독, 결제, 매출 현황을 관리합니다.</p>
        </div>

        {/* 매출 대시보드 — 3-tier MRR */}
        {dashboard && (
          <div className="space-y-4">
            {/* Row 1: MRR breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" /> 총 MRR
                  </div>
                  <p className="text-2xl font-bold">₩{formatKRW(dashboard.total_mrr ?? dashboard.mrr)}</p>
                  <p className="text-xs text-muted-foreground mt-1">구독 + 수수료 + 알림톡</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CreditCard className="h-4 w-4" /> 구독 MRR
                  </div>
                  <p className="text-xl font-bold">₩{formatKRW(dashboard.subscription_mrr ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">AI Plus 4,900원 × {dashboard.total_subscribers}개</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" /> 수수료 MRR
                  </div>
                  <p className="text-xl font-bold">₩{formatKRW(dashboard.commission_mrr ?? 0)}</p>
                  <p className="text-xs text-muted-foreground">Payment 결제 수수료</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MessageSquare className="h-4 w-4" /> 알림톡 매출
                  </div>
                  <p className="text-xl font-bold">₩{formatKRW(dashboard.alimtalk_revenue ?? dashboard.credit_revenue)}</p>
                  <p className="text-xs text-muted-foreground">크레딧 충전 합계</p>
                </CardContent>
              </Card>
            </div>
            {/* Row 2: Plan distribution & operational metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Building2 className="h-4 w-4" /> 플랜별 학원
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-gray-100 text-gray-700">F {dashboard.plan_counts?.free ?? 0}</Badge>
                    <Badge className="bg-blue-100 text-blue-700">B {dashboard.plan_counts?.basic ?? 0}</Badge>
                    <Badge className="bg-green-100 text-green-700">P {dashboard.plan_counts?.payment ?? 0}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Star className="h-4 w-4 text-yellow-500" /> 창립멤버
                  </div>
                  <p className="text-xl font-bold">{dashboard.founding_member_count ?? dashboard.founding_subscribers}/100</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" /> 구독자
                  </div>
                  <p className="text-xl font-bold">{dashboard.total_subscribers}</p>
                  <p className="text-xs text-muted-foreground">
                    월{dashboard.monthly_subscribers} / 연{dashboard.yearly_subscribers}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle className="h-4 w-4" /> 결제 성공률
                  </div>
                  <p className="text-xl font-bold">{dashboard.payment_success_rate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4" /> 해지율
                  </div>
                  <p className="text-xl font-bold">{dashboard.churn_rate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <AlertTriangle className="h-4 w-4" /> 재시도 대기
                  </div>
                  <p className="text-xl font-bold text-amber-600">{dashboard.pending_retries}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 탭: 구독 / 결제내역 / 실패 */}
        <Tabs defaultValue="subscriptions">
          <TabsList>
            <TabsTrigger value="subscriptions">구독 현황</TabsTrigger>
            <TabsTrigger value="payments">결제 내역</TabsTrigger>
            <TabsTrigger value="failed">
              결제 실패
              {failedPayments.length > 0 && (
                <Badge className="ml-1 bg-red-100 text-red-700">{failedPayments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 구독 현황 */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex gap-2">
              <Select value={subsFilter.status} onValueChange={(v) => { setSubsFilter(f => ({...f, status: v === 'all' ? '' : v})); setSubsPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="상태" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="cancelled">해지</SelectItem>
                  <SelectItem value="expired">만료</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subsFilter.plan_type} onValueChange={(v) => { setSubsFilter(f => ({...f, plan_type: v === 'all' ? '' : v})); setSubsPage(1); }}>
                <SelectTrigger className="w-40"><SelectValue placeholder="플랜" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="aiplus_monthly">AI Plus 월간</SelectItem>
                  <SelectItem value="aiplus_yearly">AI Plus 연간</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => { loadSubscriptions(); loadDashboard(); }}>
                <RefreshCw className="h-4 w-4 mr-1" /> 새로고침
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원</TableHead>
                    <TableHead>플랜</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>카드</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>다음결제일</TableHead>
                    <TableHead>등록일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.academy_name}</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700">AI Plus</Badge>
                        <Badge variant="outline" className="ml-1">{sub.plan_type === 'monthly' ? '월간 ₩4,900' : '연간 ₩53,900'}</Badge>
                        {sub.is_founding_price && <Badge className="ml-1 bg-purple-100 text-purple-700">창립</Badge>}
                      </TableCell>
                      <TableCell>₩{formatKRW(sub.amount)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.card_company} {sub.card_number_masked}
                      </TableCell>
                      <TableCell><StatusBadge status={sub.status} /></TableCell>
                      <TableCell>{formatDate(sub.next_billing_date)}</TableCell>
                      <TableCell>{formatDate(sub.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {subscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        구독 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {subsTotal > 20 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={subsPage <= 1} onClick={() => setSubsPage(p => p - 1)}>이전</Button>
                <span className="text-sm text-muted-foreground py-2">{subsPage} / {Math.ceil(subsTotal / 20)}</span>
                <Button variant="outline" size="sm" disabled={subsPage >= Math.ceil(subsTotal / 20)} onClick={() => setSubsPage(p => p + 1)}>다음</Button>
              </div>
            )}
          </TabsContent>

          {/* 결제 내역 */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex gap-2">
              <Select value={payFilter.status} onValueChange={(v) => { setPayFilter(f => ({...f, status: v === 'all' ? '' : v})); setPayPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="상태" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="success">성공</SelectItem>
                  <SelectItem value="failed">실패</SelectItem>
                  <SelectItem value="refunded">환불</SelectItem>
                </SelectContent>
              </Select>
              <Select value={payFilter.type} onValueChange={(v) => { setPayFilter(f => ({...f, type: v === 'all' ? '' : v})); setPayPage(1); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="타입" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="subscription">구독</SelectItem>
                  <SelectItem value="credit">크레딧</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>승인일</TableHead>
                    <TableHead>영수증</TableHead>
                    <TableHead>액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((pay) => (
                    <TableRow key={pay.id}>
                      <TableCell className="font-medium">{pay.academy_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pay.type === 'subscription' ? '구독' : '크레딧'}</Badge>
                      </TableCell>
                      <TableCell>
                        {pay.amount === 0 ? '무료' : `₩${formatKRW(pay.amount)}`}
                        {pay.refund_amount ? (
                          <span className="text-xs text-purple-600 ml-1">(-₩{formatKRW(pay.refund_amount)})</span>
                        ) : null}
                      </TableCell>
                      <TableCell><StatusBadge status={pay.status} /></TableCell>
                      <TableCell>{formatDate(pay.approved_at)}</TableCell>
                      <TableCell>
                        {pay.receipt_url && (
                          <a href={pay.receipt_url} target="_blank" rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        {pay.status === 'success' && pay.amount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => setRefundTarget(pay)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> 환불
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        결제 데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            {payTotal > 20 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" disabled={payPage <= 1} onClick={() => setPayPage(p => p - 1)}>이전</Button>
                <span className="text-sm text-muted-foreground py-2">{payPage} / {Math.ceil(payTotal / 20)}</span>
                <Button variant="outline" size="sm" disabled={payPage >= Math.ceil(payTotal / 20)} onClick={() => setPayPage(p => p + 1)}>다음</Button>
              </div>
            )}
          </TabsContent>

          {/* 결제 실패 */}
          <TabsContent value="failed" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학원</TableHead>
                    <TableHead>플랜</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>재시도</TableHead>
                    <TableHead>마지막 재시도</TableHead>
                    <TableHead>에러</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedPayments.map((fp) => (
                    <TableRow key={fp.id}>
                      <TableCell className="font-medium">{fp.academy_name}</TableCell>
                      <TableCell>{fp.plan_type === 'monthly' ? '월간' : '연간'}</TableCell>
                      <TableCell>₩{formatKRW(fp.amount)}</TableCell>
                      <TableCell>
                        <Badge className={fp.retry_count >= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {fp.retry_count}/3
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(fp.last_retry_at)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {fp.last_error || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {failedPayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        결제 실패 건이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 환불 확인 다이얼로그 */}
      <AlertDialog open={!!refundTarget} onOpenChange={() => setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환불 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {refundTarget && (
                <>
                  <strong>{refundTarget.academy_name}</strong>의 결제 ₩{formatKRW(refundTarget.amount)}을 환불합니다.
                  <br />이 작업은 되돌릴 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={refunding}
              className="bg-red-500 hover:bg-red-600"
            >
              {refunding ? '처리 중...' : '환불 실행'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
