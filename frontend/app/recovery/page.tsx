'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Edit, History, Search, User, FileText, AlertTriangle, Clock, CalendarClock } from 'lucide-react';
import { recoveryApi, attendanceApi, DeletedItem, StudentDetail, ActionLog, AttendanceRecord } from '@/lib/api';
import AdminLayout from '@/components/layout/AdminLayout';

export default function RecoveryPage() {
  const [activeTab, setActiveTab] = useState('deleted');

  // Deleted items state
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedTotalPages, setDeletedTotalPages] = useState(1);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Restore dialog state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DeletedItem | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Student edit state
  const [studentSearchId, setStudentSearchId] = useState('');
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    grade: '',
    attendance_code: '',
  });
  const [parentPhone, setParentPhone] = useState('');
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchingStudent, setSearchingStudent] = useState(false);

  // Action logs state
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  // Attendance state
  const [attendanceSearchId, setAttendanceSearchId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState(1);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [searchingAttendance, setSearchingAttendance] = useState(false);
  const [attendanceEditDialogOpen, setAttendanceEditDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceEditForm, setAttendanceEditForm] = useState({
    check_in: '',
    check_out: '',
    status: 'present' as string,
    note: '',
  });
  const [attendanceEditReason, setAttendanceEditReason] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Load deleted items
  const loadDeletedItems = async () => {
    setLoading(true);
    const type = typeFilter === 'all' ? '' : typeFilter;
    const { data, error } = await recoveryApi.getDeletedItems(deletedPage, 20, type);
    if (data) {
      setDeletedItems(data.items);
      setDeletedTotalPages(data.total_pages);
      setDeletedTotal(data.total);
    }
    setLoading(false);
  };

  // Load action logs
  const loadActionLogs = async () => {
    setLoading(true);
    const actionType = actionTypeFilter === 'all' ? '' : actionTypeFilter;
    const targetType = targetTypeFilter === 'all' ? '' : targetTypeFilter;
    const { data } = await recoveryApi.getActionLogs(logsPage, 20, actionType, targetType);
    if (data) {
      setActionLogs(data.logs);
      setLogsTotalPages(data.total_pages);
      setLogsTotal(data.total);
    }
    setLoading(false);
  };

  // Handle attendance search
  const handleAttendanceSearch = async () => {
    if (!attendanceSearchId.trim()) {
      alert('학생 ID를 입력해주세요.');
      return;
    }

    const studentId = parseInt(attendanceSearchId.trim());
    if (isNaN(studentId) || studentId <= 0) {
      alert('올바른 학생 ID를 입력해주세요. (1 이상의 숫자)');
      return;
    }

    setSearchingAttendance(true);
    const { data, error } = await attendanceApi.getRecords(studentId, attendancePage);

    if (data) {
      setAttendanceRecords(data.records);
      setAttendanceTotalPages(data.total_pages);
      setAttendanceTotal(data.total);
    } else {
      alert(error || '출석 기록을 찾을 수 없습니다.');
      setAttendanceRecords([]);
    }
    setSearchingAttendance(false);
  };

  // Handle attendance edit click
  const handleAttendanceEditClick = (record: AttendanceRecord) => {
    setSelectedAttendance(record);
    setAttendanceEditForm({
      check_in: record.check_in ? record.check_in.slice(0, 16) : '',
      check_out: record.check_out ? record.check_out.slice(0, 16) : '',
      status: record.status || 'present',
      note: record.note || '',
    });
    setAttendanceEditReason('');
    setAttendanceEditDialogOpen(true);
  };

  // Handle attendance save
  const handleSaveAttendance = async () => {
    if (!selectedAttendance || !attendanceEditReason) {
      alert('수정 사유를 입력해주세요.');
      return;
    }

    setSavingAttendance(true);
    const { data, error } = await attendanceApi.update(selectedAttendance.id, {
      check_in: attendanceEditForm.check_in || null,
      check_out: attendanceEditForm.check_out || null,
      status: attendanceEditForm.status,
      note: attendanceEditForm.note,
      reason: attendanceEditReason,
    });

    if (data?.success) {
      alert('출석 기록이 수정되었습니다.');
      setAttendanceEditDialogOpen(false);
      handleAttendanceSearch(); // Refresh
    } else {
      alert(error || '수정 실패');
    }
    setSavingAttendance(false);
  };

  useEffect(() => {
    if (activeTab === 'deleted') {
      loadDeletedItems();
    } else if (activeTab === 'logs') {
      loadActionLogs();
    }
  }, [activeTab, deletedPage, typeFilter, logsPage, actionTypeFilter, targetTypeFilter]);

  // Handle restore
  const handleRestoreClick = (item: DeletedItem) => {
    setSelectedItem(item);
    setRestoreReason('');
    setRestoreDialogOpen(true);
  };

  const handleRestore = async () => {
    if (!selectedItem) return;

    setRestoring(true);
    const { data, error } = await recoveryApi.restore(
      selectedItem.item_type,
      selectedItem.id,
      restoreReason
    );

    if (data?.success) {
      setRestoreDialogOpen(false);
      loadDeletedItems();
      alert('데이터가 복구되었습니다.');
    } else {
      alert(error || '복구 실패');
    }
    setRestoring(false);
  };

  // Handle student search
  const handleStudentSearch = async () => {
    if (!studentSearchId.trim()) {
      alert('학생 ID를 입력해주세요.');
      return;
    }

    const studentId = parseInt(studentSearchId.trim());
    if (isNaN(studentId) || studentId <= 0) {
      alert('올바른 학생 ID를 입력해주세요. (1 이상의 숫자)');
      return;
    }

    setSearchingStudent(true);
    const { data, error } = await recoveryApi.getStudentDetail(studentId);

    if (data) {
      setStudentDetail(data);
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        grade: data.grade || '',
        attendance_code: data.attendance_code || '',
      });
      setParentPhone(data.parent_phone || '');
      setEditReason('');
    } else {
      alert(error || '학생을 찾을 수 없습니다.');
      setStudentDetail(null);
    }
    setSearchingStudent(false);
  };

  // Handle student edit
  const handleSaveStudent = async () => {
    if (!studentDetail || !editReason) {
      alert('수정 사유를 입력해주세요.');
      return;
    }

    setSaving(true);
    const { data, error } = await recoveryApi.superEditStudent(
      studentDetail.id,
      editForm,
      editReason
    );

    if (data?.success) {
      alert('학생 정보가 수정되었습니다.');
      setStudentDetail(null);
      setStudentSearchId('');
    } else {
      alert(error || '수정 실패');
    }
    setSaving(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR');
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'student':
        return <Badge variant="default"><User className="w-3 h-3 mr-1" />학생</Badge>;
      case 'report':
        return <Badge variant="secondary"><FileText className="w-3 h-3 mr-1" />진도기록</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'restore':
        return <Badge className="bg-green-100 text-green-800">복구</Badge>;
      case 'super_edit':
        return <Badge className="bg-blue-100 text-blue-800">수정</Badge>;
      case 'attendance_edit':
        return <Badge className="bg-purple-100 text-purple-800">출석수정</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">출석</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">지각</Badge>;
      case 'absent':
        return <Badge variant="destructive">결석</Badge>;
      case 'makeup':
        return <Badge className="bg-blue-100 text-blue-800">보강</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRecoveryPeriodBadge = (item: DeletedItem) => {
    if (item.can_restore === false) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          만료됨
        </Badge>
      );
    }
    if (item.days_remaining !== undefined) {
      if (item.days_remaining <= 7) {
        return (
          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.days_remaining}일 남음
          </Badge>
        );
      }
      if (item.days_remaining <= 30) {
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {item.days_remaining}일 남음
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {item.days_remaining}일 남음
        </Badge>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">복구/수정 센터</h1>
            <p className="text-muted-foreground">삭제된 데이터 복구 및 학생 정보 수정</p>
          </div>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deleted" className="flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            휴지통 ({deletedTotal})
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            학생 정보 수정
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            출석 보정
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            작업 로그 ({logsTotal})
          </TabsTrigger>
        </TabsList>

        {/* 휴지통 탭 */}
        <TabsContent value="deleted">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span>삭제된 데이터</span>
                  <p className="text-sm font-normal text-muted-foreground mt-1">
                    삭제된 데이터는 90일 이내에만 복구할 수 있습니다.
                  </p>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="전체 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="student">학생</SelectItem>
                    <SelectItem value="progress_record">진도기록</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
              ) : deletedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  삭제된 데이터가 없습니다.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>유형</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>이름/내용</TableHead>
                        <TableHead>학원</TableHead>
                        <TableHead>삭제일시</TableHead>
                        <TableHead>복구 기한</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deletedItems.map((item) => (
                        <TableRow key={`${item.item_type}-${item.id}`} className={item.can_restore === false ? 'opacity-60' : ''}>
                          <TableCell>{getTypeBadge(item.item_type)}</TableCell>
                          <TableCell className="font-mono">{item.id}</TableCell>
                          <TableCell>
                            {item.item_type === 'student'
                              ? item.name
                              : `${item.student_name} - ${item.record_date}`}
                          </TableCell>
                          <TableCell>{item.academy_name}</TableCell>
                          <TableCell>{formatDate(item.deleted_at)}</TableCell>
                          <TableCell>{getRecoveryPeriodBadge(item)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestoreClick(item)}
                              disabled={item.can_restore === false}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              복구
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      총 {deletedTotal}개
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletedPage <= 1}
                        onClick={() => setDeletedPage(p => p - 1)}
                      >
                        이전
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        {deletedPage} / {deletedTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletedPage >= deletedTotalPages}
                        onClick={() => setDeletedPage(p => p + 1)}
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

        {/* 학생 정보 수정 탭 */}
        <TabsContent value="edit">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 학생 검색 */}
            <Card>
              <CardHeader>
                <CardTitle>학생 검색</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="학생 ID 입력"
                    value={studentSearchId}
                    onChange={(e) => setStudentSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
                  />
                  <Button onClick={handleStudentSearch} disabled={searchingStudent}>
                    <Search className="w-4 h-4 mr-1" />
                    검색
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  학원 상세 페이지에서 학생 ID를 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>

            {/* 학생 정보 수정 폼 */}
            {studentDetail && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>학생 정보 수정 (ID: {studentDetail.id})</span>
                    {studentDetail.is_deleted && (
                      <Badge variant="destructive">삭제됨</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm"><strong>소속 학원:</strong> {studentDetail.academy_name}</p>
                    <p className="text-sm"><strong>등록일:</strong> {formatDate(studentDetail.created_at)}</p>
                    {studentDetail.deleted_at && (
                      <p className="text-sm text-destructive">
                        <strong>삭제일:</strong> {formatDate(studentDetail.deleted_at)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>학생 이름</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>학생 연락처</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>보호자 연락처 (읽기 전용)</Label>
                      <Input
                        value={parentPhone}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label>학년</Label>
                      <Input
                        value={editForm.grade}
                        onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>출석 번호</Label>
                      <Input
                        value={editForm.attendance_code}
                        onChange={(e) => setEditForm({ ...editForm, attendance_code: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>수정 사유 (필수)</Label>
                      <Textarea
                        placeholder="CS 요청 번호 또는 수정 사유를 입력하세요"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSaveStudent}
                    disabled={saving || !editReason}
                  >
                    {saving ? '저장 중...' : '변경사항 저장'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 출석 보정 탭 */}
        <TabsContent value="attendance">
          <div className="grid gap-6 md:grid-cols-2">
            {/* 학생 검색 */}
            <Card>
              <CardHeader>
                <CardTitle>출석 기록 검색</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="학생 ID 입력"
                    value={attendanceSearchId}
                    onChange={(e) => setAttendanceSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAttendanceSearch()}
                  />
                  <Button onClick={handleAttendanceSearch} disabled={searchingAttendance}>
                    <Search className="w-4 h-4 mr-1" />
                    검색
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  학원 상세 페이지에서 학생 ID를 확인할 수 있습니다.
                </p>
              </CardContent>
            </Card>

            {/* 출석 기록 목록 */}
            {attendanceRecords.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>출석 기록 ({attendanceTotal}건)</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {attendanceRecords[0]?.student_name} - {attendanceRecords[0]?.academy_name}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>날짜</TableHead>
                        <TableHead>등원 시간</TableHead>
                        <TableHead>하원 시간</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>비고</TableHead>
                        <TableHead>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono">{record.id}</TableCell>
                          <TableCell>{record.date}</TableCell>
                          <TableCell>
                            {record.check_in ? new Date(record.check_in).toLocaleTimeString('ko-KR') : '-'}
                          </TableCell>
                          <TableCell>
                            {record.check_out ? new Date(record.check_out).toLocaleTimeString('ko-KR') : '-'}
                          </TableCell>
                          <TableCell>{getAttendanceStatusBadge(record.status)}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.note || '-'}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAttendanceEditClick(record)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              수정
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {attendanceTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        총 {attendanceTotal}건
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={attendancePage <= 1}
                          onClick={() => {
                            setAttendancePage(p => p - 1);
                            handleAttendanceSearch();
                          }}
                        >
                          이전
                        </Button>
                        <span className="px-3 py-1 text-sm">
                          {attendancePage} / {attendanceTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={attendancePage >= attendanceTotalPages}
                          onClick={() => {
                            setAttendancePage(p => p + 1);
                            handleAttendanceSearch();
                          }}
                        >
                          다음
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 작업 로그 탭 */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>관리자 작업 로그</span>
                <div className="flex gap-2">
                  <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="작업 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="restore">복구</SelectItem>
                      <SelectItem value="super_edit">수정</SelectItem>
                      <SelectItem value="attendance_edit">출석수정</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="대상 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="progress_record">진도기록</SelectItem>
                      <SelectItem value="attendance">출석</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
              ) : actionLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  작업 로그가 없습니다.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>일시</TableHead>
                        <TableHead>작업자</TableHead>
                        <TableHead>작업</TableHead>
                        <TableHead>대상</TableHead>
                        <TableHead>학원</TableHead>
                        <TableHead>사유</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </TableCell>
                          <TableCell>{log.operator_email}</TableCell>
                          <TableCell>{getActionBadge(log.action_type)}</TableCell>
                          <TableCell>
                            {getTypeBadge(log.target_type)}
                            <span className="ml-1 font-mono">#{log.target_id}</span>
                          </TableCell>
                          <TableCell>{log.academy_name || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      총 {logsTotal}개
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage <= 1}
                        onClick={() => setLogsPage(p => p - 1)}
                      >
                        이전
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        {logsPage} / {logsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logsPage >= logsTotalPages}
                        onClick={() => setLogsPage(p => p + 1)}
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

      {/* 복구 확인 다이얼로그 */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터 복구</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <>
                  {selectedItem.item_type === 'student'
                    ? `학생 "${selectedItem.name}"을(를) 복구하시겠습니까?`
                    : `진도기록 (${selectedItem.student_name} - ${selectedItem.record_date})을(를) 복구하시겠습니까?`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedItem && selectedItem.days_remaining !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  복구 가능 기한: <strong>{selectedItem.days_remaining}일</strong> 남음
                  {selectedItem.expiry_date && (
                    <span className="text-muted-foreground ml-1">
                      (만료일: {formatDate(selectedItem.expiry_date).split(' ')[0]})
                    </span>
                  )}
                </span>
              </div>
            )}
            <div>
              <Label>복구 사유 (선택)</Label>
              <Textarea
                placeholder="CS 요청 번호 또는 복구 사유를 입력하세요"
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? '복구 중...' : '복구하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 출석 수정 다이얼로그 */}
      <Dialog open={attendanceEditDialogOpen} onOpenChange={setAttendanceEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>출석 기록 수정</DialogTitle>
            <DialogDescription>
              {selectedAttendance && (
                <>
                  {selectedAttendance.student_name} - {selectedAttendance.date}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>등원 시간</Label>
              <Input
                type="datetime-local"
                value={attendanceEditForm.check_in}
                onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, check_in: e.target.value })}
              />
            </div>
            <div>
              <Label>하원 시간</Label>
              <Input
                type="datetime-local"
                value={attendanceEditForm.check_out}
                onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, check_out: e.target.value })}
              />
            </div>
            <div>
              <Label>출석 상태</Label>
              <Select
                value={attendanceEditForm.status}
                onValueChange={(value) => setAttendanceEditForm({ ...attendanceEditForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">출석</SelectItem>
                  <SelectItem value="late">지각</SelectItem>
                  <SelectItem value="absent">결석</SelectItem>
                  <SelectItem value="makeup">보강</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>비고</Label>
              <Input
                value={attendanceEditForm.note}
                onChange={(e) => setAttendanceEditForm({ ...attendanceEditForm, note: e.target.value })}
                placeholder="예: 키오스크 오류로 인한 시간 보정"
              />
            </div>
            <div>
              <Label>수정 사유 (필수)</Label>
              <Textarea
                placeholder="CS 요청 번호 또는 수정 사유를 입력하세요"
                value={attendanceEditReason}
                onChange={(e) => setAttendanceEditReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAttendanceEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveAttendance} disabled={savingAttendance || !attendanceEditReason}>
              {savingAttendance ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminLayout>
  );
}
