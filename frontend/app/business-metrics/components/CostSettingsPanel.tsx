'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Pencil, Trash2, RotateCcw, Save, Loader2 } from 'lucide-react';

interface CostSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

interface FixedCost {
  id: string;
  name: string;
  amount: number;
  currency: string;
  condition_type: string;
  min_academies: number | null;
  max_academies: number | null;
  category: string | null;
  memo: string | null;
  is_default: boolean;
}

interface CostSettings {
  fixedCosts: FixedCost[];
  variableCosts: {
    ai_cost_per_item: number;
    alimtalk_cost_per_item: number;
    alimtalk_price_per_item: number;
    pg_cost_rate: number;
    pg_margin_rate: number;
  };
  proBenefits: {
    free_alimtalk_count: number;
    free_pg_limit: number;
  };
  simulationParams: {
    pro_conversion_rate: number;
    free_payment_usage_rate: number;
    avg_students_per_academy: number;
    avg_monthly_payment: number;
    alimtalk_usage_free: number;
    alimtalk_usage_pro: number;
    exchange_rate: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export default function CostSettingsPanel({ open, onClose }: CostSettingsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CostSettings | null>(null);

  // 설정 로드
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/api/admin/business-metrics/costs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/business-metrics/costs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          variableCosts: {
            aiCostPerItem: settings.variableCosts.ai_cost_per_item,
            alimtalkCostPerItem: settings.variableCosts.alimtalk_cost_per_item,
            alimtalkPricePerItem: settings.variableCosts.alimtalk_price_per_item,
            pgCostRate: settings.variableCosts.pg_cost_rate,
            pgMarginRate: settings.variableCosts.pg_margin_rate,
          },
          proBenefits: {
            freeAlimtalkCount: settings.proBenefits.free_alimtalk_count,
            freePgLimit: settings.proBenefits.free_pg_limit,
          },
          simulationParams: {
            proConversionRate: settings.simulationParams.pro_conversion_rate,
            freePaymentUsageRate: settings.simulationParams.free_payment_usage_rate,
            avgStudentsPerAcademy: settings.simulationParams.avg_students_per_academy,
            avgMonthlyPayment: settings.simulationParams.avg_monthly_payment,
            alimtalkUsageFree: settings.simulationParams.alimtalk_usage_free,
            alimtalkUsagePro: settings.simulationParams.alimtalk_usage_pro,
            exchangeRate: settings.simulationParams.exchange_rate,
          },
        }),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('정말 기본값으로 복원하시겠습니까?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('admin_token');
      await fetch(`${API_URL}/api/admin/business-metrics/costs/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadSettings();
    } catch (error) {
      console.error('Failed to reset settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!settings) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            비용 설정
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* 고정 비용 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">고정 비용 (월)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {settings.fixedCosts.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{cost.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cost.condition_type === 'always'
                          ? '전체'
                          : `${cost.min_academies || 0}~${cost.max_academies || '∞'}개`}
                      </p>
                    </div>
                    <p className="font-medium">₩{formatCurrency(cost.amount)}</p>
                  </div>
                ))}
                <p className="pt-2 text-right text-sm text-muted-foreground">
                  현재 기준 합계: ₩{formatCurrency(
                    settings.fixedCosts
                      .filter(c => c.condition_type === 'always' || (c.min_academies || 0) <= 3)
                      .reduce((sum, c) => sum + c.amount, 0)
                  )}
                </p>
              </CardContent>
            </Card>

            {/* 변동 비용 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">변동 비용 (건당)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">AI 피드백 원가</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
                      <Input
                        type="number"
                        value={settings.variableCosts.ai_cost_per_item}
                        onChange={(e) => setSettings({
                          ...settings,
                          variableCosts: {
                            ...settings.variableCosts,
                            ai_cost_per_item: Number(e.target.value)
                          }
                        })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">알림톡 원가</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
                      <Input
                        type="number"
                        value={settings.variableCosts.alimtalk_cost_per_item}
                        onChange={(e) => setSettings({
                          ...settings,
                          variableCosts: {
                            ...settings.variableCosts,
                            alimtalk_cost_per_item: Number(e.target.value)
                          }
                        })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">알림톡 판매가</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
                      <Input
                        type="number"
                        value={settings.variableCosts.alimtalk_price_per_item}
                        onChange={(e) => setSettings({
                          ...settings,
                          variableCosts: {
                            ...settings.variableCosts,
                            alimtalk_price_per_item: Number(e.target.value)
                          }
                        })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">PG 수수료율</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        step="0.001"
                        value={(settings.variableCosts.pg_cost_rate * 100).toFixed(1)}
                        onChange={(e) => setSettings({
                          ...settings,
                          variableCosts: {
                            ...settings.variableCosts,
                            pg_cost_rate: Number(e.target.value) / 100
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro 혜택 설정 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pro 학원 혜택</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">무료 알림톡</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        value={settings.proBenefits.free_alimtalk_count}
                        onChange={(e) => setSettings({
                          ...settings,
                          proBenefits: {
                            ...settings.proBenefits,
                            free_alimtalk_count: Number(e.target.value)
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">건/월</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">PG 무료 한도</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
                      <Input
                        type="number"
                        value={settings.proBenefits.free_pg_limit}
                        onChange={(e) => setSettings({
                          ...settings,
                          proBenefits: {
                            ...settings.proBenefits,
                            free_pg_limit: Number(e.target.value)
                          }
                        })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 시뮬레이션 파라미터 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">시뮬레이션 파라미터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Pro 전환율</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        step="1"
                        value={(settings.simulationParams.pro_conversion_rate * 100).toFixed(0)}
                        onChange={(e) => setSettings({
                          ...settings,
                          simulationParams: {
                            ...settings.simulationParams,
                            pro_conversion_rate: Number(e.target.value) / 100
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Free 결제 사용률</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        step="1"
                        value={(settings.simulationParams.free_payment_usage_rate * 100).toFixed(0)}
                        onChange={(e) => setSettings({
                          ...settings,
                          simulationParams: {
                            ...settings.simulationParams,
                            free_payment_usage_rate: Number(e.target.value) / 100
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">학원당 평균 학생</Label>
                    <div className="relative mt-1">
                      <Input
                        type="number"
                        value={settings.simulationParams.avg_students_per_academy}
                        onChange={(e) => setSettings({
                          ...settings,
                          simulationParams: {
                            ...settings.simulationParams,
                            avg_students_per_academy: Number(e.target.value)
                          }
                        })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">명</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">학원당 월 결제액</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₩</span>
                      <Input
                        type="number"
                        value={settings.simulationParams.avg_monthly_payment}
                        onChange={(e) => setSettings({
                          ...settings,
                          simulationParams: {
                            ...settings.simulationParams,
                            avg_monthly_payment: Number(e.target.value)
                          }
                        })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* 버튼 */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetToDefaults} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                기본값 복원
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                저장
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
