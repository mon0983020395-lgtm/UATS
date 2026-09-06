import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/report/group?event_id=&year=&department=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!) : null
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null
    const department = searchParams.get('department') || null

    // Get event
    let event = null
    let dateFilter: any = {}

    if (eventId) {
      event = await prisma.meditationEvent.findUnique({ where: { id: eventId } })
    } else {
      event = await prisma.meditationEvent.findFirst({ where: { is_active: true } })
    }

    if (event) {
      dateFilter = { scanned_at: { gte: event.start_date, lte: event.end_date } }
    }

    // Build student filter
    const studentWhere: any = {}
    if (year) studentWhere.year = year
    if (department) studentWhere.department = { contains: department }

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        attendance_logs: {
          where: { scan_type: 'IN', ...dateFilter },
          orderBy: { scanned_at: 'asc' },
        },
      },
      orderBy: [{ year: 'asc' }, { department: 'asc' }, { student_id: 'asc' }],
    })

    // Calculate hours for each student
    const studentReports = await Promise.all(students.map(async (student) => {
      // Get full logs (IN+OUT) for duration calculation
      const allLogs = await prisma.attendanceLog.findMany({
        where: { student_id: student.id, ...dateFilter },
        orderBy: { scanned_at: 'asc' },
      })

      let totalMinutes = 0
      let currentIn: Date | null = null
      for (const log of allLogs) {
        if (log.scan_type === 'IN') {
          currentIn = log.scanned_at
        } else if (log.scan_type === 'OUT' && currentIn) {
          totalMinutes += Math.floor((log.scanned_at.getTime() - currentIn.getTime()) / 60000)
          currentIn = null
        }
      }

      const total_hours = Math.round((totalMinutes / 60) * 100) / 100
      const days_attended = new Set(student.attendance_logs.map(l => l.scanned_at.toISOString().split('T')[0])).size
      const passed = event ? total_hours >= event.required_hours : false

      return {
        student: {
          id: student.id,
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          department: student.department,
          year: student.year,
          email: student.email,
        },
        days_attended,
        total_hours,
        passed,
      }
    }))

    // Group by year & department
    const byYear: Record<string, typeof studentReports> = {}
    const byDepartment: Record<string, typeof studentReports> = {}

    for (const r of studentReports) {
      const y = String(r.student.year ?? 'ไม่ระบุ')
      const d = r.student.department
      if (!byYear[y]) byYear[y] = []
      if (!byDepartment[d]) byDepartment[d] = []
      byYear[y].push(r)
      byDepartment[d].push(r)
    }

    const yearSummary = Object.entries(byYear).map(([year, items]) => ({
      year,
      total: items.length,
      passed: items.filter(i => i.passed).length,
      pass_rate: Math.round((items.filter(i => i.passed).length / items.length) * 100),
    }))

    const departmentSummary = Object.entries(byDepartment).map(([department, items]) => ({
      department,
      total: items.length,
      passed: items.filter(i => i.passed).length,
      pass_rate: Math.round((items.filter(i => i.passed).length / items.length) * 100),
    }))

    return NextResponse.json({
      success: true,
      data: {
        event,
        overall: {
          total: studentReports.length,
          passed: studentReports.filter(r => r.passed).length,
          pass_rate: studentReports.length > 0
            ? Math.round((studentReports.filter(r => r.passed).length / studentReports.length) * 100)
            : 0,
        },
        year_summary: yearSummary.sort((a, b) => a.year.localeCompare(b.year)),
        department_summary: departmentSummary,
        students: studentReports,
      },
    })
  } catch (error) {
    console.error('[GET /api/report/group]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
