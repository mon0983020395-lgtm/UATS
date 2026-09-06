import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id') ? parseInt(searchParams.get('event_id')!) : null

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'ต้องระบุ event_id' }, { status: 400 })
    }

    // 1. Get all sessions for this event, ordered by start_time
    const sessions = await prisma.eventSession.findMany({
      where: { event_id: eventId },
      orderBy: { start_time: 'asc' }
    })

    if (sessions.length === 0) {
      return NextResponse.json({ success: true, data: { sessions: [], students: [] } })
    }

    // 2. Get all students (In a real app, only registered students. Here we fetch all or just those who have some log)
    // For now, fetch students who have at least one log in this event
    const studentsWithLogs = await prisma.attendanceLog.findMany({
      where: { event_id: eventId },
      select: { student_id: true },
      distinct: ['student_id']
    })
    
    const studentIds = studentsWithLogs.map(s => s.student_id)

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      orderBy: { student_id: 'asc' }
    })

    // 3. Get all logs for these sessions
    const logs = await prisma.attendanceLog.findMany({
      where: {
        event_id: eventId,
        scan_type: 'IN' // We only care about IN for attendance presence
      }
    })

    // 4. Map logs to students and sessions
    // Structure: student.attendance[sessionId] = { status: 'PRESENT' | 'LATE' }
    const matrixData = students.map(st => {
      const attendanceMap: Record<number, { status: string }> = {}
      
      sessions.forEach(sess => {
        // Find if student has IN log for this session
        const log = logs.find(l => l.student_id === st.id && l.session_id === sess.id)
        if (log) {
          attendanceMap[sess.id] = { status: log.is_late ? 'LATE' : 'PRESENT' }
        } else {
          attendanceMap[sess.id] = { status: 'ABSENT' }
        }
      })

      return {
        id: st.id,
        student_id: st.student_id,
        first_name: st.first_name,
        last_name: st.last_name,
        department: st.department,
        attendance: attendanceMap
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        students: matrixData
      }
    })
  } catch (error) {
    console.error('[GET /api/report/matrix]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล Matrix' }, { status: 500 })
  }
}
