import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

// GET /api/report/student/[id]?event_id=
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!) : null

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) return NextResponse.json({ success: false, error: 'ไม่พบนิสิต' }, { status: 404 })

    // Build where clause
    let where: any = { student_id: id }
    if (eventId) {
      where.event_id = eventId
    } else {
      // Get active event's date range if no event specified
      const activeEvent = await prisma.meditationEvent.findFirst({ where: { is_active: true } })
      if (activeEvent) {
        where.scanned_at = { gte: activeEvent.start_date, lte: activeEvent.end_date }
      }
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      orderBy: { scanned_at: 'asc' },
    })

    // Calculate session pairs (IN → OUT)
    const sessions: { in: Date; out: Date | null; duration_minutes: number }[] = []
    let currentIn: Date | null = null
    let totalMinutes = 0

    for (const log of logs) {
      if (log.scan_type === 'IN') {
        currentIn = log.scanned_at
      } else if (log.scan_type === 'OUT' && currentIn) {
        const duration = Math.floor((log.scanned_at.getTime() - currentIn.getTime()) / 60000)
        sessions.push({ in: currentIn, out: log.scanned_at, duration_minutes: duration })
        totalMinutes += duration
        currentIn = null
      }
    }
    // Unclosed IN session
    if (currentIn) {
      sessions.push({ in: currentIn, out: null, duration_minutes: 0 })
    }

    // Days attended (distinct dates with IN)
    const inLogs = logs.filter(l => l.scan_type === 'IN')
    const daysAttended = new Set(inLogs.map(l => l.scanned_at.toISOString().split('T')[0])).size

    // Get event info
    let event = null
    let passed = false
    if (eventId) {
      event = await prisma.meditationEvent.findUnique({ where: { id: eventId } })
    } else {
      event = await prisma.meditationEvent.findFirst({ where: { is_active: true } })
    }

    const totalHours = totalMinutes / 60
    if (event) {
      passed = totalHours >= event.required_hours
    }

    // Daily summary for timeline
    const dailySummary = Object.entries(
      inLogs.reduce((acc, log) => {
        const day = log.scanned_at.toISOString().split('T')[0]
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      success: true,
      data: {
        student,
        event,
        summary: {
          total_sessions: sessions.filter(s => s.out !== null).length,
          days_attended: daysAttended,
          total_minutes: totalMinutes,
          total_hours: Math.round(totalHours * 100) / 100,
          passed,
          required_hours: event?.required_hours ?? 0,
        },
        sessions,
        daily_summary: dailySummary,
        logs,
      },
    })
  } catch (error) {
    console.error('[GET /api/report/student/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
