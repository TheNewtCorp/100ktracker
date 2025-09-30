// Admin API service for general admin operations
class AdminApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Use the same environment variable as the main API service
    // In production, this should be set to https://one00ktracker.onrender.com/api
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://one00ktracker.onrender.com/api';

    // Load token from localStorage like the main API service
    this.token = localStorage.getItem('jwtToken');
  }

  setToken(token: string) {
    this.token = token;
    // Don't store in localStorage here since main apiService handles that
  }

  clearToken() {
    this.token = null;
  }

  // Sync token from localStorage (useful when token was set by main apiService)
  private refreshTokenFromStorage() {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken && storedToken !== this.token) {
      this.token = storedToken;
    }
  }

  private getHeaders(): HeadersInit {
    // Always check for updated token from localStorage
    this.refreshTokenFromStorage();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      ...this.getHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || errorData?.error || `HTTP ${response.status}`);
    }

    return response.json();
  } // Dashboard Statistics
  async getDashboardStats() {
    return this.request('/admin/dashboard-stats');
  }

  // Account Provisioning
  async provisionAccount(accountData: {
    email: string;
    fullName: string;
    subscriptionTier: 'free' | 'platinum' | 'operandi';
    temporaryPassword?: string;
    sendEmail?: boolean;
    promoSignupId?: number;
  }) {
    return this.request('/admin/provision-account', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
  }

  async resendInvitation(data: { username?: string; email?: string }) {
    return this.request('/admin/resend-invitation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User Management
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    subscriptionTier?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(userId: number) {
    return this.request(`/admin/users/${userId}`);
  }

  async updateUser(
    userId: number,
    userData: {
      username?: string;
      email?: string;
      subscription_tier?: string;
      subscription_status?: string;
      is_active?: boolean;
      subscription_price?: number;
      subscription_start_date?: string;
      subscription_end_date?: string;
      admin_notes?: string;
    },
  ) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: number) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: number, newPassword?: string) {
    const body = newPassword ? JSON.stringify({ newPassword }) : undefined;
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body,
    });
  }

  // Provisioning Audit Logs
  async getProvisioningAuditLogs(params?: {
    page?: number;
    limit?: number;
    email?: string;
    adminUser?: string;
    stepCompleted?: string;
    success?: boolean;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    return this.request(`/admin/audit-logs${queryString ? `?${queryString}` : ''}`);
  }

  async getProvisioningStats() {
    return this.request('/admin/provisioning-stats');
  }

  // System Health
  async checkSystemHealth() {
    return this.request('/admin/system-health');
  }

  async testEmailConfiguration() {
    return this.request('/admin/test-email');
  }

  // Promo Signups Management (for general admin)
  async getPromoSignups(params?: { status?: 'pending' | 'approved' | 'rejected'; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    return this.request(`/promo/admin/signups${queryString ? `?${queryString}` : ''}`);
  }

  async updatePromoSignupStatus(signupId: number, status: 'pending' | 'approved' | 'rejected', adminNotes?: string) {
    return this.request(`/promo/admin/signups/${signupId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes }),
    });
  }

  async createAccountFromPromoSignup(signupId: number, temporaryPassword?: string) {
    return this.request(`/promo/admin/signups/${signupId}/create-account`, {
      method: 'POST',
      body: JSON.stringify({ temporaryPassword }),
    });
  }

  // Bulk Operations
  async bulkProvisionAccounts(
    accounts: Array<{
      email: string;
      fullName: string;
      subscriptionTier: 'free' | 'platinum' | 'operandi';
    }>,
  ) {
    return this.request('/admin/bulk-provision', {
      method: 'POST',
      body: JSON.stringify({ accounts }),
    });
  }

  async exportUsers(format: 'csv' | 'json' = 'csv') {
    const response = await fetch(`${this.baseUrl}/admin/export-users?format=${format}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

// Create singleton instance
const adminApiService = new AdminApiService();

export default adminApiService;
