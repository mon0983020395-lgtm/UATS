import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { attendanceQuerySchema } from '@/lib/validations'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = attendanceQuerySchema.safeParse({
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      student_id: searchParams.get('student_id') || undefined,
      name: searchParams.get('name') || undefined,
      department: searchParams.get('department') || undefined,
      scan_type: searchParams.get('scan_type') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    if (!query.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 })
    }

    const { date_from, date_to, student_id, name, department, scan_type, page, limit } = query.data
    const skip = (page - 1) * limit

    const where: any = {}

    if (date_from || date_to) {
      where.scanned_at = {}
      if (date_from) where.scanned_at.gte = startOfDay(new Date(date_from))
      if (date_to) where.scanned_at.lte = endOfDay(new Date(date_to))
    }

    if (scan_type) where.scan_type = scan_type

    if (student_id || name || department) {
      where.student = {}
      if (student_id) where.student.student_id = { contains: student_id }
      if (name) {
        where.student.OR = [
          { first_name: { contains: name } },
          { last_name: { contains: name } },
        ]
      }
      if (department) where.student.department = { contains: department }
    }

    const [logs, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scanned_at: 'desc' },
        include: {
          student: {
            select: {
              student_id: true,
              first_name: true,
              last_name: true,
              department: true,
              year: true,
            },
          },
        },
      }),
      prisma.attendanceLog.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: logs,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (error) {
    console.error('[GET /api/attendance]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงประวัติ' }, { status: 500 })
  }
}
