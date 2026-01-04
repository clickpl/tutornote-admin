'use client';

import { useState, useEffect } from 'react';
import {
  Scale,
  FileCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  Building2,
  FileText,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { legalApi, Consent, ConsentRequest, ConsentFilters } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TabType = 'consents' | 'requests';

interface LegalStats {
  consent_versions: Array<{
    consent_type: string;
    consent_version: string;
    count: number;
  }>;
  consent_requests: {
    pending: number;
    completed: number;
    expired: number;
  };
}

export default function LegalPage() {
  const [tab, setTab] = useState<TabType>('consents');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [requests, setRequests] = useState<ConsentRequest[]>([]);
  const [stats, setStats] = useState<LegalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<ConsentFilters>({});
  const [academySearch, setAcademySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [selectedConsent, setSelectedConsent] = useState<Consent | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const newFilters: ConsentFilters = {};
    if (academySearch) newFilters.academy = academySearch;
    if (dateFrom) newFilters.dateFrom = dateFrom;
    if (dateTo) newFilters.dateTo = dateTo;
    if (typeFilter) newFilters.type = typeFilter;
    if (categoryFilter) newFilters.category = categoryFilter;
    if (statusFilter) newFilters.status = statusFilter;
    setFilters(newFilters);
  }, [academySearch, dateFrom, dateTo, typeFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    if (tab === 'consents') {
      fetchConsents();
    } else {
      fetchRequests();
    }
  }, [tab, page, filters]);

  const fetchStats = async () => {
    const { data } = await legalApi.getStats();
    if (data) setStats(data);
  };

  const fetchConsents = async () => {
    setLoading(true);
    const { data } = await legalApi.getConsents(page, 20, filters);
    if (data) {
      setConsents(data.consents);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await legalApi.getConsentRequests(page, 20, filters);
    if (data) {
      setRequests(data.requests);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    if (tab === 'consents') fetchConsents();
    else fetchRequests();
  };

  const handleResetFilters = () => {
    setAcademySearch('');
    setDateFrom('');
    setDateTo('');
    setTypeFilter('');
    setCategoryFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const handleExport = () => {
    const url = tab === 'consents'
      ? legalApi.exportConsents(filters)
      : legalApi.exportConsentRequests(filters);

    const token = localStorage.getItem('admin_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = tab === 'consents'
          ? `consent_log_${new Date().toISOString().slice(0, 10)}.csv`
          : `guardian_consent_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
      });
  };

  const handleResend = async (requestId: number) => {
    if (!confirm('보호자에게 동의 요청 알림톡을 재발송하시겠습니까?')) return;
    setResendingId(requestId);
    const { data, error } = await legalApi.resendConsentRequest(requestId);
    if (data?.success) {
      alert(data.message);
      fetchRequests();
    } else {
      alert(error || '재발송에 실패했습니다');
    }
    setResendingId(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'completed':
      case 'agreed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'expired':
      case 'revoked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
      case 'agreed':
        return '동의완료';
      case 'pending':
        return '대기중';
      case 'expired':
        return '만료';
      case 'revoked':
        return '철회';
      default:
        return status;
    }
  };

  const getConsentTypeLabel = (type: string) => type === 'user' ? '원장' : '보호자';
  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      terms: '이용약관', privacy: '개인정보처리방침', privacy_child: '아동 개인정보',
      ai_overseas: 'AI 국외이전', marketing_email: '마케팅(이메일)',
      marketing_sms: '마케팅(SMS)', marketing_push: '마케팅(푸시)',
    };
    return labels[category] || category;
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">법무 관리</h1>
          <p className="text-sm text-muted-foreground">동의 로그 상세 조회 및 증빙 관리</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardDescription>약관 동의</CardDescription>
                  <CardTitle>{stats.consent_versions.reduce((acc, v) => acc + v.count, 0)}건</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                  <ShieldCheck className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <CardDescription>보호자 동의 대기</CardDescription>
                  <CardTitle>{stats.consent_requests.pending}건</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardDescription>보호자 동의 완료</CardDescription>
                  <CardTitle>{stats.consent_requests.completed}건</CardTitle>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ShieldCheck className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardDescription>보호자 동의 만료</CardDescription>
                  <CardTitle>{stats.consent_requests.expired}건</CardTitle>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <Label className="text-xs">학원명</Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={academySearch}
                    onChange={(e) => setAcademySearch(e.target.value)}
                    placeholder="학원명 검색..."
                    className="pl-9"
                  />
                </div>
              </div>

              {tab === 'consents' && (
                <>
                  <div className="min-w-[120px]">
                    <Label className="text-xs">유형</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="전체" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="user">원장</SelectItem>
                        <SelectItem value="guardian">보호자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <Label className="text-xs">동의 항목</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="전체" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="terms">이용약관</SelectItem>
                        <SelectItem value="privacy">개인정보처리방침</SelectItem>
                        <SelectItem value="ai_overseas">AI 국외이전</SelectItem>
                        <SelectItem value="privacy_child">아동 개인정보</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="min-w-[120px]">
                <Label className="text-xs">상태</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="전체" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {tab === 'consents' ? (
                      <>
                        <SelectItem value="agreed">동의완료</SelectItem>
                        <SelectItem value="revoked">철회</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="completed">동의완료</SelectItem>
                        <SelectItem value="expired">만료</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[140px]">
                <Label className="text-xs">시작일</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs">종료일</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="gap-2">
                  <Search className="h-4 w-4" />검색
                </Button>
                <Button variant="outline" onClick={handleResetFilters} className="gap-2">
                  <RefreshCw className="h-4 w-4" />초기화
                </Button>
                <Button variant="secondary" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />내보내기
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs & Table */}
        <Tabs value={tab} onValueChange={(v) => { setTab(v as TabType); setPage(1); handleResetFilters(); }}>
          <TabsList>
            <TabsTrigger value="consents">학원 운영자 동의 로그</TabsTrigger>
            <TabsTrigger value="requests">보호자 동의 현황</TabsTrigger>
          </TabsList>

          <TabsContent value="consents" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Scale className="h-4 w-4 text-primary" />
                  학원 운영자(원장) 약관 동의 이력
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-4 p-6">
                    {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>학원 ID</TableHead>
                        <TableHead>학원명</TableHead>
                        <TableHead>유형</TableHead>
                        <TableHead>동의 항목</TableHead>
                        <TableHead>버전</TableHead>
                        <TableHead>동의 일시</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                            동의 이력이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        consents.map((consent) => (
                          <TableRow key={consent.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              AC-{String(consent.academy_id || 0).padStart(3, '0')}
                            </TableCell>
                            <TableCell>{consent.academy_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={consent.consent_type === 'user' ? 'default' : 'secondary'}>
                                {getConsentTypeLabel(consent.consent_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getCategoryLabel(consent.consent_category)}</TableCell>
                            <TableCell className="text-primary">v{consent.consent_version}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(consent.consented_at)}</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{consent.ip_address || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(consent.status)}>{getStatusLabel(consent.status)}</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => {
                                  setSelectedConsent(consent);
                                  setTermsDialogOpen(true);
                                }}
                              >
                                <FileText className="h-3 w-3" />약관보기
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-yellow-500" />
                  보호자 동의(만 14세 미만 아동) 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-4 p-6">
                    {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>학생명</TableHead>
                        <TableHead>학원명</TableHead>
                        <TableHead>보호자 연락처</TableHead>
                        <TableHead>요청 일시</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>완료 일시</TableHead>
                        <TableHead>만료 일시</TableHead>
                        <TableHead>액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                            보호자 동의 요청이 없습니다
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell className="font-medium">{req.student_name_masked}</TableCell>
                            <TableCell className="text-muted-foreground">{req.academy_name}</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{req.parent_phone_masked}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(req.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusVariant(req.status)}>{getStatusLabel(req.status)}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(req.completed_at)}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(req.expires_at)}</TableCell>
                            <TableCell>
                              {req.can_resend && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResend(req.id)}
                                  disabled={resendingId === req.id}
                                  className="h-7 gap-1 text-xs text-yellow-500 hover:text-yellow-400"
                                >
                                  {resendingId === req.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  재발송{req.sent_count && req.sent_count > 0 && `(${req.sent_count})`}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Notice */}
        <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <p>* 동의 로그는 법적 증빙을 위해 읽기 전용으로 관리됩니다. 수정 및 삭제가 불가능합니다.</p>
            <p>* 보호자 연락처 및 학생 이름은 개인정보보호를 위해 마스킹 처리됩니다.</p>
          </div>
        </div>

        {/* 약관 보기 Dialog */}
        <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {selectedConsent && getCategoryLabel(selectedConsent.consent_category)}
              </DialogTitle>
              <DialogDescription>
                버전: v{selectedConsent?.consent_version} | 동의일: {selectedConsent && formatDate(selectedConsent.consented_at)}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-lg border bg-muted/30 p-4">
              <TermsContent category={selectedConsent?.consent_category || ''} />
            </div>
            <div className="mt-4 flex items-center gap-4 rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">동의 완료</p>
                <p className="text-green-600 dark:text-green-500">
                  {selectedConsent?.user_name || selectedConsent?.email}님이 {selectedConsent && formatDate(selectedConsent.consented_at)}에 동의하였습니다.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function TermsContent({ category }: { category: string }) {
  const termsData: Record<string, { title: string; content: string }> = {
    privacy_child: {
      title: '아동 개인정보 수집·이용 동의',
      content: `[수집 목적]
- AI 기반 학습 피드백 리포트 생성 및 제공
- 학습 진도 관리 및 출결 관리
- 학부모 알림 서비스 제공

[수집 항목]
- 필수: 학생 이름, 학년, 학원 정보
- 선택: 프로필 사진

[보유 기간]
- 서비스 이용 종료 시까지 (퇴원 후 1년간 보관 후 파기)

[동의 거부 권리]
- 동의를 거부할 권리가 있으며, 거부 시 AI 피드백 서비스 이용이 제한됩니다.`
    },
    ai_overseas: {
      title: 'AI 국외이전 동의',
      content: `[이전되는 개인정보]
- 학생의 학습 진도 데이터 (익명화 처리)
- 출결 기록

[이전 국가 및 업체]
- 미국 (Anthropic / Claude AI)

[이전 목적]
- AI 기반 학습 피드백 생성

[이전 방법]
- 암호화된 네트워크를 통한 전송

[보유 기간]
- 피드백 생성 완료 후 즉시 삭제

[동의 거부 권리]
- 동의를 거부할 권리가 있으며, 거부 시 AI 피드백 서비스 이용이 제한됩니다.`
    },
    terms: {
      title: '서비스 이용약관',
      content: `제1조 (목적)
이 약관은 TutorNote 서비스의 이용에 관한 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (서비스 내용)
- AI 기반 학습 피드백 생성
- 출결 관리 시스템
- 학부모 알림 서비스

제3조 (이용자의 의무)
회원은 서비스 이용 시 관계 법령을 준수해야 합니다.`
    },
    privacy: {
      title: '개인정보 처리방침',
      content: `1. 개인정보의 수집·이용 목적
- 서비스 제공 및 계약 이행
- 회원 관리 및 본인 확인

2. 수집하는 개인정보 항목
- 필수: 이메일, 비밀번호, 학원명, 연락처
- 선택: 학원 주소

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시까지 (법령에 따른 보존 기간 별도)`
    },
  };

  const data = termsData[category] || { title: '약관', content: '약관 내용을 불러올 수 없습니다.' };

  return (
    <div className="space-y-2 whitespace-pre-wrap text-sm text-muted-foreground">
      {data.content}
    </div>
  );
}
