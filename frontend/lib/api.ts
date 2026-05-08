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
        academy_id?: number;
        email?: string;
        member_name?: string;
      }>;
      total_count: number;
    }>('/api/admin/dashboard/alerts'),
};

// Academies
export const academiesApi = {
  list: (page = 1, perPage = 20, search = '', status = '', plan = '') => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (plan) params.append('plan', plan);

    return fetchApi<{
      academies: Array<{
        id: number;
        name: string;
        phone: string;
        owner_email: string;
        owner_name: string;
        member_name?: string;
        student_count: number;
        attendance_code_method: string;
        status: string;
        plan: 'free' | 'aiplus' | 'payment';
        payment_enabled: boolean;
        payment_status?: 'active' | 'inactive' | 'reviewing';
        is_founding_member: boolean;
        payment_commission_rate?: number;
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
      attendance_code_method: string;
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
    wau: number;
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
  saved_today: number;
  saved_month: number;
  avg_daily: number;
}

export interface EngagementMetrics {
  growth_index: number;
  academy_growth: number;
  student_growth: number;
  report_growth: number;
  last_month_summary: {
    active_academies: number;
    students: number;
    reports: number;
  };
}

export interface ContentGenerationMetrics {
  sent_month: number;
  sent_today: number;
  kakao_count: number;
  link_count: number;
}

export interface ParentReachMetrics {
  total_shares: number;
  total_views: number;
  view_rate: number;
  viewed_reports: number;
}

export interface AIEfficiencyMetrics {
  ai_generated_month: number;
  ai_generated_today: number;
  avg_generation_time: number;
}

export interface OnboardingFunnelMetrics {
  signup_count: number;
  completed_count: number;
  completion_rate: number;
}

export interface MonetizationMetrics {
  loyal_count: number;
  business_days: number;
  login_qualified: number;
  kiosk_qualified: number;
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
  member_name?: string;
  phone: string;
  student_count: number;
  report_count: number;
  last_activity: string | null;
  last_activity_type?: 'login' | 'report' | 'attendance' | 'student' | 'progress' | 'signup';
  inactive_days: number;
  signup_date: string;
  risk_level: 'critical' | 'warning' | 'caution';
  email?: string;
}

export interface ActiveAcademy {
  id: number;
  academy_name: string;
  owner_name: string;
  member_name?: string;
  phone: string;
  student_count: number;
  monthly_progress: number;
  total_shares: number;
  last_activity: string | null;
  signup_date: string;
  is_loyal: boolean;
  recommended_plan: string;
  email?: string;
}

export interface OnboardingFunnelAcademy {
  id: number;
  academy_name: string;
  owner_name: string;
  signup_date: string;
  student_count: number;
  wizard_completed: boolean;
  wizard_completed_at: string | null;
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

  getActivationFunnel: () =>
    fetchApi<{
      funnel: {
        wizard_rate: number;
        first_record_rate: number;
        first_report_rate: number;
        revisit_rate: number;
      };
      counts: {
        total: number;
        wizard_done: number;
        first_record_done: number;
        first_report_done: number;
        revisit_done: number;
      };
      academies: Array<{
        id: number;
        name: string;
        wizard_done: boolean;
        student_count: number;
        record_count: number;
        report_count: number;
        last_active_at: string | null;
      }>;
    }>('/api/admin/metrics/activation-funnel'),
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
        owner_name: number;
        student_added: number;
        wizard_completed: number;
      };
      conversion_rates: {
        signup_to_name: number;
        name_to_student: number;
        student_to_complete: number;
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
  type: 'critical' | 'warning' | 'caution' | 'opportunity';
  title: string;
  description: string;
  academyId: number;
  playbookReady: boolean;
  messageReady: boolean;
  lastActivity?: string;
  lastActivityType?: string;
}

export interface AITodayInsights {
  insights: AIInsight[];
  summary: {
    critical: number;
    warning: number;
    caution: number;
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

  // LMS 직접 발송
  sendLms: (data: { academy_id: number; message: string; message_type: string }) =>
    fetchApi<{ success: boolean; message_id: string; error: string; recipient: string }>(
      '/api/admin/ai/send-lms',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
};

// =============================================================================
// Phase 4: 서비스 운영 도구 API
// =============================================================================

// 공지사항 Types
export interface Announcement {
  id: number;
  category: 'update' | 'notice' | 'tip';
  title: string;
  content: string;
  is_new: boolean;
  is_published: boolean;
  sort_order: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementInput {
  category: 'update' | 'notice' | 'tip';
  title: string;
  content: string;
  is_new?: boolean;
  is_published?: boolean;
  sort_order?: number;
  published_at?: string;
}

// FAQ Types
export interface FAQCategory {
  id: number;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface FAQ {
  id: number;
  category_id: number;
  category_name?: string;
  category_icon?: string;
  question: string;
  answer: string;
  is_published: boolean;
  sort_order: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface FAQInput {
  category_id: number;
  question: string;
  answer: string;
  is_published?: boolean;
  sort_order?: number;
}

// 이벤트 배너 Types
export interface EventBanner {
  id: number;
  type: 'top_banner' | 'card_banner';
  title: string;
  content: string;
  background_color: string;
  text_color: string;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_dismissible: boolean;
  priority: number;
  status?: 'active' | 'scheduled' | 'expired' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface EventBannerInput {
  type: 'top_banner' | 'card_banner';
  title: string;
  content?: string;
  background_color?: string;
  text_color?: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
  is_dismissible?: boolean;
  priority?: number;
}

// 공지사항 API
export const announcementsApi = {
  list: (category?: string, is_published?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (is_published !== undefined) params.append('is_published', String(is_published));

    return fetchApi<{ success: boolean; data: Announcement[] }>(
      `/api/admin/announcements?${params.toString()}`
    );
  },

  get: (id: number) =>
    fetchApi<{ success: boolean; data: Announcement }>(`/api/admin/announcements/${id}`),

  create: (data: AnnouncementInput) =>
    fetchApi<{ success: boolean; data: { id: number } }>(
      '/api/admin/announcements',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: (id: number, data: AnnouncementInput) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/announcements/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/announcements/${id}`,
      { method: 'DELETE' }
    ),

  reorder: (items: { id: number; sort_order: number }[]) =>
    fetchApi<{ success: boolean }>(
      '/api/admin/announcements/reorder',
      {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      }
    ),
};

// FAQ API
export const faqApi = {
  // 카테고리
  getCategories: () =>
    fetchApi<{ success: boolean; data: FAQCategory[] }>('/api/admin/faq-categories'),

  createCategory: (data: { name: string; icon: string; sort_order?: number }) =>
    fetchApi<{ success: boolean; data: { id: number } }>(
      '/api/admin/faq-categories',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  updateCategory: (id: number, data: { name: string; icon: string; sort_order?: number }) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/faq-categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  deleteCategory: (id: number) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/faq-categories/${id}`,
      { method: 'DELETE' }
    ),

  // FAQ
  list: (category_id?: number, is_published?: boolean) => {
    const params = new URLSearchParams();
    if (category_id) params.append('category_id', String(category_id));
    if (is_published !== undefined) params.append('is_published', String(is_published));

    return fetchApi<{ success: boolean; data: FAQ[] }>(
      `/api/admin/faqs?${params.toString()}`
    );
  },

  get: (id: number) =>
    fetchApi<{ success: boolean; data: FAQ }>(`/api/admin/faqs/${id}`),

  create: (data: FAQInput) =>
    fetchApi<{ success: boolean; data: { id: number } }>(
      '/api/admin/faqs',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: (id: number, data: FAQInput) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/faqs/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/faqs/${id}`,
      { method: 'DELETE' }
    ),

  reorder: (items: { id: number; sort_order: number }[]) =>
    fetchApi<{ success: boolean }>(
      '/api/admin/faqs/reorder',
      {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      }
    ),
};

// 이벤트 배너 API
export const bannersApi = {
  list: (type?: string, is_active?: boolean, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (is_active !== undefined) params.append('is_active', String(is_active));
    if (status) params.append('status', status);

    return fetchApi<{ success: boolean; data: EventBanner[] }>(
      `/api/admin/banners?${params.toString()}`
    );
  },

  get: (id: number) =>
    fetchApi<{ success: boolean; data: EventBanner }>(`/api/admin/banners/${id}`),

  create: (data: EventBannerInput) =>
    fetchApi<{ success: boolean; data: { id: number } }>(
      '/api/admin/banners',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  update: (id: number, data: EventBannerInput) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/banners/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),

  delete: (id: number) =>
    fetchApi<{ success: boolean }>(
      `/api/admin/banners/${id}`,
      { method: 'DELETE' }
    ),

  duplicate: (id: number) =>
    fetchApi<{ success: boolean; data: { id: number } }>(
      `/api/admin/banners/${id}/duplicate`,
      { method: 'POST' }
    ),
};

// =============================================================================
// 알림 관리 API (카카오 알림톡 + 텔레그램)
// =============================================================================

import type {
  KakaoMetrics,
  KakaoChartData,
  KakaoTemplate,
  KakaoHistoryResponse,
  KakaoHistoryFilters,
  TelegramStatus,
  TelegramChartData,
  TelegramErrorResponse,
  TelegramErrorFilters,
  TelegramConfigUpdate,
} from '@/app/notifications/_lib/types';

export const notificationsApi = {
  // 카카오 알림톡
  kakao: {
    getMetrics: () =>
      fetchApi<KakaoMetrics>('/api/admin/notifications/kakao/metrics'),

    getChart: (days = 7) =>
      fetchApi<{ data: KakaoChartData[] }>(`/api/admin/notifications/kakao/chart?days=${days}`),

    getTemplates: () =>
      fetchApi<{ templates: KakaoTemplate[] }>('/api/admin/notifications/kakao/templates'),

    getHistory: (page = 1, filters?: KakaoHistoryFilters) => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '20',
      });
      if (filters?.academy_id) params.append('academy_id', String(filters.academy_id));
      if (filters?.template_code) params.append('template_code', filters.template_code);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      return fetchApi<KakaoHistoryResponse>(`/api/admin/notifications/kakao/history?${params.toString()}`);
    },
  },

  // 텔레그램 알림
  telegram: {
    getStatus: () =>
      fetchApi<{ types: TelegramStatus[] }>('/api/admin/notifications/telegram/status'),

    getChart: (hours = 24) =>
      fetchApi<{ data: TelegramChartData[] }>(`/api/admin/notifications/telegram/chart?hours=${hours}`),

    getErrors: (page = 1, filters?: TelegramErrorFilters) => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: '20',
      });
      if (filters?.severity) params.append('severity', filters.severity);
      if (filters?.error_code) params.append('error_code', filters.error_code);
      if (filters?.academy_id) params.append('academy_id', String(filters.academy_id));
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);

      return fetchApi<TelegramErrorResponse>(`/api/admin/notifications/telegram/errors?${params.toString()}`);
    },

    updateConfig: (data: TelegramConfigUpdate) =>
      fetchApi<{ success: boolean; message: string; config: TelegramStatus }>(
        '/api/admin/notifications/telegram/config',
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
  },
};

// =============================================================================
// Blog API
// =============================================================================

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  author: string;
  tags: string[];
  keyword: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  source: 'manual' | 'n8n' | 'migration';
  notion_id: string | null;
  view_count: number;
  reading_time: number;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  description: string;
  content: string;
  author?: string;
  tags?: string[];
  keyword?: string;
  status?: 'draft' | 'published' | 'archived';
  og_image_url?: string;
}

export const blogApi = {
  list: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    const qs = params.toString();
    return fetchApi<{ success: boolean; data: BlogPost[] }>(`/api/admin/blog${qs ? '?' + qs : ''}`);
  },
  get: (id: number) =>
    fetchApi<{ success: boolean; data: BlogPost }>(`/api/admin/blog/${id}`),
  create: (data: BlogPostInput) =>
    fetchApi<{ success: boolean; data: { id: number; slug: string } }>('/api/admin/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<BlogPostInput>) =>
    fetchApi<{ success: boolean }>(`/api/admin/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<{ success: boolean }>(`/api/admin/blog/${id}`, {
      method: 'DELETE',
    }),
  updateStatus: (id: number, status: string) =>
    fetchApi<{ success: boolean }>(`/api/admin/blog/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ============================================================================
// 결제 관리 API
// ============================================================================

export interface BillingDashboard {
  // 3-tier MRR breakdown
  total_mrr: number;              // 구독 + 수수료 + 알림톡
  subscription_mrr: number;       // AI Plus 4,900원 × 구독 학원 수
  commission_mrr: number;         // Payment 월 결제 수수료 합계
  alimtalk_revenue: number;       // 크레딧 충전 금액 합계
  // Plan distribution
  plan_counts: { free: number; basic: number; payment: number };
  founding_member_count: number;  // N/100
  // Grants cost
  alimtalk_grant_cost: number;    // 창립멤버 200건 + Payment 500건 비용
  // Legacy fields (kept for backward compat)
  mrr: number;
  arr: number;
  total_subscribers: number;
  monthly_subscribers: number;
  yearly_subscribers: number;
  founding_subscribers: number;
  churn_rate: number;
  payment_success_rate: number;
  total_revenue: number;
  this_month_revenue: number;
  credit_revenue: number;
  pending_retries: number;
}

export interface AdminBillingSubscription {
  id: number;
  academy_id: number;
  academy_name: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  is_founding_price: boolean;
  card_company: string;
  card_number_masked: string;
  status: 'active' | 'expired' | 'cancelled';
  next_billing_date: string | null;
  retry_count: number;
  created_at: string | null;
}

export interface AdminPaymentRecord {
  id: number;
  academy_id: number;
  academy_name: string;
  payment_key: string;
  order_id: string;
  type: 'subscription' | 'credit';
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  receipt_url: string | null;
  approved_at: string | null;
  failure_code: string | null;
  failure_message: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string | null;
}

export interface FailedPayment {
  id: number;
  academy_id: number;
  academy_name: string;
  plan_type: 'monthly' | 'yearly';
  amount: number;
  retry_count: number;
  last_retry_at: string | null;
  next_billing_date: string | null;
  last_error: string | null;
}

export const billingApi = {
  getDashboard: () =>
    fetchApi<BillingDashboard>('/api/admin/billing/dashboard'),

  getSubscriptions: (page = 1, filters?: { status?: string; plan_type?: string; founding?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plan_type) params.append('plan_type', filters.plan_type);
    if (filters?.founding) params.append('founding', filters.founding);
    return fetchApi<{ subscriptions: AdminBillingSubscription[]; pagination: { page: number; limit: number; total: number } }>(
      `/api/admin/billing/subscriptions?${params.toString()}`
    );
  },

  getPayments: (page = 1, filters?: { status?: string; type?: string; date_from?: string; date_to?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    return fetchApi<{ payments: AdminPaymentRecord[]; pagination: { page: number; limit: number; total: number } }>(
      `/api/admin/billing/payments?${params.toString()}`
    );
  },

  refund: (paymentKey: string, reason?: string, amount?: number) =>
    fetchApi<{ success: boolean; payment_key: string; refund_amount: number; message: string }>(
      '/api/admin/billing/refund',
      {
        method: 'POST',
        body: JSON.stringify({ payment_key: paymentKey, reason, amount }),
      }
    ),

  getFailedPayments: () =>
    fetchApi<{ failed_payments: FailedPayment[]; total: number }>('/api/admin/billing/failed-payments'),
};

// Academy Payment Transactions (학원비 결제)
export interface PaymentTransaction {
  id: number;
  academy_id: number;
  academy_name: string;
  student_id: number;
  student_name: string;
  amount: number;
  pg_fee: number;           // PG 수수료 (2.4%)
  tn_fee: number;           // TN 수수료 (0.4% or 0.2%)
  settlement_amount: number; // 정산금액 = amount - pg_fee - tn_fee
  status: 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded';
  payment_method?: string;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentTransactionSummary {
  total_amount: number;
  total_pg_fee: number;
  total_tn_fee: number;
  total_settlement: number;
}

// =============================================================================
// Phase 2.5: 알림톡 수동 발송 & 고객 지원 요청 API
// =============================================================================

export interface AlimtalkSendRequest {
  academy_id: number;
  template_type: 'd7_reactivation' | 'welcome';
}

export interface AlimtalkSendResponse {
  success: boolean;
  send_id: number;
  message: string;
}

export type SupportRequestStatus = 'new' | 'in_progress' | 'resolved' | 'no_action';

export interface SupportRequest {
  id: number;
  academy_id: number;
  academy_name: string;
  user_name: string;
  user_phone: string;
  source: string;
  difficulties: string[];
  difficulties_labels: string[];
  intent: string | null;
  wants_help: boolean;
  free_text: string | null;
  status: SupportRequestStatus;
  admin_memo: string | null;
  handled_by: number | null;
  handled_at: string | null;
  created_at: string;
}

export const alimtalkApi = {
  send: (data: AlimtalkSendRequest) =>
    fetchApi<AlimtalkSendResponse>('/api/admin/alimtalk/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export interface SupportRequestStats {
  total: number;
  difficulties: { code: string; label: string; count: number }[];
  intent: { code: string; label: string; count: number }[];
  wants_help: { yes: number; no: number };
}

export type SupportRequestListParams = {
  status?: string;
  source?: string;
  academy_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export const supportRequestsApi = {
  list: (params?: SupportRequestListParams) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.academy_id) searchParams.append('academy_id', String(params.academy_id));
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    return fetchApi<{ total: number; items: SupportRequest[] }>(
      `/api/admin/support-requests${qs ? '?' + qs : ''}`
    );
  },

  update: (id: number, data: { status?: SupportRequestStatus; admin_memo?: string }) =>
    fetchApi<{ success: boolean; message: string }>(
      `/api/admin/support-requests/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    ),

  getStats: async (params?: SupportRequestListParams): Promise<SupportRequestStats> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.source) searchParams.append('source', params.source);
    if (params?.academy_id) searchParams.append('academy_id', String(params.academy_id));
    if (params?.date_from) searchParams.append('date_from', params.date_from);
    if (params?.date_to) searchParams.append('date_to', params.date_to);
    const qs = searchParams.toString();
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const res = await fetch(
      `${API_URL}/api/admin/support-requests/stats${qs ? '?' + qs : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('stats fetch failed');
    return res.json();
  },
};

export const academyPaymentsApi = {
  list: (page = 1, filters?: { academy_id?: string; status?: string; date_from?: string; date_to?: string }) => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters?.academy_id) params.append('academy_id', filters.academy_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    return fetchApi<{
      transactions: PaymentTransaction[];
      summary: PaymentTransactionSummary;
      pagination: { page: number; limit: number; total: number };
    }>(`/api/admin/academy-payments?${params.toString()}`);
  },
};
