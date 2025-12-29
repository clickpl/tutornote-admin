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

// System
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
};
