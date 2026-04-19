import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * KST ISO 문자열을 한국어 날짜로 표시
 * 백엔드 DB가 KST(+09:00)로 저장하므로 timezone 정보를 명시하여 이중 변환 방지
 */
export function formatKSTDate(isoString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!isoString) return '-';

  try {
    // DB가 KST로 저장하므로 timezone 없는 문자열에 +09:00 명시
    const kstString = isoString.endsWith('Z') || isoString.includes('+')
      ? isoString
      : isoString + '+09:00';
    const date = new Date(kstString);

    if (isNaN(date.getTime())) return isoString;

    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      ...options
    });
  } catch {
    return isoString;
  }
}

/**
 * UTC ISO 문자열을 KST 날짜만 표시 (YYYY. M. D.)
 */
export function formatKSTDateOnly(isoString: string | null | undefined): string {
  return formatKSTDate(isoString, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
}

/**
 * UTC ISO 문자열을 KST 시간만 표시 (오전/오후 H:MM:SS)
 */
export function formatKSTTimeOnly(isoString: string | null | undefined): string {
  return formatKSTDate(isoString, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}
