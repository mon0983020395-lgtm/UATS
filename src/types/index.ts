export type ScanType = 'IN' | 'OUT'

export interface Student {
  id: number
  student_id: string
  first_name: string
  last_name: string
  department: string
  year: number | null
  email: string | null
  qr_token: string
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: number
  student_id: number
  scan_type: ScanType
  scanned_at: string
  student?: Student
}

export interface DashboardStats {
  totalStudents: number
  todayAttendees: number
  currentlyInside: number
  alreadyLeft: number
  chartData: ChartDataPoint[]
  recentScans: RecentScan[]
}

export interface ChartDataPoint {
  date: string
  count: number
  label: string
}

export interface RecentScan {
  id: number
  scan_type: ScanType
  scanned_at: string
  student: {
    student_id: string
    first_name: string
    last_name: string
    department: string
  }
}

export interface ScanResult {
  scan_type: ScanType
  scanned_at: string
  student: {
    student_id: string
    first_name: string
    last_name: string
    department: string
    year: number | null
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ImportResult {
  success: number
  failed: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  student_id: string
  error: string
}