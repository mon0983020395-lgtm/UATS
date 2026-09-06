import { z } from 'zod'

export const createStudentSchema = z.object({
  student_id: z
    .string()
    .min(1, 'รหัสนิสิตต้องไม่ว่างเปล่า')
    .max(20, 'รหัสนิสิตต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[a-zA-Z0-9]+$/, 'รหัสนิสิตต้องเป็นตัวอักษรหรือตัวเลขเท่านั้น'),
  first_name: z
    .string()
    .min(1, 'ชื่อต้องไม่ว่างเปล่า')
    .max(100, 'ชื่อต้องไม่เกิน 100 ตัวอักษร'),
  last_name: z
    .string()
    .min(1, 'นามสกุลต้องไม่ว่างเปล่า')
    .max(100, 'นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
  department: z
    .string()
    .min(1, 'สาขาวิชาต้องไม่ว่างเปล่า')
    .max(150, 'สาขาวิชาต้องไม่เกิน 150 ตัวอักษร'),
  year: z
    .number()
    .int()
    .min(1, 'ชั้นปีต้องอยู่ระหว่าง 1-6')
    .max(6, 'ชั้นปีต้องอยู่ระหว่าง 1-6')
    .nullable()
    .optional(),
  email: z
    .string()
    .email('รูปแบบอีเมลไม่ถูกต้อง')
    .max(150, 'อีเมลต้องไม่เกิน 150 ตัวอักษร')
    .nullable()
    .optional(),
})

export const updateStudentSchema = createStudentSchema.partial()

export const scanSchema = z.object({
  qr_token: z.string().min(1, 'QR Token ต้องไม่ว่างเปล่า'),
})

export const manualScanSchema = z.object({
  student_id: z.string().min(1, 'รหัสนิสิตต้องไม่ว่างเปล่า'),
})

export const attendanceQuerySchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  student_id: z.string().optional(),
  name: z.string().optional(),
  department: z.string().optional(),
  scan_type: z.enum(['IN', 'OUT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const studentsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type ScanInput = z.infer<typeof scanSchema>
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>
export type StudentsQueryInput = z.infer<typeof studentsQuerySchema>