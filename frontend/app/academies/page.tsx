'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Star,
  Bot,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { academiesApi } from '@/lib/api';
import { formatKSTDateOnly } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import AlimtalkSendModal from '@/components/admin/AlimtalkSendModal';

interface Academy {
  id: number;
  name: string;
  phone: string;
  owner_email: string;
  owner_name: string;
  student_count: number;
  attendance_code_type: string;
  status: string;
  provider?: string;
  plan: 'free' | 'aiplus' | 'payment';
  payment_enabled: boolean;
  payment_status?: 'active' | 'inactive' | 'reviewing';
  is_founding_member: boolean;
  created_at: string;
  last_login_at?: string;
}

const planConfig: Record<string, { label: string; className: string; aiLabel: string }> = {
  free: { label: 'Free', className: 'bg-gray-100 text-gray-700', aiLabel: 'AI 5명' },
  aiplus: { label: 'AI Plus', className: 'bg-blue-100 text-blue-700', aiLabel: 'AI 무제한' },
  payment: { label: 'Payment', className: 'bg-green-100 text-green-700', aiLabel: 'AI 무제한' },
};

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '활성', className: 'bg-green-100 text-green-700' },
  inactive: { label: '비활성', className: 'bg-gray-100 text-gray-600' },
  reviewing: { label: '심사중', className: 'bg-yellow-100 text-yellow-700' },
};

const providerConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  kakao: { label: '카카오', bg: 'bg-yellow-400', text: 'text-yellow-900', icon: 'K' },
  naver: { label: '네이버', bg: 'bg-green-500', text: 'text-white', icon: 'N' },
  google: { label: '구글', bg: 'bg-blue-500', text: 'text-white', icon: 'G' },
  local: { label: '이메일', bg: 'bg-slate-200', text: 'text-slate-600', icon: '@' },
};

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: '활성', variant: 'default' },
  suspended: { label: '정지', variant: 'destructive' },
  pending: { label: '대기', variant: 'secondary' },
  deleted: { label: '삭제됨', variant: 'outline' },
};

interface AlimtalkTarget {
  academyId: number;
  ownerName: string;
  ownerPhone: string;
}

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [alimtalkTarget, setAlimtalkTarget] = useState<AlimtalkTarget | null>(null);

  useEffect(() => {
    fetchAcademies();
  }, [page, statusFilter, planFilter]);

  const fetchAcademies = async (searchQuery = search) => {
    setLoading(true);
    const { data, error } = await academiesApi.list(page, 20, searchQuery, statusFilter, planFilter);

    if (data) {
      setAcademies(data.academies);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAcademies(search);
  };

  const formatDate = (dateString: string) => {
    return formatKSTDateOnly(dateString);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">학원 관리</h1>
            <p className="text-sm text-muted-foreground">총 {total}개 학원</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="학원명 또는 이메일로 검색..."
                className="pl-10"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(''); setPage(1); }}
            >
              전체
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('active'); setPage(1); }}
            >
              활성
            </Button>
            <Button
              variant={statusFilter === 'suspended' ? 'destructive' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('suspended'); setPage(1); }}
            >
              정지
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter('pending'); setPage(1); }}
            >
              대기
            </Button>
            <span className="border-l mx-1" />
            {/* Plan Filter */}
            <Button
              variant={planFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPlanFilter(''); setPage(1); }}
            >
              전체 플랜
            </Button>
            <Button
              variant={planFilter === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPlanFilter('free'); setPage(1); }}
            >
              Free
            </Button>
            <Button
              variant={planFilter === 'aiplus' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPlanFilter('aiplus'); setPage(1); }}
            >
              AI Plus
            </Button>
            <Button
              variant={planFilter === 'payment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setPlanFilter('payment'); setPage(1); }}
            >
              Payment
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>학원명</TableHead>
                      <TableHead>원장</TableHead>
                      <TableHead>플랜</TableHead>
                      <TableHead>학생수</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>출석방식</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead>최근 로그인</TableHead>
                      <TableHead className="w-[120px]">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                          등록된 학원이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      academies.map((academy) => (
                        <TableRow key={academy.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{academy.name}</p>
                                <p className="text-xs text-muted-foreground">{academy.phone || '-'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="font-medium">{academy.owner_name || '-'}</p>
                                <p className="text-xs text-muted-foreground">{academy.owner_email}</p>
                              </div>
                              {(() => {
                                const config = providerConfig[academy.provider || 'local'] || providerConfig.local;
                                return (
                                  <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${config.bg} ${config.text}`}
                                    title={`${config.label} 가입`}
                                  >
                                    {config.icon}
                                  </span>
                                );
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Badge className={planConfig[academy.plan || 'free']?.className || planConfig.free.className}>
                                  {planConfig[academy.plan || 'free']?.label || 'Free'}
                                </Badge>
                                {academy.is_founding_member && (
                                  <span className="text-yellow-500" title="창립멤버">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  <Bot className="h-3 w-3 mr-0.5" />
                                  {planConfig[academy.plan || 'free']?.aiLabel || 'AI 5명'}
                                </Badge>
                                {academy.plan === 'payment' && academy.payment_status && (
                                  <Badge className={`text-[10px] px-1 py-0 ${paymentStatusConfig[academy.payment_status]?.className || 'bg-gray-100 text-gray-600'}`}>
                                    <CreditCard className="h-3 w-3 mr-0.5" />
                                    {paymentStatusConfig[academy.payment_status]?.label || academy.payment_status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{academy.student_count}명</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusLabels[academy.status || 'active']?.variant || 'default'}>
                              {statusLabels[academy.status || 'active']?.label || academy.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={academy.attendance_code_type === 'phone_last4' ? 'default' : 'secondary'}>
                              {academy.attendance_code_type === 'phone_last4' ? '뒤4자리' : '자동할당'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(academy.created_at)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {academy.last_login_at ? formatDate(academy.last_login_at) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="알림톡 발송"
                                onClick={() =>
                                  setAlimtalkTarget({
                                    academyId: academy.id,
                                    ownerName: academy.owner_name || '',
                                    ownerPhone: academy.phone || '',
                                  })
                                }
                              >
                                <MessageSquare className="h-4 w-4 text-primary" />
                              </Button>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/academies/${academy.id}`} title="상세보기">
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-6 py-4">
                    <p className="text-sm text-muted-foreground">
                      {total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 알림톡 발송 모달 */}
      {alimtalkTarget && (
        <AlimtalkSendModal
          open={!!alimtalkTarget}
          onOpenChange={(open) => { if (!open) setAlimtalkTarget(null); }}
          academyId={alimtalkTarget.academyId}
          ownerName={alimtalkTarget.ownerName}
          ownerPhone={alimtalkTarget.ownerPhone}
        />
      )}
    </AdminLayout>
  );
}
