'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Send, FileText, Download } from 'lucide-react';

interface QuickActionsProps {
  atRiskCount: number;
  heavyUserCount: number;
  onContactAtRisk?: () => void;
  onSendPromotion?: () => void;
  onExportReport?: () => void;
  onDownloadData?: () => void;
}

export default function QuickActions({
  atRiskCount,
  heavyUserCount,
  onContactAtRisk,
  onSendPromotion,
  onExportReport,
  onDownloadData,
}: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">빠른 액션</CardTitle>
        <CardDescription>자주 사용하는 관리 기능</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200"
          onClick={onContactAtRisk}
        >
          <Phone className="h-5 w-5 text-red-500" />
          <div className="text-center">
            <div className="font-medium">이탈 위험 연락</div>
            <div className="text-xs text-muted-foreground">{atRiskCount}개 학원</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200"
          onClick={onSendPromotion}
        >
          <Send className="h-5 w-5 text-purple-500" />
          <div className="text-center">
            <div className="font-medium">유료 전환 안내</div>
            <div className="text-xs text-muted-foreground">{heavyUserCount}개 대상</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
          onClick={onExportReport}
        >
          <FileText className="h-5 w-5 text-blue-500" />
          <div className="text-center">
            <div className="font-medium">주간 리포트</div>
            <div className="text-xs text-muted-foreground">PDF 생성</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200"
          onClick={onDownloadData}
        >
          <Download className="h-5 w-5 text-green-500" />
          <div className="text-center">
            <div className="font-medium">데이터 내보내기</div>
            <div className="text-xs text-muted-foreground">Excel/CSV</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
