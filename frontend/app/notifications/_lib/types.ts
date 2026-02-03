// =============================================================================
// 카카오 알림톡 타입
// =============================================================================

export interface KakaoMetrics {
  channel_status: 'approved' | 'pending' | 'rejected'
  today_count: number
  today_success: number
  today_failed: number
  month_count: number
  month_success: number
  month_failed: number
  success_rate: number
  month_cost: number
  yesterday_count: number
  trend: string
}

export interface KakaoChartData {
  date: string
  success: number
  failed: number
  total: number
}

export interface KakaoTemplate {
  id: number
  template_code: string
  template_name: string
  category: string
  status: 'approved' | 'pending' | 'rejected'
  last_used_at: string | null
  use_count: number
  approved_at: string | null
}

export interface KakaoHistory {
  id: number
  sent_at: string
  academy_id: number
  academy_name: string
  template_code: string
  template_name: string
  phone: string
  receiver_name: string | null
  status: 'success' | 'failed'
  error_code: string | null
  error_message: string | null
  cost: number
  message_id: string | null
}

export interface KakaoHistoryResponse {
  items: KakaoHistory[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  summary: {
    total_count: number
    success_count: number
    failed_count: number
    total_cost: number
  }
}

export interface KakaoHistoryFilters {
  academy_id?: number
  template_code?: string
  status?: 'success' | 'failed'
  date_from?: string
  date_to?: string
}


// =============================================================================
// 텔레그램 알림 타입
// =============================================================================

export type TelegramNotificationType =
  | 'server_check'
  | 'daily_report'
  | 'service_report'
  | 'error'

export type TelegramSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

export interface TelegramStatus {
  notification_type: TelegramNotificationType
  name: string
  description: string
  is_enabled: boolean
  check_interval: number | null
  schedule_time: string | null
  last_sent_at: string | null
  today_count: number
  today_failed: number
  config: Record<string, unknown>
}

export interface TelegramChartData {
  hour: string
  server_check: number
  daily_report: number
  service_report: number
  error: number
  total: number
}

export interface TelegramError {
  id: number
  sent_at: string
  notification_type: 'error'
  severity: TelegramSeverity
  title: string
  message: string
  error_code: string | null
  error_type: string | null
  academy_id: number | null
  academy_name: string | null
  status: 'sent' | 'failed'
  telegram_message_id: string | null
  metadata: Record<string, unknown> | null
}

export interface TelegramErrorResponse {
  items: TelegramError[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

export interface TelegramErrorFilters {
  severity?: TelegramSeverity
  error_code?: string
  academy_id?: number
  date_from?: string
  date_to?: string
}

export interface TelegramConfigUpdate {
  notification_type: TelegramNotificationType
  is_enabled?: boolean
  check_interval?: number
  schedule_time?: string
  config?: Record<string, unknown>
}
