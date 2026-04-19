'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  academyPaymentsApi,
  PaymentTransaction,
  PaymentTransactionSummary,
} from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  DollarSign,
  CreditCard,
  Percent,
  Landmark,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
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

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '대기', className: 'bg-yellow-100 text-yellow-700' },
  success: { label: '성공', className: 'bg-green-100 text-green-700' },
  failed: { label: '실패', className: 'bg-red-100 text-red-700' },
  cancelled: { label: '취소', className: 'bg-gray-100 text-gray-600' },
  refunded: { label: '환불', className: 'bg-orange-100 text-orange-700' },
};

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [summary, setSummary] = useState<PaymentTransactionSummary>({
    total_amount: 0,
    total_pg_fee: 0,
    total_tn_fee: 0,
    total_settlement: 0,
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    academy_id: '',
    status: '',
    date_from: '',
    date_to: '',
  });

  const totalPages = Math.ceil(total / 20);

  const loadData = useCallback(async () => {
    setLoading(true);
    const filterParams = {
      academy_id: filters.academy_id || undefined,
      status: filters.status || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    };
    const res = await academyPaymentsApi.list(page, filterParams);
    if (res.data) {
      setTransactions(res.data.transactions);
      setSummary(res.data.summary);
      setTotal(res.data.pagination.total);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value === 'all' ? '' : value }));
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">학원비 결제 관리</h1>
          <p className="text-muted-foreground">학원비 결제 내역, 수수료, 정산 현황을 관리합니다.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" /> 총 결제액
              </div>
              <p className="text-xl font-bold">₩{formatKRW(summary.total_amount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" /> 총 PG수수료
              </div>
              <p className="text-xl font-bold text-red-600">₩{formatKRW(summary.total_pg_fee)}</p>
              <p className="text-xs text-muted-foreground">2.4%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Percent className="h-4 w-4" /> 총 TN수수료
              </div>
              <p className="text-xl font-bold text-blue-600">₩{formatKRW(summary.total_tn_fee)}</p>
              <p className="text-xs text-muted-foreground">0.4% (창립 0.2%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Landmark className="h-4 w-4" /> 총 정산액
              </div>
              <p className="text-xl font-bold text-green-600">₩{formatKRW(summary.total_settlement)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            type="text"
            placeholder="학원 ID"
            value={filters.academy_id}
            onChange={(e) => handleFilterChange('academy_id', e.target.value)}
            className="w-28"
          />
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => handleFilterChange('status', v)}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기</SelectItem>
              <SelectItem value="success">성공</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
              <SelectItem value="cancelled">취소</SelectItem>
              <SelectItem value="refunded">환불</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="w-36"
          />
          <span className="text-muted-foreground">~</span>
          <Input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="w-36"
          />
          <Button variant="outline" size="sm" onClick={() => loadData()}>
            <RefreshCw className="h-4 w-4 mr-1" /> 새로고침
          </Button>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>학원명</TableHead>
                <TableHead>학생명</TableHead>
                <TableHead className="text-right">결제금액</TableHead>
                <TableHead className="text-right">PG수수료</TableHead>
                <TableHead className="text-right">TN수수료</TableHead>
                <TableHead className="text-right">정산금액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>결제일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    결제 내역이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.academy_name}</TableCell>
                    <TableCell>{tx.student_name}</TableCell>
                    <TableCell className="text-right">₩{formatKRW(tx.amount)}</TableCell>
                    <TableCell className="text-right text-red-600">₩{formatKRW(tx.pg_fee)}</TableCell>
                    <TableCell className="text-right text-blue-600">₩{formatKRW(tx.tn_fee)}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">₩{formatKRW(tx.settlement_amount)}</TableCell>
                    <TableCell>
                      <Badge className={statusConfig[tx.status]?.className || 'bg-gray-100 text-gray-600'}>
                        {statusConfig[tx.status]?.label || tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tx.paid_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total}건 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, total)}
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
      </div>
    </AdminLayout>
  );
}
