'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Users,
  Phone,
  MapPin,
  Calendar,
  LogIn,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { academiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
import { Separator } from '@/components/ui/separator';

interface Student {
  id: number;
  name: string;
  name_masked: string;
  phone_masked: string;
  parent_phone_masked: string;
  attendance_code: string;
  created_at: string;
}

interface AcademyDetail {
  id: number;
  name: string;
  phone: string;
  address: string;
  owner_email: string;
  owner_name: string;
  owner_phone: string;
  attendance_code_type: string;
  created_at: string;
  students: Student[];
  student_count: number;
}

export default function AcademyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [academy, setAcademy] = useState<AcademyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAcademy(Number(params.id));
    }
  }, [params.id]);

  const fetchAcademy = async (id: number) => {
    setLoading(true);
    const { data, error } = await academiesApi.get(id);

    if (data) {
      setAcademy(data);
    } else if (error) {
      console.error('Failed to fetch academy:', error);
    }
    setLoading(false);
  };

  const handleImpersonate = async () => {
    if (!academy) return;

    setImpersonating(true);
    const { data, error } = await academiesApi.impersonate(academy.id);

    if (data) {
      const serviceUrl = process.env.NEXT_PUBLIC_SERVICE_URL || 'http://localhost:3000';
      const redirectPath = data.redirect_url || '/?impersonate=true';
      window.open(`${serviceUrl}${redirectPath}&token=${data.token}`, '_blank');
    } else if (error) {
      alert('대리 로그인에 실패했습니다: ' + error);
    }
    setImpersonating(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back Button */}
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/academies">
            <ArrowLeft className="h-4 w-4" />
            학원 목록으로
          </Link>
        </Button>

        {loading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : academy ? (
          <>
            {/* Header Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{academy.name}</CardTitle>
                      <CardDescription>{academy.owner_email}</CardDescription>
                    </div>
                  </div>
                  <Button onClick={handleImpersonate} disabled={impersonating} className="gap-2">
                    {impersonating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    {impersonating ? '접속 중...' : '대리 로그인'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-6" />
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">원장</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{academy.owner_name || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">연락처</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{academy.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">출석방식</p>
                    <Badge variant={academy.attendance_code_type === 'phone_last4' ? 'default' : 'secondary'}>
                      {academy.attendance_code_type === 'phone_last4' ? '뒤4자리' : '자동할당'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">가입일</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDate(academy.created_at)}</span>
                    </div>
                  </div>
                </div>

                {academy.address && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{academy.address}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Students Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>학생 목록</CardTitle>
                <Badge variant="outline">{academy.student_count}명</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>출석번호</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>보호자 연락처</TableHead>
                      <TableHead>등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {academy.students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          등록된 학생이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      academy.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name_masked}</TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-2 py-1 text-sm text-primary">
                              {student.attendance_code || '-'}
                            </code>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{student.phone_masked || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{student.parent_phone_masked || '-'}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(student.created_at)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              학원을 찾을 수 없습니다
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
