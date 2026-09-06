import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { th } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // Total students
    const totalStudents = await prisma.student.count()

    // Today attendees (distinct students with IN today)
    const todayAttendeesResult = await prisma.attendanceLog.groupBy({
      by: ['student_id'],
      where: {
        scan_type: 'IN',
        scanned_at: { gte: todayStart, lte: todayEnd },
      },
    })
    const todayAttendees = todayAttendeesResult.length

    // Currently inside: students whose LATEST log today is IN
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
    const currentlyInside = Number(todayLogs[0]?.count ?? 0)
    const alreadyLeft = todayAttendees - currentlyInside

    // Chart data: 7 days
    const sevenDaysAgo = startOfDay(subDays(now, 6))
    const chartRaw = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT
        DATE(scanned_at) as date,
        COUNT(DISTINCT student_id) as count
      FROM attendance_logs
      WHERE scan_type = 'IN'
        AND scanned_at >= ${sevenDaysAgo}
      GROUP BY DATE(scanned_at)
      ORDER BY date ASC
    `

    // Fill in missing days
    const chartMap = new Map(
      chartRaw.map((r) => [format(new Date(r.date), 'yyyy-MM-dd'), Number(r.count)])
    )
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const key = format(date, 'yyyy-MM-dd')
      return {
        date: key,
        count: chartMap.get(key) ?? 0,
        label: format(date, 'd MMM', { locale: th }),
      }
    })

    // Recent 10 scans
    const recentScans = await prisma.attendanceLog.findMany({
      take: 10,
      orderBy: { scanned_at: 'desc' },
      include: {
        student: {
          select: {
            student_id: true,
            first_name: true,
            last_name: true,
            department: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalStudents,
        todayAttendees,
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
