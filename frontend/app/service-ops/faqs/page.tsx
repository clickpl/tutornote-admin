'use client';

import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Loader2,
  Settings,
  FolderOpen,
  LogIn,
  CalendarCheck,
  Bell,
  Database,
  FileText,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { faqApi, FAQCategory, FAQ, FAQInput } from '@/lib/api';
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

// Icon mapping
const ICON_MAP: Record<string, any> = {
  'log-in': LogIn,
  'calendar-check': CalendarCheck,
  'shield': Shield,
  'shield-check': ShieldCheck,
  'bell': Bell,
  'database': Database,
  'file-text': FileText,
  'help-circle': HelpCircle,
};

const ICON_OPTIONS = [
  { value: 'log-in', label: '로그인' },
  { value: 'calendar-check', label: '출석/일정' },
  { value: 'shield-check', label: '개인정보' },
  { value: 'bell', label: '알림' },
  { value: 'database', label: '데이터' },
  { value: 'file-text', label: '문서/리포트' },
  { value: 'help-circle', label: '도움말' },
];

const getIconComponent = (iconName: string) => {
  return ICON_MAP[iconName] || HelpCircle;
};

export default function FAQsPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Dialog states
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [faqFormData, setFaqFormData] = useState<FAQInput>({
    category_id: 0,
    question: '',
    answer: '',
    is_published: true,
    sort_order: 0,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    icon: 'help-circle',
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, faqsRes] = await Promise.all([
        faqApi.getCategories(),
        faqApi.list(),
      ]);

      if (categoriesRes.data?.success) {
        setCategories(categoriesRes.data.data);
        // Expand all categories by default
        setExpandedCategories(new Set(categoriesRes.data.data.map((c: FAQCategory) => c.id)));
      }
      if (faqsRes.data?.success) {
        setFaqs(faqsRes.data.data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getFaqsByCategory = (categoryId: number) => {
    return faqs
      .filter((faq) => faq.category_id === categoryId)
      .filter((faq) =>
        search ? faq.question.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => a.sort_order - b.sort_order);
  };

  // FAQ handlers
  const handleCreateFaq = (categoryId: number) => {
    setSelectedFaq(null);
    setFaqFormData({
      category_id: categoryId,
      question: '',
      answer: '',
      is_published: true,
      sort_order: 0,
    });
    setIsFaqDialogOpen(true);
  };

  const handleEditFaq = (faq: FAQ) => {
    setSelectedFaq(faq);
    setFaqFormData({
      category_id: faq.category_id,
      question: faq.question,
      answer: faq.answer,
      is_published: faq.is_published,
      sort_order: faq.sort_order,
    });
    setIsFaqDialogOpen(true);
  };

  const handleDeleteFaq = (faq: FAQ) => {
    setSelectedFaq(faq);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveFaq = async () => {
    setIsSaving(true);
    try {
      if (selectedFaq) {
        await faqApi.update(selectedFaq.id, faqFormData);
      } else {
        await faqApi.create(faqFormData);
      }
      setIsFaqDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDeleteFaq = async () => {
    if (!selectedFaq) return;

    try {
      await faqApi.delete(selectedFaq.id);
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleTogglePublished = async (faq: FAQ) => {
    try {
      await faqApi.update(faq.id, {
        ...faq,
        is_published: !faq.is_published,
      });
      fetchData();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setCategoryFormData({
      name: '',
      icon: 'help-circle',
      sort_order: categories.length + 1,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: FAQCategory) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name,
      icon: category.icon,
      sort_order: category.sort_order,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (category: FAQCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    setIsSaving(true);
    try {
      if (selectedCategory) {
        await faqApi.updateCategory(selectedCategory.id, categoryFormData);
      } else {
        await faqApi.createCategory(categoryFormData);
      }
      setIsCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!selectedCategory) return;

    try {
      await faqApi.deleteCategory(selectedCategory.id);
      setIsDeleteCategoryDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const totalFaqCount = faqs.length;
  const publishedFaqCount = faqs.filter((f) => f.is_published).length;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <HelpCircle className="text-green-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">FAQ 관리</h1>
              <p className="text-sm text-muted-foreground">
                총 {totalFaqCount}개 (발행 {publishedFaqCount}개)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCreateCategory}>
              <Settings size={16} className="mr-2" />
              카테고리 관리
            </Button>
            <Button onClick={() => categories.length > 0 && handleCreateFaq(categories[0].id)}>
              <Plus size={16} className="mr-2" />
              새 FAQ 작성
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="질문 검색..."
            className="pl-10"
          />
        </div>

        {/* FAQ List by Category */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : categories.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>카테고리가 없습니다.</p>
                <Button className="mt-4" onClick={handleCreateCategory}>
                  카테고리 추가
                </Button>
              </CardContent>
            </Card>
          ) : (
            categories.map((category) => {
              const CategoryIcon = getIconComponent(category.icon);
              const categoryFaqs = getFaqsByCategory(category.id);
              const isExpanded = expandedCategories.has(category.id);

              return (
                <Card key={category.id}>
                  {/* Category Header */}
                  <div
                    className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CategoryIcon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{category.name}</span>
                        <Badge variant="secondary">{categoryFaqs.length}개</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleCreateFaq(category.id)}>
                          <Plus size={14} className="mr-2" />
                          FAQ 추가
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                          <Pencil size={14} className="mr-2" />
                          카테고리 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteCategory(category)}
                          className="text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          카테고리 삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronRight size={20} className="text-muted-foreground" />
                    )}
                  </div>

                  {/* FAQ List */}
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-6">
                      {categoryFaqs.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground border-t">
                          <p className="text-sm">이 카테고리에 FAQ가 없습니다.</p>
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleCreateFaq(category.id)}
                          >
                            FAQ 추가하기
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y border-t">
                          {categoryFaqs.map((faq) => (
                            <div
                              key={faq.id}
                              className="flex items-start gap-4 py-4 hover:bg-muted/30 px-2 rounded transition-colors"
                            >
                              <span className="text-primary font-bold mt-0.5">Q.</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{faq.question}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {faq.answer}
                                </p>
                              </div>

                              {/* View count */}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Eye size={12} />
                                <span>{faq.view_count}</span>
                              </div>

                              {/* Status */}
                              <Badge variant={faq.is_published ? 'default' : 'secondary'}>
                                {faq.is_published ? '발행' : '비발행'}
                              </Badge>

                              {/* Actions */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical size={16} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditFaq(faq)}>
                                    <Pencil size={14} className="mr-2" />
                                    수정
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleTogglePublished(faq)}>
                                    {faq.is_published ? (
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
                                    onClick={() => handleDeleteFaq(faq)}
                                    className="text-destructive"
                                  >
                                    <Trash2 size={14} className="mr-2" />
                                    삭제
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* FAQ Edit Dialog */}
        <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFaq ? 'FAQ 수정' : '새 FAQ 작성'}</DialogTitle>
              <DialogDescription className="sr-only">
                FAQ 질문과 답변을 입력하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select
                  value={String(faqFormData.category_id)}
                  onValueChange={(value) =>
                    setFaqFormData({ ...faqFormData, category_id: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>질문</Label>
                <Input
                  value={faqFormData.question}
                  onChange={(e) =>
                    setFaqFormData({ ...faqFormData, question: e.target.value })
                  }
                  placeholder="자주 묻는 질문을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>답변</Label>
                <Textarea
                  value={faqFormData.answer}
                  onChange={(e) =>
                    setFaqFormData({ ...faqFormData, answer: e.target.value })
                  }
                  placeholder="답변을 입력하세요"
                  rows={6}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={faqFormData.is_published}
                  onCheckedChange={(checked) =>
                    setFaqFormData({ ...faqFormData, is_published: checked })
                  }
                />
                <Label>발행</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFaqDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleSaveFaq}
                disabled={isSaving || !faqFormData.question || !faqFormData.answer}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedFaq ? '수정' : '작성'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Edit Dialog */}
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory ? '카테고리 수정' : '새 카테고리 추가'}
              </DialogTitle>
              <DialogDescription className="sr-only">
                카테고리 정보를 입력하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>카테고리명</Label>
                <Input
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  placeholder="카테고리 이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label>아이콘</Label>
                <Select
                  value={categoryFormData.icon}
                  onValueChange={(value) =>
                    setCategoryFormData({ ...categoryFormData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const Icon = getIconComponent(option.value);
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>정렬 순서</Label>
                <Input
                  type="number"
                  value={categoryFormData.sort_order}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      sort_order: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                취소
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={isSaving || !categoryFormData.name}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedCategory ? '수정' : '추가'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete FAQ Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>FAQ 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                이 FAQ를 삭제하시겠습니까?
                <br />
                삭제된 FAQ는 복구할 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteFaq}
                className="bg-destructive text-destructive-foreground"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Category Dialog */}
        <AlertDialog
          open={isDeleteCategoryDialogOpen}
          onOpenChange={setIsDeleteCategoryDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedCategory?.name}" 카테고리를 삭제하시겠습니까?
                <br />
                해당 카테고리의 모든 FAQ도 함께 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteCategory}
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
