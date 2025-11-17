import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  LoginCredentials, 
  AuthResponse, 
  User, 
  ImportResponse,
  PendingSubmissionsResponse,
  DepartmentSubmissionsResponse,
  ApiResponse,
  ReportFilesResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://nxtwave-assignment-e5qv.vercel.app/api';
///sdsdf
class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data.user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Import APIs
  async importEmployees(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<ImportResponse>('/import/employees', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async importSubmissions(file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post<ImportResponse>('/import/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // HOD APIs
  async getDepartmentSubmissions(departmentId: string, period: string): Promise<DepartmentSubmissionsResponse> {
    const response = await this.api.get<DepartmentSubmissionsResponse>(
      `/departments/${departmentId}/submissions`,
      { params: { period } }
    );
    return response.data;
  }

  async submitDepartmentAggregate(
    departmentId: string,
    data: {
      period: string;
      items?: Array<{ product: string; percentage: number; notes?: string }>;
      auto_aggregate?: boolean;
      notes?: string;
    }
  ): Promise<ApiResponse> {
    const response = await this.api.post<ApiResponse>(
      `/departments/${departmentId}/aggregate`,
      data
    );
    return response.data;
  }

  async updateEmployeeSubmission(
    submissionRef: string,
    data: {
      items?: Array<{
        product: string;
        percentage: number;
        notes?: string;
      }>;
      status?: 'pending' | 'approved';
    }
  ): Promise<ApiResponse> {
    const response = await this.api.patch<ApiResponse>(
      `/departments/employee_submissions/${submissionRef}`,
      data
    );
    return response.data;
  }

  // Admin APIs
  async getPendingSubmissions(period?: string, status?: string): Promise<PendingSubmissionsResponse> {
    const response = await this.api.get<PendingSubmissionsResponse>('/admin/pending', {
      params: { period, status },
    });
    return response.data;
  }

  async reviewSubmission(
    submissionId: string,
    data: {
      status: 'approved' | 'rejected';
      rejection_reason?: string;
      items?: Array<{ product: string; percentage: number; notes?: string }>;
    }
  ): Promise<ApiResponse> {
    const response = await this.api.patch<ApiResponse>(
      `/admin/department_submissions/${submissionId}`,
      data
    );
    return response.data;
  }

  async previewMasterReport(period: string): Promise<ApiResponse> {
    const response = await this.api.get<ApiResponse>(`/admin/reports/master/${period}`);
    return response.data;
  }

  async publishMasterReport(period: string, overwrite: boolean = true): Promise<{
    success: boolean;
    files?: { json: string; csv: string };
    data?: any;
    [key: string]: any;
  }> {
    const response = await this.api.post<{
      success: boolean;
      files?: { json: string; csv: string };
      data?: any;
      [key: string]: any;
    }>('/admin/publish', {
      period,
      overwrite,
    });
    return response.data;
  }

  async listReportFiles(): Promise<ReportFilesResponse> {
    const response = await this.api.get<ReportFilesResponse>('/admin/reports/files');
    return response.data;
  }

  async getReportFile(fileName: string): Promise<{
    success: boolean;
    fileName: string;
    content: any;
  }> {
    const response = await this.api.get<{
      success: boolean;
      fileName: string;
      content: any;
    }>(`/admin/reports/file/${fileName}`);
    return response.data;
  }


  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await this.api.get<ApiResponse>('/health');
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;

