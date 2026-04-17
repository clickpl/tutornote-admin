'use client';

import { useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { alimtalkApi } from '@/lib/api';

interface AlimtalkSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academyId: number;
  ownerName: string;
  ownerPhone: string;
}

type TemplateType = 'd7_reactivation' | 'welcome';

const TEMPLATE_OPTIONS: { value: TemplateType; label: string; preview: string }[] = [
  {
    value: 'd7_reactivation',
    label: 'D+7 재방문 (지원 요청 설문)',
    preview:
      '안녕하세요, 원장님!\n\n튜터노트를 사용하시면서 어려운 점이 있으셨나요?\n1분만 시간 내어 알려주시면 필요한 도움을 준비해드리겠습니다.\n\n[지원 요청 설문 참여하기]',
  },
  {
    value: 'welcome',
    label: '웰컴 재전송',
    preview:
      '안녕하세요, 원장님!\n\n튜터노트에 오신 걸 환영합니다.\n학원 운영을 더 편리하게 도와드릴게요.\n\n[튜터노트 시작하기]',
  },
];

export default function AlimtalkSendModal({
  open,
  onOpenChange,
  academyId,
  ownerName,
  ownerPhone,
}: AlimtalkSendModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('d7_reactivation');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const selectedPreview = TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)?.preview ?? '';

  const handleSend = async () => {
    setSending(true);
    setResult(null);

    const { data, error } = await alimtalkApi.send({
      academy_id: academyId,
      template_type: selectedTemplate,
    });

    if (data?.success) {
      setResult({ success: true, message: '발송 완료' });
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
      }, 1200);
    } else {
      setResult({ success: false, message: error || '발송에 실패했습니다.' });
    }

    setSending(false);
  };

  const handleClose = () => {
    if (sending) return;
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            알림톡 발송
          </DialogTitle>
          <DialogDescription>
            선택한 템플릿으로 원장님께 카카오 알림톡을 발송합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 수신자 정보 */}
          <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1">
            <p className="text-xs text-muted-foreground">수신자</p>
            <p className="font-medium text-sm">
              {ownerName || '원장'}{' '}
              <span className="text-muted-foreground font-normal">
                ({ownerPhone || '전화번호 없음'})
              </span>
            </p>
          </div>

          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">템플릿 선택</Label>
            <div className="space-y-2">
              {TEMPLATE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="template"
                    value={option.value}
                    checked={selectedTemplate === option.value}
                    onChange={() => setSelectedTemplate(option.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 미리보기 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">미리보기</Label>
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                {selectedPreview}
              </pre>
            </div>
          </div>

          {/* 결과 메시지 */}
          {result && (
            <div
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                result.success
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {result.message}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            취소
          </Button>
          <Button onClick={handleSend} disabled={sending || !ownerPhone}>
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            확인 후 발송
          </Button>
        </DialogFooter>

        {!ownerPhone && (
          <p className="text-center text-xs text-destructive -mt-2">
            전화번호가 없는 원장에게는 발송할 수 없습니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
