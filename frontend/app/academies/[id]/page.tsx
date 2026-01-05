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
  Pencil,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Ban,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { academiesApi } from '@/lib/api';
import { formatKSTDate } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  status: string;
  kiosk_code: string;
  created_at: string;
  students: Student[];
  student_count: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  active: { label: '활성', variant: 'default', icon: CheckCircle },
  suspended: { label: '정지', variant: 'destructive', icon: Ban },
  pending: { label: '대기', variant: 'secondary', icon: AlertTriangle },
  deleted: { label: '삭제됨', variant: 'outline', icon: X },
};

export default function AcademyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [academy, setAcademy] = useState<AcademyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    address: '',
    attendance_code_method: '',
    kiosk_code: '',
  });
  const [saving, setSaving] = useState(false);

  // 상태 변경 다이얼로그
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

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
      setEditData({
        name: data.name || '',
        phone: data.phone || '',
        address: data.address || '',
        attendance_code_method: data.attendance_code_type || 'auto',
        kiosk_code: data.kiosk_code || '',
      });
    } else if (error) {
      console.error('Failed to fetch academy:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!academy) return;
    setSaving(true);

    const { data, error } = await academiesApi.update(academy.id, editData);

    if (data?.success) {
      await fetchAcademy(academy.id);
      setIsEditing(false);
    } else {
      alert('저장에 실패했습니다: ' + (error || '알 수 없는 오류'));
    }
    setSaving(false);
  };

  const handleStatusChange = async () => {
    if (!academy || !newStatus) return;
    setChangingStatus(true);

    const { data, error } = await academiesApi.updateStatus(academy.id, newStatus, statusReason);

    if (data?.success) {
      await fetchAcademy(academy.id);
      setStatusDialogOpen(false);
      setStatusReason('');
    } else {
      alert('상태 변경에 실패했습니다: ' + (error || '알 수 없는 오류'));
    }
    setChangingStatus(false);
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
    return formatKSTDate(dateString);
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
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-2xl">{academy.name}</CardTitle>
                        <Badge variant={statusConfig[academy.status || 'active']?.variant || 'default'}>
                          {statusConfig[academy.status || 'active']?.label || academy.status}
                        </Badge>
                      </div>
                      <CardDescription>{academy.owner_email}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                          <X className="h-4 w-4 mr-1" />
                          취소
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                          저장
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                          <Pencil className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              상태 변경
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>학원 상태 변경</DialogTitle>
                              <DialogDescription>
                                학원의 서비스 접속 상태를 변경합니다.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>현재 상태</Label>
                                <Badge variant={statusConfig[academy.status || 'active']?.variant || 'default'}>
                                  {statusConfig[academy.status || 'active']?.label || academy.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <Label>변경할 상태</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="상태 선택..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">활성</SelectItem>
                                    <SelectItem value="suspended">정지</SelectItem>
                                    <SelectItem value="pending">대기</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>변경 사유</Label>
                                <Textarea
                                  value={statusReason}
                                  onChange={(e) => setStatusReason(e.target.value)}
                                  placeholder="상태 변경 사유를 입력하세요..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                                취소
                              </Button>
                              <Button onClick={handleStatusChange} disabled={!newStatus || changingStatus}>
                                {changingStatus && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                변경
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button onClick={handleImpersonate} disabled={impersonating} className="gap-2">
                          {impersonating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogIn className="h-4 w-4" />
                          )}
                          대리 로그인
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-6" />

                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>학원명</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>연락처</Label>
                      <Input
                        value={editData.phone}
                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>출석방식</Label>
                      <Select
                        value={editData.attendance_code_method}
                        onValueChange={(value) => setEditData({ ...editData, attendance_code_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone_last4">휴대폰 뒤 4자리</SelectItem>
                          <SelectItem value="auto">자동 할당</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>키오스크 코드</Label>
                      <Input
                        value={editData.kiosk_code}
                        onChange={(e) => setEditData({ ...editData, kiosk_code: e.target.value })}
                        placeholder="예: PIANO001"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>주소</Label>
                      <Input
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <>
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

                    {(academy.address || academy.kiosk_code) && (
                      <>
                        <Separator className="my-4" />
                        <div className="flex flex-wrap gap-6">
                          {academy.address && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">{academy.address}</span>
                            </div>
                          )}
                          {academy.kiosk_code && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-sm">키오스크 코드:</span>
                              <code className="rounded bg-muted px-2 py-1 text-sm">{academy.kiosk_code}</code>
                            </div>
                          )}
                        </div>
                      </>
                    )}
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
                      <TableHead className="w-16">ID</TableHead>
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
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          등록된 학생이 없습니다
                        </TableCell>
                      </TableRow>
                    ) : (
                      academy.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-mono text-muted-foreground">{student.id}</TableCell>
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
