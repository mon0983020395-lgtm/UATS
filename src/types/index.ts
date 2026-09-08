export type ScanType = 'IN' | 'OUT'

export interface Student {
  id: number
  student_id: string
  first_name: string
  last_name: string
  department: string
  year: number | null
  group: string | null
  email: string | null
  qr_token: string
  created_at: string
  updated_at: string
}

export interface EventSession {
  id: number
  event_id: number
  name: string
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export interface MeditationEvent {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  required_hours: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: number
  student_id: number
  scan_type: ScanType
  scanned_at: string
  event_id: number | null
  session_id: number | null
  is_late: boolean
  student?: Student
  event?: MeditationEvent
  session?: EventSession
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
  is_late: boolean
  event?: { id: number; name: string } | null
  session?: { id: number; name: string } | null
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