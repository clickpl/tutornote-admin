'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Sparkles,
  Info,
  Lightbulb,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { announcementsApi, Announcement, AnnouncementInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const CATEGORY_CONFIG = {
  update: { label: '업데이트', color: 'bg-blue-100 text-blue-700', icon: Sparkles },
  notice: { label: '안내', color: 'bg-amber-100 text-amber-700', icon: Info },
  tip: { label: '팁', color: 'bg-green-100 text-green-700', icon: Lightbulb },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<AnnouncementInput>({
    category: 'notice',
    title: '',
    content: '',
    is_new: true,
    is_published: true,
    sort_order: 0,
    published_at: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [filterCategory]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const category = filterCategory === 'all' ? undefined : filterCategory;
    const { data, error } = await announcementsApi.list(category);

    if (data?.success) {
      setAnnouncements(data.data);
    }
    setLoading(false);
  };

  const filteredAnnouncements = announcements.filter((a) =>
    search ? a.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const handleCreate = () => {
    setSelectedAnnouncement(null);
    setFormData({
      category: 'notice',
      title: '',
      content: '',
      is_new: true,
      is_published: true,
      sort_order: 0,
      published_at: new Date().toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      category: announcement.category,
      title: announcement.title,
      content: announcement.content,
      is_new: announcement.is_new,
      is_published: announcement.is_published,
      sort_order: announcement.sort_order,
      published_at: announcement.published_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedAnnouncement) {
        // Update
        await announcementsApi.update(selectedAnnouncement.id, formData);
      } else {
        // Create
        await announcementsApi.create(formData);
      }
      setIsEditDialogOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement) return;

    try {
      await announcementsApi.delete(selectedAnnouncement.id);
      setIsDeleteDialogOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleTogglePublished = async (announcement: Announcement) => {
    try {
      await announcementsApi.update(announcement.id, {
        ...announcement,
        is_published: !announcement.is_published,
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleToggleNew = async (announcement: Announcement) => {
    try {
      await announcementsApi.update(announcement.id, {
        ...announcement,
        is_new: !announcement.is_new,
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dateString.split('T')[0];
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Megaphone className="text-blue-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">공지사항 관리</h1>
              <p className="text-sm text-muted-foreground">총 {announcements.length}개</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            새 공지 작성
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('all')}
            >
              전체
            </Button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant={filterCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterCategory(key)}
              >
                {config.label}
              </Button>
            ))}
          </div>

          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목 검색..."
              className="pl-10"
            />
          </div>
        </div>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Megaphone size={48} className="mx-auto mb-4 opacity-50" />
                <p>공지사항이 없습니다.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredAnnouncements.map((announcement) => {
                  const config = CATEGORY_CONFIG[announcement.category];
                  const CategoryIcon = config.icon;

                  return (
                    <div
                      key={announcement.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                    >
                      {/* Drag handle */}
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />

                      {/* Category Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <CategoryIcon size={12} />
                        {config.label}
                      </span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{announcement.title}</span>
                          {announcement.is_new && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {announcement.content.substring(0, 80)}...
                        </p>
                      </div>

                      {/* Status */}
                      <Badge variant={announcement.is_published ? 'default' : 'secondary'}>
                        {announcement.is_published ? '발행중' : '비발행'}
                      </Badge>

                      {/* Date */}
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        {formatDate(announcement.published_at)}
                      </span>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(announcement)}>
                            <Pencil size={14} className="mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleNew(announcement)}>
                            {announcement.is_new ? (
                              <>
                                <EyeOff size={14} className="mr-2" />
                                NEW 해제
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="mr-2" />
                                NEW 표시
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePublished(announcement)}>
                            {announcement.is_published ? (
                              <>
                                <EyeOff size={14} className="mr-2" />
                                비발행
                              </>
                            ) : (
                              <>
                                <Eye size={14} className="mr-2" />
                                발행
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(announcement)}
                            className="text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedAnnouncement ? '공지사항 수정' : '새 공지사항 작성'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                공지사항 내용을 입력하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>카테고리</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: 'update' | 'notice' | 'tip') =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update">업데이트</SelectItem>
                      <SelectItem value="notice">안내</SelectItem>
                      <SelectItem value="tip">팁</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>발행일</Label>
                  <Input
                    type="date"
                    value={formData.published_at}
                    onChange={(e) =>
                      setFormData({ ...formData, published_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>내용</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="공지사항 내용을 입력하세요"
                  rows={6}
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_new}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_new: checked })
                    }
                  />
                  <Label>NEW 배지 표시</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                  <Label>발행</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.title}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedAnnouncement ? '수정' : '작성'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedAnnouncement?.title}" 공지사항을 삭제하시겠습니까?
                <br />
                삭제된 공지사항은 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
