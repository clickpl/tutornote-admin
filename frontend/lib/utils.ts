import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * UTC ISO 문자열을 KST로 변환하여 표시
 * 백엔드에서 UTC 시간으로 저장되고 timezone 정보 없이 반환되므로
 * 'Z'를 붙여 UTC로 파싱한 후 KST로 표시
 */
export function formatKSTDate(isoString: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!isoString) return '-';

  try {
    // ISO 문자열에 'Z'가 없으면 UTC로 간주하여 추가
    const utcString = isoString.endsWith('Z') ? isoString : isoString + 'Z';
    const date = new Date(utcString);

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
