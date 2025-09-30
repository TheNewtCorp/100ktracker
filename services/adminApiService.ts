// Admin API service for general admin operations
class AdminApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Use the same environment variable as the main API service
    // In production, this should be set to https://one00ktracker.onrender.com/api
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://one00ktracker.onrender.com/api';
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || errorData?.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Dashboard Statistics
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
      email?: string;
      subscription_tier?: string;
      is_active?: boolean;
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

  async resetUserPassword(userId: number) {
    return this.request(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
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
