import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

// GET /api/report/session?date=YYYY-MM-DD&event_id=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!) : null
    const sessionId = searchParams.get('session_id') ? parseInt(searchParams.get('session_id')!) : null

    const targetDate = dateStr ? parseISO(dateStr) : new Date()
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    // Get all students
    const allStudents = await prisma.student.findMany({
      orderBy: [{ year: 'asc' }, { department: 'asc' }, { student_id: 'asc' }],
    })

    // Get all logs for that day (or event date range)
    let logsWhere: any = {
      scanned_at: { gte: dayStart, lte: dayEnd },
    }
    if (eventId) logsWhere.event_id = eventId
    if (sessionId) logsWhere.session_id = sessionId

    const logs = await prisma.attendanceLog.findMany({
      where: logsWhere,
      include: { student: true },
      orderBy: { scanned_at: 'asc' },
    })

    // Group by student
    const studentLogMap = new Map<number, typeof logs>()
    for (const log of logs) {
      if (!studentLogMap.has(log.student_id)) {
        studentLogMap.set(log.student_id, [])
      }
      studentLogMap.get(log.student_id)!.push(log)
    }

    // Build attendance list
    const attendanceList = allStudents.map(student => {
      const studentLogs = studentLogMap.get(student.id) || []
      const firstIn = studentLogs.find(l => l.scan_type === 'IN')
      const lastOut = [...studentLogs].reverse().find(l => l.scan_type === 'OUT')
      const attended = studentLogs.some(l => l.scan_type === 'IN')
      const is_late = firstIn?.is_late ?? false

      let duration_minutes = 0
      if (firstIn && lastOut) {
        duration_minutes = Math.floor((lastOut.scanned_at.getTime() - firstIn.scanned_at.getTime()) / 60000)
      }

      return {
        student,
        attended,
        first_in: firstIn?.scanned_at ?? null,
        last_out: lastOut?.scanned_at ?? null,
        duration_minutes,
        scan_count: studentLogs.length,
        is_late,
      }
    })

    const attended = attendanceList.filter(a => a.attended)
    const absent = attendanceList.filter(a => !a.attended)
    const attendance_rate = allStudents.length > 0
      ? Math.round((attended.length / allStudents.length) * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        summary: {
          total: allStudents.length,
          attended: attended.length,
          absent: absent.length,
          attendance_rate,
        },
        attendance_list: attendanceList,
      },
    })
  } catch (error) {
    console.error('[GET /api/report/session]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
