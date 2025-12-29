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
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { academiesApi } from '@/lib/api';
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

interface Academy {
  id: number;
  name: string;
  phone: string;
  owner_email: string;
  owner_name: string;
  student_count: number;
  attendance_code_type: string;
  created_at: string;
}

export default function AcademiesPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchAcademies();
  }, [page]);

  const fetchAcademies = async (searchQuery = search) => {
    setLoading(true);
    const { data, error } = await academiesApi.list(page, 20, searchQuery);

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
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
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
                      <TableHead>학생수</TableHead>
                      <TableHead>출석방식</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="w-[80px]">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
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
                            <p className="font-medium">{academy.owner_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{academy.owner_email}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{academy.student_count}명</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={academy.attendance_code_type === 'phone_last4' ? 'default' : 'secondary'}>
                              {academy.attendance_code_type === 'phone_last4' ? '뒤4자리' : '자동할당'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(academy.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/academies/${academy.id}`} title="상세보기">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
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
    </AdminLayout>
  );
}
