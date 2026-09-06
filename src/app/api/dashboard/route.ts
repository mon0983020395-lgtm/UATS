import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { th } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!) : null
    const sessionId = searchParams.get('session_id') ? parseInt(searchParams.get('session_id')!) : null

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // Base query conditions
    let attendeesWhere: any = { scan_type: 'IN' }
    let latestLogsWhere: any = {}
    let recentScansWhere: any = {}
    let chartCondition = ''

    if (sessionId) {
      attendeesWhere.session_id = sessionId
      latestLogsWhere = { session_id: sessionId }
      recentScansWhere = { session_id: sessionId }
    } else if (eventId) {
      attendeesWhere.event_id = eventId
      latestLogsWhere = { event_id: eventId }
      recentScansWhere = { event_id: eventId }
    } else {
      attendeesWhere.scanned_at = { gte: todayStart, lte: todayEnd }
      latestLogsWhere = { scanned_at: { gte: todayStart, lte: todayEnd } }
      // Global view usually shows today's recent scans or just general recent
    }

    // Total students (Global = all students, Event = all students for now until we have registration)
    const totalStudents = await prisma.student.count()

    // Attendees
    const attendeesResult = await prisma.attendanceLog.groupBy({
      by: ['student_id'],
      where: attendeesWhere,
    })
    const attendeesCount = attendeesResult.length

    // Currently inside (latest log in the scoped context is IN)
    let currentlyInside = 0
    if (sessionId || eventId) {
      // Use Prisma to find latest log per student for the specific event/session
      const allLogs = await prisma.attendanceLog.findMany({
        where: latestLogsWhere,
        orderBy: { scanned_at: 'desc' }
      })
      
      const latestLogsMap = new Map()
      allLogs.forEach(log => {
        if (!latestLogsMap.has(log.student_id)) {
          latestLogsMap.set(log.student_id, log)
        }
      })
      
      currentlyInside = Array.from(latestLogsMap.values()).filter(l => l.scan_type === 'IN').length
    } else {
      // Global (today)
      const todayLogs = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM (
          SELECT al.student_id, al.scan_type
          FROM attendance_logs al
          INNER JOIN (
            SELECT student_id, MAX(id) as max_id
            FROM attendance_logs
            WHERE scanned_at >= ${todayStart} AND scanned_at <= ${todayEnd}
            GROUP BY student_id
          ) latest ON al.id = latest.max_id
        ) last_logs
        WHERE last_logs.scan_type = 'IN'
      `
      currentlyInside = Number(todayLogs[0]?.count ?? 0)
    }

    const alreadyLeft = attendeesCount - currentlyInside

    // Chart Data
    let chartData: { date: string; count: number; label: string }[] = []
    if (eventId) {
      // Show chart data grouped by session or day for the event
      const event = await prisma.meditationEvent.findUnique({ where: { id: eventId } })
      if (event) {
        const rawChart = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
          SELECT DATE(scanned_at) as date, COUNT(DISTINCT student_id) as count
          FROM attendance_logs
          WHERE scan_type = 'IN' AND event_id = ${eventId}
          GROUP BY DATE(scanned_at)
          ORDER BY date ASC
        `
        chartData = rawChart.map(r => ({
          date: format(new Date(r.date), 'yyyy-MM-dd'),
          count: Number(r.count),
          label: format(new Date(r.date), 'd MMM', { locale: th })
        }))
      }
    } else {
      // Global 7-day chart
      const sevenDaysAgo = startOfDay(subDays(now, 6))
      const chartRaw = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(scanned_at) as date, COUNT(DISTINCT student_id) as count
        FROM attendance_logs
        WHERE scan_type = 'IN' AND scanned_at >= ${sevenDaysAgo}
        GROUP BY DATE(scanned_at)
        ORDER BY date ASC
      `
      const chartMap = new Map(chartRaw.map((r) => [format(new Date(r.date), 'yyyy-MM-dd'), Number(r.count)]))
      chartData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i)
        const key = format(date, 'yyyy-MM-dd')
        return {
          date: key,
          count: chartMap.get(key) ?? 0,
          label: format(date, 'd MMM', { locale: th }),
        }
      })
    }

    // Recent 10 scans
    const recentScans = await prisma.attendanceLog.findMany({
      where: recentScansWhere,
      take: 10,
      orderBy: { scanned_at: 'desc' },
      include: {
        student: { select: { student_id: true, first_name: true, last_name: true, department: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        todayAttendees: attendeesCount, // renaming the key to keep frontend compatible
        currentlyInside,
        alreadyLeft,
        chartData,
        recentScans,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard' }, { status: 500 })
  }
}
