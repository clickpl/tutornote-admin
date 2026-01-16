/**
 * Admin API 클라이언트
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'API Error' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network Error' };
  }
}

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: { email: string; role: string } }>(
      '/api/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    ),
  me: () => fetchApi<{ email: string; role: string }>('/api/admin/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getStats: () =>
    fetchApi<{
      academies: { total: number; new_this_month: number };
      students: { total: number; new_this_month: number };
      reports: { today: number; this_month: number };
      attendance: { today: number };
    }>('/api/admin/dashboard/stats'),

  getActivity: () =>
    fetchApi<{
      activities: Array<{
        time: string;
        category: string;
        content: string;
        status: string;
      }>;
    }>('/api/admin/dashboard/activity'),

  getApiHealth: () =>
    fetchApi<{
      gemini: {
        status: string;
        success_rate: number;
        avg_response_time: number;
        estimated_cost_this_month: number;
      };
      kakao: {
        channel_status: string;
        templates_pending: number;
        sent_today: number;
        success_rate: number;
      };
      system: { database: string; image_service: string };
    }>('/api/admin/dashboard/api-health'),

  getAlerts: () =>
    fetchApi<{
      alerts: Array<{
        id: string;
        severity: 'critical' | 'warning';
        type: string;
        title: string;
        description: string;
        action: string;
        value: number;
        threshold: number;
        created_at: string;
      }>;
      total_count: number;
    }>('/api/admin/dashboard/alerts'),
};

// Academies
export const academiesApi = {
  list: (page = 1, perPage = 20, search = '', status = '') => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    return fetchApi<{
      academies: Array<{
        id: number;
        name: string;
        phone: string;
        owner_email: string;
        owner_name: string;
        student_count: number;
        attendance_code_type: string;
        status: string;
        created_at: string;
      }>;
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/academies?${params.toString()}`);
  },

  get: (id: number) =>
    fetchApi<{
      id: number;
      name: string;
      phone: string;
      address: string;
      owner_email: string;
      owner_name: string;
      owner_phone: string;
      attendance_code_type: string;
      status: string;
      kiosk_code: string;
      created_at: string;
      student_count: number;
      students: Array<{
        id: number;
        name: string;
        name_masked: string;
        phone_masked: string;
        parent_phone_masked: string;
        attendance_code: string;
        created_at: string;
      }>;
    }>(`/api/admin/academies/${id}`),

  update: (id: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    attendance_code_method?: string;
    kiosk_code?: string;
  }) =>
    fetchApi<{ success: boolean; message: string }>(
      `/api/admin/academies/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  updateStatus: (id: number, status: string, reason?: string) =>
    fetchApi<{
      success: boolean;
      message: string;
      old_status: string;
      new_status: string;
    }>(
      `/api/admin/academies/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status, reason }),
      }
    ),

  impersonate: (id: number) =>
    fetchApi<{ token: string; redirect_url: string }>(
      `/api/admin/academies/${id}/impersonate`,
      { method: 'POST' }
    ),
};

// Legal
export interface ConsentFilters {
  type?: string;
  category?: string;
  academy?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface Consent {
  id: number;
  user_id: number;
  consent_type: string;
  consent_category: string;
  consent_version: string;
  consented_at: string;
  revoked_at?: string;
  ip_address: string;
  consent_method: string;
  email: string;
  user_name: string;
  academy_id: number;
  academy_name: string;
  status: string;
}

export interface ConsentRequest {
  id: number;
  student_id: number;
  student_name_masked: string;
  parent_phone_masked: string;
  academy_id: number;
  academy_name: string;
  status: string;
  request_type: string;
  created_at: string;
  completed_at: string;
  expires_at: string;
  sent_count?: number;
  can_resend: boolean;
}

export const legalApi = {
  getConsents: (page = 1, perPage = 20, filters: ConsentFilters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.academy) params.append('academy', filters.academy);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.status) params.append('status', filters.status);

    return fetchApi<{
      consents: Consent[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/legal/consents?${params.toString()}`);
  },

  getConsentRequests: (page = 1, perPage = 20, filters: ConsentFilters = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (filters.status) params.append('status', filters.status);
    if (filters.academy) params.append('academy', filters.academy);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);

    return fetchApi<{
      requests: ConsentRequest[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/legal/consent-requests?${params.toString()}`);
  },

  resendConsentRequest: (requestId: number) =>
    fetchApi<{ success: boolean; message: string; sent_count: number }>(
      `/api/admin/legal/consent-requests/${requestId}/resend`,
      { method: 'POST' }
    ),

  exportConsents: (filters: ConsentFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.academy) params.append('academy', filters.academy);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return `${API_URL}/api/admin/legal/consents/export?${params.toString()}${token ? `&token=${token}` : ''}`;
  },

  exportConsentRequests: (filters: ConsentFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.academy) params.append('academy', filters.academy);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);

    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    return `${API_URL}/api/admin/legal/consent-requests/export?${params.toString()}${token ? `&token=${token}` : ''}`;
  },

  getStats: () =>
    fetchApi<{
      consent_versions: Array<{
        consent_type: string;
        consent_version: string;
        count: number;
      }>;
      consent_requests: {
        pending: number;
        completed: number;
        expired: number;
      };
    }>('/api/admin/legal/stats'),
};

// System - Types
export interface PM2Process {
  name: string;
  status: string;
  restarts: number;
  memory: number;
  cpu: number;
  uptime: number;
}

export interface ServerMetrics {
  latest: {
    id: number;
    cpu_usage: number;
    ram_usage: number;
    ram_total_mb: number;
    ram_used_mb: number;
    ram_available_mb: number;
    disk_usage: number;
    disk_total_gb: number;
    disk_used_gb: number;
    disk_free_gb: number;
    uptime: string;
    pm2_status: PM2Process[];
    recorded_at: string;
  } | null;
  trends: {
    hour: string;
    avg_cpu: number;
    avg_ram: number;
    avg_disk: number;
  }[];
  timestamp: string;
}

export interface QuotaDetail {
  daily: {
    used: number;
    limit: number;
    remaining: number;
    usage_percent: number;
    request_count: number;
    success_rate: number;
    avg_response_ms: number;
  };
  monthly: {
    used: number;
    limit: number;
    remaining: number;
    usage_percent: number;
    total_cost: number;
  };
}

export interface GeminiQuota {
  SERVICE: QuotaDetail;
  ADMIN: QuotaDetail;
}

export interface LogEntry {
  content: string;
  is_error: boolean;
}

export interface DiagnosisResult {
  diagnosis: string;
  severity: 'critical' | 'warning' | 'info';
  solution: string;
  explanation: string;
}

// System - API
export const systemApi = {
  getHealth: () =>
    fetchApi<{
      status: string;
      components: {
        database: string;
        gemini_api: string;
        kakao_api: string;
      };
    }>('/api/admin/system/health'),

  getMetrics: () =>
    fetchApi<ServerMetrics>('/api/admin/system/metrics'),

  getGeminiQuota: () =>
    fetchApi<GeminiQuota>('/api/admin/system/gemini-quota'),

  getLogs: (app = 'tutornote-backend', lines = 50, errorOnly = true) =>
    fetchApi<{
      app: string;
      logs: LogEntry[];
      total: number;
      timestamp: string;
    }>(`/api/admin/system/logs?app=${app}&lines=${lines}&error_only=${errorOnly}`),

  diagnoseLogs: (logs: string, context?: string) =>
    fetchApi<DiagnosisResult>(
      '/api/admin/system/logs/diagnose',
      {
        method: 'POST',
        body: JSON.stringify({ logs, context }),
      }
    ),
};

// Metrics & Analytics
export interface MetricsOverview {
  retention: {
    dau: number;
    mau: number;
    stickiness: number;
    stickiness_label: string;
    retention_rate: number;
    retention_label: string;
    churn_risk_count: number;
  };
  viral: {
    cardnews_count: number;
    total_shares: number;
    viewed_shares: number;
    share_ctr: number;
    ctr_label: string;
    total_views: number;
  };
  ai_efficiency: {
    total_reports: number;
    time_saved_minutes: number;
    time_saved_hours: number;
    time_saved_label: string;
    consent_rate: number;
    consent_label: string;
    avg_reports_per_academy: number;
  };
  monetization: {
    heavy_users: number;
    heavy_user_rate: number;
    heavy_user_label: string;
    mau: number;
  };
}

export interface ChurnRiskAcademy {
  id: number;
  name: string;
  phone: string;
  owner_email: string;
  owner_name: string;
  last_activity: string;
  days_inactive: number;
  student_count: number;
  total_reports: number;
  created_at: string;
}

export interface HeavyUserAcademy {
  id: number;
  name: string;
  phone: string;
  owner_email: string;
  owner_name: string;
  monthly_reports: number;
  student_count: number;
  total_shares: number;
  created_at: string;
}

export const metricsApi = {
  getOverview: () =>
    fetchApi<MetricsOverview>('/api/admin/metrics/overview'),

  getChurnRisk: () =>
    fetchApi<{
      academies: ChurnRiskAcademy[];
      total: number;
    }>('/api/admin/metrics/churn-risk'),

  getHeavyUsers: () =>
    fetchApi<{
      academies: HeavyUserAcademy[];
      total: number;
    }>('/api/admin/metrics/heavy-users'),

  getShareAnalytics: () =>
    fetchApi<{
      daily: Array<{ date: string; shares: number; views: number }>;
      platforms: Record<string, number>;
      month: { total_shares: number; total_views: number; avg_views: number };
    }>('/api/admin/metrics/share-analytics'),

  getConsentAnalytics: () =>
    fetchApi<{
      status: Record<string, number>;
      total_students: number;
      consent_rate: number;
      consented: number;
      pending: number;
      daily: Array<{ date: string; count: number }>;
    }>('/api/admin/metrics/consent-analytics'),

  getReportAnalytics: () =>
    fetchApi<{
      daily: Array<{ date: string; count: number; academies: number }>;
      top_academies: Array<{ id: number; name: string; report_count: number; student_count: number }>;
      month: { total_reports: number; active_academies: number; active_students: number };
    }>('/api/admin/metrics/report-analytics'),
};

// Data Recovery & Correction
export interface DeletedItem {
  id: number;
  item_type: 'student' | 'report';
  name?: string;
  student_name?: string;
  academy_id: number;
  academy_name: string;
  deleted_at: string;
  record_date?: string;
  current_piece?: string;
  // 복구 기간 관련 필드
  days_remaining?: number;
  can_restore?: boolean;
  expiry_date?: string;
}

export interface StudentDetail {
  id: number;
  name: string;
  phone: string;
  parent_phone: string;
  grade: string;
  attendance_code: string;
  academy_id: number;
  academy_name: string;
  is_deleted: boolean;
  deleted_at?: string;
  created_at: string;
}

export interface ActionLog {
  id: number;
  operator_email: string;
  action_type: string;
  target_type: string;
  target_id: number;
  academy_id?: number;
  academy_name?: string;
  changes?: Record<string, { old: string; new: string }>;
  reason?: string;
  created_at: string;
}

export const recoveryApi = {
  getDeletedItems: (page = 1, perPage = 20, type = '', academyId = '') => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (type) params.append('type', type);
    if (academyId) params.append('academy_id', academyId);

    return fetchApi<{
      items: DeletedItem[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/deleted-items?${params.toString()}`);
  },

  restore: (item_type: string, item_id: number, reason?: string) =>
    fetchApi<{ success: boolean; message: string }>(
      '/api/admin/restore',
      {
        method: 'POST',
        body: JSON.stringify({ item_type, item_id, reason }),
      }
    ),

  getStudentDetail: (studentId: number) =>
    fetchApi<StudentDetail>(`/api/admin/students/${studentId}/detail`),

  superEditStudent: (studentId: number, data: {
    name?: string;
    phone?: string;
    grade?: string;
    attendance_code?: string;
  }, reason?: string) =>
    fetchApi<{ success: boolean; message: string }>(
      `/api/admin/students/${studentId}/super-edit`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, reason }),
      }
    ),

  getActionLogs: (page = 1, perPage = 20, actionType = '', targetType = '') => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (actionType) params.append('action_type', actionType);
    if (targetType) params.append('target_type', targetType);

    return fetchApi<{
      logs: ActionLog[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/action-logs?${params.toString()}`);
  },
};

// =============================================================================
// Phase 2: Dashboard Metrics API
// =============================================================================

export interface AcademyStatusMetrics {
  active_academies: number;
  total_academies: number;
  new_this_month: number;
  churned_this_month: number;
  active_rate: number;
}

export interface StudentStatsMetrics {
  total_students: number;
  new_this_month: number;
  avg_per_academy: number;
  with_consent: number;
  consent_rate: number;
}

export interface ReportActivityMetrics {
  today: number;
  this_week: number;
  this_month: number;
  avg_daily: number;
}

export interface EngagementMetrics {
  dau: number;
  mau: number;
  stickiness: number;
  stickiness_label: string;
}

export interface ContentGenerationMetrics {
  card_news_today: number;
  card_news_month: number;
  generation_rate: number;
}

export interface ParentReachMetrics {
  total_shares: number;
  total_views: number;
  view_rate: number;
  avg_duration: number;
}

export interface AIEfficiencyMetrics {
  total_reports: number;
  ai_generated: number;
  ai_rate: number;
  avg_generation_time: number;
  edited_count: number;
  edit_rate: number;
}

export interface OnboardingFunnelMetrics {
  signup: number;
  student_added: number;
  report_created: number;
  shared: number;
  conversion_rate: number;
}

export interface MonetizationMetrics {
  heavy_users: number;
  heavy_user_rate: number;
  estimated_mrr: number;
  potential_upgrades: number;
}

export interface CostBreakdownMetrics {
  ai_cost_today: number;
  ai_cost_month: number;
  kakao_cost_month: number;
  total_cost_month: number;
  cost_per_report: number;
}

export interface SystemHealthMetrics {
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
  uptime_hours: number;
}

export interface ApiStatusMetrics {
  claude: { status: string; success_rate: number; avg_response_time: number };
  kakao: { status: string; success_rate: number; sent_today: number };
}

export interface AtRiskAcademy {
  id: number;
  academy_name: string;
  owner_name: string;
  phone: string;
  student_count: number;
  report_count: number;
  last_activity: string | null;
  inactive_days: number;
  signup_date: string;
  risk_level: 'critical' | 'warning' | 'caution';
}

export interface ActiveAcademy {
  id: number;
  academy_name: string;
  owner_name: string;
  phone: string;
  student_count: number;
  monthly_reports: number;
  total_shares: number;
  last_activity: string | null;
  signup_date: string;
  is_heavy_user: boolean;
  recommended_plan: string;
}

export interface OnboardingFunnelAcademy {
  id: number;
  academy_name: string;
  owner_name: string;
  signup_date: string;
  has_students: boolean;
  student_count: number;
  created_report: boolean;
  report_count: number;
  shared_kakaotalk: boolean;
  current_step: number;
  status: string;
}

export const dashboardMetricsApi = {
  // 12개 핵심 지표 API
  getAcademyStatus: () =>
    fetchApi<AcademyStatusMetrics>('/api/admin/metrics/academy-status'),

  getStudentStats: () =>
    fetchApi<StudentStatsMetrics>('/api/admin/metrics/student-stats'),

  getReportActivity: () =>
    fetchApi<ReportActivityMetrics>('/api/admin/metrics/report-activity'),

  getEngagement: () =>
    fetchApi<EngagementMetrics>('/api/admin/metrics/engagement'),

  getContentGeneration: () =>
    fetchApi<ContentGenerationMetrics>('/api/admin/metrics/content-generation'),

  getParentReach: () =>
    fetchApi<ParentReachMetrics>('/api/admin/metrics/parent-reach'),

  getAIEfficiency: () =>
    fetchApi<AIEfficiencyMetrics>('/api/admin/metrics/ai-efficiency'),

  getOnboardingFunnel: () =>
    fetchApi<OnboardingFunnelMetrics>('/api/admin/metrics/onboarding-funnel'),

  getMonetization: () =>
    fetchApi<MonetizationMetrics>('/api/admin/metrics/monetization'),

  getCostBreakdown: () =>
    fetchApi<CostBreakdownMetrics>('/api/admin/metrics/cost-breakdown'),

  getSystemHealth: () =>
    fetchApi<SystemHealthMetrics>('/api/admin/metrics/system-health'),

  getApiStatus: () =>
    fetchApi<ApiStatusMetrics>('/api/admin/metrics/api-status'),
};

export const dashboardTablesApi = {
  // 3개 테이블 API
  getAtRiskAcademies: () =>
    fetchApi<{ academies: AtRiskAcademy[]; total_count: number }>(
      '/api/admin/tables/at-risk-academies'
    ),

  getActiveAcademies: () =>
    fetchApi<{ academies: ActiveAcademy[]; total_count: number }>(
      '/api/admin/tables/active-academies'
    ),

  getOnboardingFunnel: () =>
    fetchApi<{
      academies: OnboardingFunnelAcademy[];
      total_count: number;
      funnel_summary: {
        signup: number;
        student_added: number;
        report_created: number;
        shared: number;
      };
      conversion_rates: {
        signup_to_student: number;
        student_to_report: number;
        report_to_share: number;
        overall: number;
      };
    }>('/api/admin/tables/onboarding-funnel'),

  getHeavyUsers: () =>
    fetchApi<{ academies: ActiveAcademy[]; total_count: number }>(
      '/api/admin/tables/heavy-users'
    ),
};

export const reportTrackingApi = {
  // 학부모 열람 추적 API
  trackView: (shareToken: string, viewerType = 'parent') =>
    fetchApi<{ success: boolean; view_id: number }>(
      '/api/reports/track-view',
      {
        method: 'POST',
        body: JSON.stringify({ share_token: shareToken, viewer_type: viewerType }),
      }
    ),

  trackDuration: (shareToken: string, duration: number) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'}/api/reports/track-duration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_token: shareToken, duration }),
      keepalive: true, // Beacon API 대용
    }),

  getViewsStats: () =>
    fetchApi<{
      total_views: number;
      unique_reports: number;
      avg_duration: number;
      parent_views: number;
    }>('/api/reports/views-stats'),
};

// Attendance Correction
export interface AttendanceRecord {
  id: number;
  student_id: number;
  academy_id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'late' | 'absent' | 'makeup';
  note: string | null;
  student_name: string;
  academy_name: string;
  created_at: string;
  updated_at: string;
}

export const attendanceApi = {
  getRecords: (studentId: number, page = 1, perPage = 20, dateFrom = '', dateTo = '') => {
    const params = new URLSearchParams({
      student_id: String(studentId),
      page: String(page),
      per_page: String(perPage),
    });
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    return fetchApi<{
      records: AttendanceRecord[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/attendance?${params.toString()}`);
  },

  update: (attendanceId: number, data: {
    check_in?: string | null;
    check_out?: string | null;
    status?: string;
    note?: string;
    reason?: string;
  }) =>
    fetchApi<{ success: boolean; message: string; changes: Record<string, unknown> }>(
      `/api/admin/attendance/${attendanceId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),
};

// =============================================================================
// Phase 3: AI Intelligence API
// =============================================================================

export interface AIIntelligenceLog {
  id: number;
  type: 'daily' | 'alert' | 'playbook' | 'message' | 'report';
  provider: 'gemini' | 'claude';
  academy_id: number | null;
  academy_name: string | null;
  output_content: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_krw: number;
  action_taken: boolean;
  action_note: string | null;
  action_at: string | null;
  created_at: string;
}

export interface AICostSummary {
  gemini: {
    request_count: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  claude: {
    request_count: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  total_requests: number;
  total_tokens: number;
  total_cost_usd: number;
}

export interface AIInsight {
  id: string;
  type: 'critical' | 'warning' | 'opportunity';
  title: string;
  description: string;
  academyId: number;
  playbookReady: boolean;
  messageReady: boolean;
}

export interface AITodayInsights {
  insights: AIInsight[];
  summary: {
    critical: number;
    warning: number;
    opportunity: number;
  };
}

export interface AIPlaybookRequest {
  academy_id: number;
  situation_type: 'inactivity_7d' | 'inactivity_14d' | 'inactivity_21d' | 'inactivity_30d' | 'low_engagement' | 'heavy_user';
}

export interface AIMessageRequest {
  academy_id: number;
  message_type: 'check_in' | 'engagement_tips' | 'thank_you' | 'upgrade_soft';
}

export const aiIntelligenceApi = {
  // 일일 인텔리전스 생성
  generateDailyIntelligence: () =>
    fetchApi<{ intelligence: string; tokens_used: number }>(
      '/api/admin/ai/daily-intelligence',
      { method: 'POST' }
    ),

  // Playbook 생성
  generatePlaybook: (data: AIPlaybookRequest) =>
    fetchApi<{ playbook: string; academy_name: string; tokens_used: number }>(
      '/api/admin/ai/playbook',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // AI 메시지 생성
  generateMessage: (data: AIMessageRequest) =>
    fetchApi<{ message: string; academy_name: string; tokens_used: number }>(
      '/api/admin/ai/message',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // 텔레그램 승인 요청 발송
  sendApprovalRequest: (data: { academy_id: number; message: string; message_type: string }) =>
    fetchApi<{ success: boolean; message: string }>(
      '/api/admin/ai/send-approval',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // AI 로그 조회
  getLogs: (page = 1, perPage = 20, logType = '') => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (logType) params.append('type', logType);

    return fetchApi<{
      logs: AIIntelligenceLog[];
      total: number;
      page: number;
      total_pages: number;
    }>(`/api/admin/ai/logs?${params.toString()}`);
  },

  // 비용 요약 조회
  getCostSummary: () =>
    fetchApi<AICostSummary>('/api/admin/ai/cost-summary'),

  // 오늘의 인사이트 조회
  getTodayInsights: () =>
    fetchApi<AITodayInsights>('/api/admin/ai/today-insights'),
};
