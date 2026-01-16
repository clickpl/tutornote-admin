'use client';

import { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { bannersApi, EventBanner, EventBannerInput } from '@/lib/api';
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

const STATUS_CONFIG = {
  active: { label: '활성', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  scheduled: { label: '예정', color: 'bg-yellow-100 text-yellow-700', dotColor: 'bg-yellow-500' },
  expired: { label: '종료', color: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-500' },
  inactive: { label: '비활성', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
};

const TYPE_CONFIG = {
  top_banner: { label: '상단 띠 배너', description: '대시보드 최상단에 표시되는 띠형 배너' },
  card_banner: { label: '카드 배너', description: '이미지와 텍스트가 포함된 카드형 배너' },
};

export default function BannersPage() {
  const [banners, setBanners] = useState<EventBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<EventBanner | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<EventBannerInput>({
    type: 'top_banner',
    title: '',
    content: '',
    background_color: '#3B82F6',
    text_color: '#FFFFFF',
    image_url: '',
    link_url: '',
    link_text: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true,
    is_dismissible: true,
    priority: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, [filterStatus]);

  const fetchBanners = async () => {
    setLoading(true);
    const status = filterStatus === 'all' ? undefined : filterStatus;
    const { data, error } = await bannersApi.list(undefined, undefined, status);

    if (data?.success) {
      setBanners(data.data);
    }
    setLoading(false);
  };

  const getStatusFromBanner = (banner: EventBanner): string => {
    if (!banner.is_active) return 'inactive';
    const now = new Date();
    const start = new Date(banner.start_date);
    const end = new Date(banner.end_date);
    if (now < start) return 'scheduled';
    if (now > end) return 'expired';
    return 'active';
  };

  const handleCreate = () => {
    setSelectedBanner(null);
    setFormData({
      type: 'top_banner',
      title: '',
      content: '',
      background_color: '#3B82F6',
      text_color: '#FFFFFF',
      image_url: '',
      link_url: '',
      link_text: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      is_active: true,
      is_dismissible: true,
      priority: 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleEdit = (banner: EventBanner) => {
    setSelectedBanner(banner);
    setFormData({
      type: banner.type,
      title: banner.title,
      content: banner.content || '',
      background_color: banner.background_color,
      text_color: banner.text_color,
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      link_text: banner.link_text || '',
      start_date: banner.start_date.split('T')[0],
      end_date: banner.end_date.split('T')[0],
      is_active: banner.is_active,
      is_dismissible: banner.is_dismissible,
      priority: banner.priority,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (banner: EventBanner) => {
    setSelectedBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  const handlePreview = (banner: EventBanner) => {
    setSelectedBanner(banner);
    setIsPreviewDialogOpen(true);
  };

  const handleDuplicate = async (banner: EventBanner) => {
    try {
      await bannersApi.duplicate(banner.id);
      fetchBanners();
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedBanner) {
        await bannersApi.update(selectedBanner.id, formData);
      } else {
        await bannersApi.create(formData);
      }
      setIsEditDialogOpen(false);
      fetchBanners();
    } catch (error) {
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBanner) return;

    try {
      await bannersApi.delete(selectedBanner.id);
      setIsDeleteDialogOpen(false);
      fetchBanners();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleToggleActive = async (banner: EventBanner) => {
    try {
      await bannersApi.update(banner.id, {
        type: banner.type,
        title: banner.title,
        content: banner.content || undefined,
        background_color: banner.background_color,
        text_color: banner.text_color,
        image_url: banner.image_url || undefined,
        link_url: banner.link_url || undefined,
        link_text: banner.link_text || undefined,
        start_date: banner.start_date,
        end_date: banner.end_date,
        is_active: !banner.is_active,
        is_dismissible: banner.is_dismissible,
        priority: banner.priority,
      });
      fetchBanners();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const formatDate = (d: string) => {
      const date = new Date(d);
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Flag className="text-purple-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">이벤트 배너</h1>
              <p className="text-sm text-muted-foreground">총 {banners.length}개</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            새 배너 작성
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            전체
          </Button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <Button
              key={key}
              variant={filterStatus === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(key)}
            >
              {config.label}
            </Button>
          ))}
        </div>

        {/* Banner List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : banners.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Flag size={48} className="mx-auto mb-4 opacity-50" />
                <p>배너가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            banners.map((banner) => {
              const status = banner.status || getStatusFromBanner(banner);
              const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const typeConfig = TYPE_CONFIG[banner.type];

              return (
                <Card key={banner.id} className="overflow-hidden">
                  <div className="flex">
                    {/* Banner Preview */}
                    <div
                      className="w-64 p-4 flex flex-col justify-center"
                      style={{
                        backgroundColor: banner.background_color,
                        color: banner.text_color,
                      }}
                    >
                      {banner.type === 'card_banner' && banner.image_url && (
                        <div className="mb-2 rounded overflow-hidden">
                          <img
                            src={banner.image_url}
                            alt=""
                            className="w-full h-20 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80" fill="%23ccc"%3E%3Crect width="100%25" height="100%25"/%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                      )}
                      <div className="font-semibold text-sm">{banner.title}</div>
                      {banner.content && (
                        <div className="text-xs opacity-90 mt-1 line-clamp-2 whitespace-pre-line">
                          {banner.content}
                        </div>
                      )}
                      {banner.link_text && (
                        <div className="text-xs mt-2 underline">{banner.link_text}</div>
                      )}
                    </div>

                    {/* Banner Info */}
                    <div className="flex-1 p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}></span>
                            {statusConfig.label}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {typeConfig.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{banner.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar size={14} />
                          <span>{formatDateRange(banner.start_date, banner.end_date)}</span>
                          {banner.link_url && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <ExternalLink size={14} />
                              <span className="truncate max-w-[200px]">{banner.link_url}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePreview(banner)}>
                          <Eye size={14} className="mr-1" />
                          미리보기
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(banner)}>
                              <Pencil size={14} className="mr-2" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(banner)}>
                              <Copy size={14} className="mr-2" />
                              복제
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(banner)}>
                              {banner.is_active ? '비활성화' : '활성화'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(banner)}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedBanner ? '배너 수정' : '새 배너 작성'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                배너 내용을 입력하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Type */}
              <div className="space-y-2">
                <Label>배너 타입</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'top_banner' | 'card_banner') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="배너 제목을 입력하세요"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>내용</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="배너 내용을 입력하세요"
                  rows={3}
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>배경색</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData({ ...formData, background_color: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.background_color}
                      onChange={(e) =>
                        setFormData({ ...formData, background_color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>텍스트색</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData({ ...formData, text_color: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.text_color}
                      onChange={(e) =>
                        setFormData({ ...formData, text_color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Image URL (for card_banner) */}
              {formData.type === 'card_banner' && (
                <div className="space-y-2">
                  <Label>이미지 URL</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              )}

              {/* Link */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>링크 URL</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="/announcements"
                  />
                </div>
                <div className="space-y-2">
                  <Label>링크 텍스트</Label>
                  <Input
                    value={formData.link_text}
                    onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                    placeholder="자세히 보기"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료일</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label>활성화</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_dismissible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_dismissible: checked })
                    }
                  />
                  <Label>닫기 버튼</Label>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>우선순위 (낮을수록 먼저 표시)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: Number(e.target.value) })
                  }
                  min={0}
                />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>미리보기</Label>
                <div
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: formData.background_color,
                    color: formData.text_color,
                  }}
                >
                  {formData.type === 'card_banner' && formData.image_url && (
                    <div className="mb-2 rounded overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt=""
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80" fill="%23ccc"%3E%3Crect width="100%25" height="100%25"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  )}
                  <div className="font-semibold">{formData.title || '배너 제목'}</div>
                  {formData.content && (
                    <div className="text-sm opacity-90 mt-1 whitespace-pre-line">{formData.content}</div>
                  )}
                  {formData.link_text && (
                    <div className="text-sm mt-2 underline">{formData.link_text}</div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !formData.title}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedBanner ? '수정' : '작성'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>배너 미리보기</DialogTitle>
              <DialogDescription className="sr-only">
                배너가 어떻게 표시되는지 미리 확인합니다
              </DialogDescription>
            </DialogHeader>
            {selectedBanner && (
              <div className="py-4">
                {selectedBanner.type === 'top_banner' ? (
                  <div
                    className="rounded-lg p-4 flex items-center justify-between"
                    style={{
                      backgroundColor: selectedBanner.background_color,
                      color: selectedBanner.text_color,
                    }}
                  >
                    <div>
                      <div className="font-semibold">{selectedBanner.title}</div>
                      {selectedBanner.content && (
                        <div className="text-sm opacity-90 whitespace-pre-line">{selectedBanner.content}</div>
                      )}
                    </div>
                    {selectedBanner.link_text && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 ml-4"
                      >
                        {selectedBanner.link_text}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: selectedBanner.background_color,
                      color: selectedBanner.text_color,
                    }}
                  >
                    {selectedBanner.image_url && (
                      <img
                        src={selectedBanner.image_url}
                        alt=""
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80" fill="%23ccc"%3E%3Crect width="100%25" height="100%25"/%3E%3C/svg%3E';
                        }}
                      />
                    )}
                    <div className="p-4">
                      <div className="font-semibold text-lg">{selectedBanner.title}</div>
                      {selectedBanner.content && (
                        <div className="text-sm opacity-90 mt-1 whitespace-pre-line">{selectedBanner.content}</div>
                      )}
                      {selectedBanner.link_text && (
                        <Button size="sm" variant="secondary" className="mt-3">
                          {selectedBanner.link_text}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>배너 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedBanner?.title}" 배너를 삭제하시겠습니까?
                <br />
                삭제된 배너는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
