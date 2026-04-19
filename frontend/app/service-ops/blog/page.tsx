'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Eye,
  Globe,
  Bot,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { blogApi, BlogPost, BlogPostInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return dateString.split('T')[0];
}

const STATUS_CONFIG = {
  draft: { label: '초안', className: 'bg-yellow-100 text-yellow-700' },
  published: { label: '발행됨', className: 'bg-green-100 text-green-700' },
  archived: { label: '보관', className: 'bg-gray-100 text-gray-600' },
};

const SOURCE_CONFIG = {
  manual: { label: '직접', className: 'bg-gray-100 text-gray-600', icon: FileText },
  n8n: { label: 'n8n', className: 'bg-blue-100 text-blue-700', icon: Bot },
  migration: { label: '마이그레이션', className: 'bg-amber-100 text-amber-700', icon: Globe },
};

const DEFAULT_FORM: BlogPostInput = {
  title: '',
  slug: '',
  description: '',
  content: '',
  author: '튜터노트 팀',
  tags: [],
  keyword: '',
  status: 'draft',
  og_image_url: '',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<BlogPostInput>(DEFAULT_FORM);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [filterStatus]);

  const fetchPosts = async () => {
    setLoading(true);
    const status = filterStatus === 'all' ? undefined : filterStatus;
    const { data } = await blogApi.list(status);
    if (data?.success) {
      setPosts(data.data);
    }
    setLoading(false);
  };

  const filteredPosts = posts.filter((p) =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const handleCreate = () => {
    setSelectedPost(null);
    setFormData(DEFAULT_FORM);
    setTagsInput('');
    setIsEditDialogOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      description: post.description,
      content: post.content,
      author: post.author,
      tags: post.tags,
      keyword: post.keyword,
      status: post.status,
      og_image_url: post.og_image_url || '',
    });
    setTagsInput(post.tags.join(', '));
    setIsEditDialogOpen(true);
  };

  const handleDelete = (post: BlogPost) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    const update: Partial<BlogPostInput> = { title };
    if (!selectedPost) {
      update.slug = slugify(title);
    }
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedPost) {
        await blogApi.update(selectedPost.id, formData);
      } else {
        await blogApi.create(formData);
      }
      setIsEditDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPost) return;
    try {
      await blogApi.delete(selectedPost.id);
      setIsDeleteDialogOpen(false);
      fetchPosts();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      await blogApi.updateStatus(post.id, nextStatus);
      fetchPosts();
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="text-indigo-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">블로그 관리</h1>
              <p className="text-sm text-muted-foreground">총 {posts.length}개</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            새 글 작성
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="published">발행됨</SelectItem>
              <SelectItem value="archived">보관</SelectItem>
            </SelectContent>
          </Select>

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

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>블로그 포스트가 없습니다.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">상태</TableHead>
                    <TableHead>제목</TableHead>
                    <TableHead className="w-28">작성자</TableHead>
                    <TableHead className="w-48">태그</TableHead>
                    <TableHead className="w-24">출처</TableHead>
                    <TableHead className="w-28">발행일</TableHead>
                    <TableHead className="w-20 text-right">조회수</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => {
                    const statusConfig = STATUS_CONFIG[post.status];
                    const sourceConfig = SOURCE_CONFIG[post.source] ?? SOURCE_CONFIG.manual;
                    const SourceIcon = sourceConfig.icon;

                    return (
                      <TableRow key={post.id}>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{post.title}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {post.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{post.author}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                +{post.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${sourceConfig.className}`}
                          >
                            <SourceIcon size={11} />
                            {sourceConfig.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(post.published_at)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                            <Eye size={13} />
                            {post.view_count.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(post)}>
                                <Pencil size={14} className="mr-2" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(post)}>
                                {post.status === 'published' ? (
                                  <>
                                    <FileText size={14} className="mr-2" />
                                    초안으로
                                  </>
                                ) : (
                                  <>
                                    <Globe size={14} className="mr-2" />
                                    발행하기
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(post)}
                                className="text-destructive"
                              >
                                <Trash2 size={14} className="mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedPost ? '블로그 포스트 수정' : '새 블로그 포스트 작성'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                블로그 포스트 내용을 입력하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>제목</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="블로그 포스트 제목을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>슬러그 (URL)</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-slug-here"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="블로그 포스트 요약 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>내용 (Markdown)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="# 제목&#10;&#10;내용을 마크다운으로 작성하세요..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>작성자</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="튜터노트 팀"
                  />
                </div>

                <div className="space-y-2">
                  <Label>상태</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'draft' | 'published') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">초안</SelectItem>
                      <SelectItem value="published">발행됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>태그 (쉼표로 구분)</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="교육, 학원관리, AI"
                />
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>키워드 (SEO)</Label>
                <Input
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="주요 검색 키워드"
                />
              </div>

              <div className="space-y-2">
                <Label>OG 이미지 URL (선택)</Label>
                <Input
                  value={formData.og_image_url}
                  onChange={(e) => setFormData({ ...formData, og_image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.title || !formData.description}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPost ? '수정' : '작성'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>블로그 포스트 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedPost?.title}" 포스트를 삭제하시겠습니까?
                <br />
                삭제된 포스트는 복구할 수 없습니다.
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
