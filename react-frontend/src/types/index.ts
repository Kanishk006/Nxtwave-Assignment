// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'hod';
  department_id?: {
    _id: string;
    name: string;
  };
  createdAt?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Employee Types
export interface Employee {
  id: string;
  emp_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  department_id: {
    _id: string;
    name: string;
  };
  role?: string;
  location?: string;
  status?: string;
}

// Employee Submission Types
export interface EmployeeSubmissionItem {
  product: 'Academy' | 'Intensive' | 'NIAT';
  percentage: number;
  notes?: string;
}

export interface EmployeeSubmission {
  submission_ref: string;
  employee: {
    emp_id: string;
    name: string;
    email?: string;
  };
  items: EmployeeSubmissionItem[];
  status: 'pending' | 'approved';
}

// Department Submission Types
export interface DepartmentSubmissionItem {
  product: 'Academy' | 'Intensive' | 'NIAT';
  percentage: number;
  notes?: string;
}

export interface DepartmentSubmission {
  id: string;
  dept_submission_ref: string;
  department: string;
  period: string;
  status: 'submitted' | 'approved' | 'rejected';
  items: DepartmentSubmissionItem[];
  notes?: string;
  submitted_by: {
    name: string;
    email: string;
  };
  submitted_at: string;
  approved_at?: string;
  rejection_reason?: string;
}

// Import Types
export interface ImportResponse {
  success: boolean;
  message: string;
  imported: number;
  updated?: number;
  skipped?: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PendingSubmissionsResponse {
  success: boolean;
  count: number;
  submissions: DepartmentSubmission[];
}

export interface DepartmentSubmissionsResponse {
  success: boolean;
  department_id: string;
  period: string;
  submissions: EmployeeSubmission[];
}

// Report Types
export interface ReportFile {
  fileName: string;
  content?: any;
}

export interface ReportFilesResponse {
  success: boolean;
  count: number;
  files: string[];
}

