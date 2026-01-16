'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Building2,
  Scale,
  Bell,
  Settings,
  LogOut,
  Menu,
  Search,
  ChevronDown,
  Moon,
  Sun,
  BarChart3,
  RotateCcw,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminLayoutProps {
  children: ReactNode;
}

// Phase 2 완료 시 true로 변경하여 인사이트 지표 메뉴 활성화
const ENABLE_METRICS_PAGE = false;

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
  // 인사이트 지표 - Phase 2 완료 시 활성화 (ENABLE_METRICS_PAGE = true)
  ...(ENABLE_METRICS_PAGE ? [{ href: '/metrics', label: '인사이트 지표', icon: BarChart3 }] : []),
  { href: '/ai-intelligence', label: 'AI 인텔리전스', icon: Brain },
  { href: '/business-metrics', label: '비즈니스 지표', icon: BarChart3 },
  { href: '/academies', label: '학원 관리', icon: Building2 },
  { href: '/recovery', label: '복구/수정 센터', icon: RotateCcw },
  { href: '/legal', label: '법무 관리', icon: Scale },
  { href: '/notifications', label: '알림 관리', icon: Bell },
  { href: '/system', label: '시스템', icon: Settings },
];

function NavItems({ pathname, onItemClick }: { pathname: string; onItemClick?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {menuItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ pathname, onItemClick, logout }: {
  pathname: string;
  onItemClick?: () => void;
  logout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">T</span>
        </div>
        <div>
          <h1 className="text-sm font-bold">TutorNote</h1>
          <p className="text-xs text-muted-foreground">Master Admin</p>
        </div>
      </div>

      {/* Navigation */}
      <NavItems pathname={pathname} onItemClick={onItemClick} />

      {/* Footer */}
      <div className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    // localStorage에서 테마 설정 불러오기 (기본값: 라이트 모드)
    const savedTheme = localStorage.getItem('admin_theme');
    const prefersDark = savedTheme === 'dark';
    setIsDark(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('admin_theme', newIsDark ? 'dark' : 'light');
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-card lg:block">
        <SidebarContent pathname={pathname} logout={logout} />
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">메뉴 열기</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <SidebarContent
                    pathname={pathname}
                    onItemClick={() => setSheetOpen(false)}
                    logout={logout}
                  />
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="검색..."
                    className="w-64 pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">테마 변경</span>
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm md:inline-block">{user.email}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
