// Centralized API service for all backend communication
const API_BASE_URL = 'http://localhost:4000/api';

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('jwtToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('jwtToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('jwtToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth API
  async login(username: string, password: string) {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getUserInfo() {
    return await this.request('/me');
  }

  // Watches API
  async getWatches(
    params: {
      page?: number;
      limit?: number;
      brand?: string;
      status?: 'sold' | 'unsold';
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/watches${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await this.request(endpoint);
  }

  async getWatch(id: string) {
    return await this.request(`/watches/${id}`);
  }

  async createWatch(watchData: any) {
    return await this.request('/watches', {
      method: 'POST',
      body: JSON.stringify(watchData),
    });
  }

  async updateWatch(id: string, watchData: any) {
    return await this.request(`/watches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(watchData),
    });
  }

  async deleteWatch(id: string) {
    return await this.request(`/watches/${id}`, {
      method: 'DELETE',
    });
  }

  // Contacts API
  async getContacts(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/contacts${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await this.request(endpoint);
  }

  async getContact(id: string) {
    return await this.request(`/contacts/${id}`);
  }

  async createContact(contactData: any) {
    return await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(id: string, contactData: any) {
    return await this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(id: string) {
    return await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  async getContactCards(contactId: string) {
    return await this.request(`/contacts/${contactId}/cards`);
  }

  async addContactCard(contactId: string, cardData: any) {
    return await this.request(`/contacts/${contactId}/cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  async deleteContactCard(contactId: string, cardId: string) {
    return await this.request(`/contacts/${contactId}/cards/${cardId}`, {
      method: 'DELETE',
    });
  }

  // Leads API
  async getLeads(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      contact_id?: string;
      has_reminder?: boolean;
      overdue?: boolean;
    } = {},
  ) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/leads${queryParams.toString() ? `?${queryParams}` : ''}`;
    return await this.request(endpoint);
  }

  async getLeadStats() {
    return await this.request('/leads/stats');
  }

  async getLead(id: string) {
    return await this.request(`/leads/${id}`);
  }

  async createLead(leadData: any) {
    return await this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id: string, leadData: any) {
    return await this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async updateLeadStatus(id: string, status: string) {
    return await this.request(`/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteLead(id: string) {
    return await this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
