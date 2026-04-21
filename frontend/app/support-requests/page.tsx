'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  InboxIcon,
  BarChart2,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { supportRequestsApi, type SupportRequest, type SupportRequestStatus, type SupportRequestStats } from '@/lib/api';
import { formatKSTDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── 상수 ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SupportRequestStatus,
  { label: string; badgeClass: string; icon: typeof AlertCircle }
> = {
  new: {
    label: 'NEW',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
  },
  in_progress: {
    label: '대응중',
    badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  resolved: {
    label: '완료',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  no_action: {
    label: '종료',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
  },
};

const INTENT_LABELS: Record<string, string> = {
  this_week: '이번 주 다시 써볼게요',
  this_month: '이번 달 다시 써볼게요',
  no_plan: '계획 없어요',
  quit: '그만두려고 해요',
};

const DATE_PRESETS = [
  { label: '최근 7일', days: 7 },
  { label: '최근 30일', days: 30 },
  { label: '전체', days: 0 },
];

const PAGE_LIMIT = 15;

// ─── 상태 배지 ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SupportRequestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.badgeClass}`}
    >
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ─── 상세 모달 ───────────────────────────────────────────────────────────────

interface DetailModalProps {
  request: SupportRequest | null;
  onClose: () => void;
  onUpdated: () => void;
}

function DetailModal({ request, onClose, onUpdated }: DetailModalProps) {
  const [status, setStatus] = useState<SupportRequestStatus>('new');
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setMemo(request.admin_memo ?? '');
      setSaveMsg('');
    }
  }, [request]);

  const handleSave = async () => {
    if (!request) return;
    setSaving(true);
    setSaveMsg('');

    const { data, error } = await supportRequestsApi.update(request.id, {
      status,
      admin_memo: memo,
    });

    if (data?.success) {
      setSaveMsg('저장되었습니다.');
      onUpdated();
    } else {
      setSaveMsg(error || '저장에 실패했습니다.');
    }
    setSaving(false);
  };

  const handleResolve = async () => {
    if (!request) return;
    setSaving(true);
    const { data, error } = await supportRequestsApi.update(request.id, {
      status: 'resolved',
      admin_memo: memo,
    });
    if (data?.success) {
      onUpdated();
      onClose();
    } else {
      setSaveMsg(error || '저장에 실패했습니다.');
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            지원 요청 상세
          </DialogTitle>
          <DialogDescription>
            {request?.academy_name} / {request?.user_name}
          </DialogDescription>
        </DialogHeader>

        {request && (
          <div className="space-y-4 py-2">
            {/* 학원 링크 */}
            <div className="flex items-center justify-between">
              <StatusBadge status={request.status} />
              <Link
                href={`/academies/${request.academy_id}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={onClose}
              >
                학원 상세 보기
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* 응답 내용 */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">접수일시</p>
                <p className="font-medium">{formatKSTDate(request.created_at)}</p>
              </div>

              {request.difficulties_labels && request.difficulties_labels.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">어려운 부분</p>
                  <div className="flex flex-wrap gap-1.5">
                    {request.difficulties_labels.map((label, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-xs text-blue-700"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {request.intent && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">앞으로의 계획</p>
                  <p>{INTENT_LABELS[request.intent] ?? request.intent}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">도움 요청 여부</p>
                <p>{request.wants_help ? '네, 도와주세요' : '혼자 해볼게요'}</p>
              </div>

              {request.free_text && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">자유 의견</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{request.free_text}</p>
                </div>
              )}
            </div>

            {/* 대응 상태 변경 */}
            <div className="space-y-2">
              <Label>대응 상태</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SupportRequestStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">신규</SelectItem>
                  <SelectItem value="in_progress">대응중</SelectItem>
                  <SelectItem value="resolved">완료</SelectItem>
                  <SelectItem value="no_action">종료 (대응 없음)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 관리자 메모 */}
            <div className="space-y-2">
              <Label>관리자 메모</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="대응 내용, 통화 여부, 조치 사항 등 메모..."
                rows={3}
              />
            </div>

            {saveMsg && (
              <p className="text-sm text-center text-muted-foreground">{saveMsg}</p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            닫기
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            저장
          </Button>
          <Button onClick={handleResolve} disabled={saving || request?.status === 'resolved'}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            대응 완료 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats 섹션 ──────────────────────────────────────────────────────────────

function StatsSection({ stats }: { stats: SupportRequestStats }) {
  if (stats.total === 0) return null;

  const maxDiffCount = stats.difficulties.reduce((m, d) => Math.max(m, d.count), 0);
  const maxIntentCount = stats.intent.reduce((m, d) => Math.max(m, d.count), 0);
  const helpTotal = stats.wants_help.yes + stats.wants_help.no;
  const helpYesPct = helpTotal > 0 ? Math.round((stats.wants_help.yes / helpTotal) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 카드1: 어려움 유형 */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-semibold">어려움 유형</p>
          </div>
          <div className="space-y-2">
            {stats.difficulties.slice(0, 5).map((d) => (
              <div key={d.code}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-muted-foreground truncate max-w-[80%]">{d.label}</span>
                  <span className="text-xs font-semibold text-foreground ml-1">{d.count}{stats.total > 0 ? <span className="text-muted-foreground font-normal"> ({Math.round((d.count / stats.total) * 100)}%)</span> : ''}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: maxDiffCount > 0 ? `${Math.round((d.count / maxDiffCount) * 100)}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 카드2: 재개 의사 */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            <p className="text-sm font-semibold">재개 의사</p>
          </div>
          <div className="space-y-2">
            {stats.intent.map((d) => {
              const pct = helpTotal > 0 ? Math.round((d.count / stats.total) * 100) : 0;
              return (
                <div key={d.code}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-muted-foreground truncate max-w-[75%]">{d.label}</span>
                    <span className="text-xs font-semibold text-foreground ml-1">{d.count} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: maxIntentCount > 0 ? `${Math.round((d.count / maxIntentCount) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 카드3: 도움 요청 */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-violet-500" />
            <p className="text-sm font-semibold">도움 요청 여부</p>
          </div>
          <div className="flex items-end gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-600">{stats.wants_help.yes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">도와주세요</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-400">{stats.wants_help.no}</p>
              <p className="text-xs text-muted-foreground mt-0.5">혼자 해볼게요</p>
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all"
              style={{ width: `${helpYesPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-right">{helpYesPct}% 도움 요청</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 카드 아이템 ─────────────────────────────────────────────────────────────

interface RequestCardProps {
  item: SupportRequest;
  onDetail: (item: SupportRequest) => void;
  onQuickResolve: (item: SupportRequest) => void;
}

function RequestCard({ item, onDetail, onQuickResolve }: RequestCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">
            {item.academy_name}{' '}
            <span className="text-muted-foreground font-normal">/ {item.user_name}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatKSTDate(item.created_at)}
            {item.source === 'd7_reactivation' && (
              <span className="ml-2 text-blue-600">(D+7 지원 요청)</span>
            )}
          </p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.difficulties_labels && item.difficulties_labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.difficulties_labels.map((label, i) => (
            <span
              key={i}
              className="rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs text-blue-600"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {item.intent && (
        <p className="text-sm text-muted-foreground">
          계획: <span className="text-foreground">{INTENT_LABELS[item.intent] ?? item.intent}</span>
        </p>
      )}

      {item.free_text && (
        <p className="text-sm text-muted-foreground line-clamp-2 italic">
          "{item.free_text}"
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={() => onDetail(item)}>
          상세보기
        </Button>
        {item.status !== 'resolved' && (
          <Button size="sm" variant="ghost" onClick={() => onQuickResolve(item)}>
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            대응 완료
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function SupportRequestsPage() {
  const [items, setItems] = useState<SupportRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<SupportRequestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [statusFilter, setStatusFilter] = useState('');
  const [datePreset, setDatePreset] = useState(7);
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [detailItem, setDetailItem] = useState<SupportRequest | null>(null);

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  const getDateFrom = (days: number) => {
    if (days === 0) return undefined;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const fetchList = useCallback(
    async (currentPage = 1) => {
      setLoading(true);

      const params: Parameters<typeof supportRequestsApi.list>[0] = {
        page: currentPage,
        limit: PAGE_LIMIT,
      };
      if (statusFilter) params.status = statusFilter;
      const dateFrom = getDateFrom(datePreset);
      if (dateFrom) params.date_from = dateFrom;

      const [listResult, statsResult] = await Promise.all([
        supportRequestsApi.list(params),
        supportRequestsApi.getStats(params).catch(() => null),
      ]);

      if (listResult.data) {
        setItems(listResult.data.items);
        setTotal(listResult.data.total);
      }
      if (statsResult) {
        setStats(statsResult);
      }
      setLoading(false);
    },
    [statusFilter, datePreset]
  );

  useEffect(() => {
    setPage(1);
    fetchList(1);
  }, [statusFilter, datePreset, fetchList]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchText(searchInput);
    setPage(1);
    fetchList(1);
  };

  const handleQuickResolve = async (item: SupportRequest) => {
    const { data } = await supportRequestsApi.update(item.id, { status: 'resolved' });
    if (data?.success) fetchList(page);
  };

  const handleDetailUpdated = () => {
    fetchList(page);
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold">고객 지원 요청</h1>
          <p className="text-sm text-muted-foreground">
            원장님이 제출한 지원 요청 설문 응답을 확인하고 대응합니다.
          </p>
        </div>

        {/* 필터 바 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* 상태 필터 */}
          <div className="flex gap-1.5 flex-wrap">
            {[
              { value: '', label: '전체' },
              { value: 'new', label: 'NEW' },
              { value: 'in_progress', label: '대응중' },
              { value: 'resolved', label: '완료' },
              { value: 'no_action', label: '종료' },
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={statusFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* 기간 필터 */}
          <div className="flex gap-1.5">
            {DATE_PRESETS.map(({ label, days }) => (
              <Button
                key={days}
                variant={datePreset === days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDatePreset(days)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* 검색 (향후 확장용) */}
          <form onSubmit={handleSearch} className="flex gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="학원명 검색..."
                className="pl-10 w-48"
              />
            </div>
            <Button type="submit" size="sm">검색</Button>
          </form>
        </div>

        {/* Stats 섹션 */}
        {stats && <StatsSection stats={stats} />}

        {/* 총 건수 */}
        <p className="text-sm text-muted-foreground">
          총 <span className="font-semibold text-foreground">{total}</span>건
        </p>

        {/* 리스트 */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-muted-foreground gap-3">
            <InboxIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">지원 요청이 없습니다.</p>
            {(statusFilter || datePreset !== 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter(''); setDatePreset(7); }}
              >
                필터 초기화
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <RequestCard
                key={item.id}
                item={item}
                onDetail={setDetailItem}
                onQuickResolve={handleQuickResolve}
              />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {total}건 중 {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchList(p); }}
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
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchList(p); }}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      <DetailModal
        request={detailItem}
        onClose={() => setDetailItem(null)}
        onUpdated={handleDetailUpdated}
      />
    </AdminLayout>
  );
}
