import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { scanSchema, manualScanSchema } from '@/lib/validations'

const COOLDOWN_SECONDS = parseInt(process.env.SCAN_COOLDOWN_SECONDS || '30')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Support both qr_token (from scanner) and student_id (manual entry)
    let student

    if (body.qr_token) {
      const validation = scanSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0].message },
          { status: 400 }
        )
      }
      student = await prisma.student.findUnique({
        where: { qr_token: validation.data.qr_token },
      })
    } else if (body.student_id) {
      const validation = manualScanSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { success: false, error: validation.error.issues[0].message },
          { status: 400 }
        )
      }
      student = await prisma.student.findUnique({
        where: { student_id: validation.data.student_id },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'ต้องระบุ qr_token หรือ student_id' },
        { status: 400 }
      )
    }

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบข้อมูลนิสิตในระบบ' },
        { status: 404 }
      )
    }

    // Get latest attendance log
    const lastLog = await prisma.attendanceLog.findFirst({
      where: { student_id: student.id },
      orderBy: { scanned_at: 'desc' },
    })

    // Check cooldown (only within same day to prevent cross-day blocking)
    if (lastLog) {
      const now = new Date()
      const diff = (now.getTime() - lastLog.scanned_at.getTime()) / 1000
      const sameDay =
        lastLog.scanned_at.toDateString() === now.toDateString()

      if (sameDay && diff < COOLDOWN_SECONDS) {
        const remaining = Math.ceil(COOLDOWN_SECONDS - diff)
        return NextResponse.json(
          {
            success: false,
            error: `กรุณารอ ${remaining} วินาที ก่อนสแกนอีกครั้ง`,
            data: { cooldown: true, remaining },
          },
          { status: 429 }
        )
      }
    }

    // 1. Find active event to associate with this scan
    const now = new Date()
    const activeEvent = await prisma.meditationEvent.findFirst({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    })

    // 2. Find active session for this event (allowing scan 30 mins before start and 30 mins after end)
    let activeSession = null
    let is_late = false
    
    if (activeEvent) {
      activeSession = await prisma.eventSession.findFirst({
        where: {
          event_id: activeEvent.id,
          start_time: { lte: new Date(now.getTime() + 30 * 60000) },
          end_time: { gte: new Date(now.getTime() - 30 * 60000) },
        },
        orderBy: { start_time: 'asc' } // prioritize earlier session if overlap
      })
    }

    // 3. Determine scan type: Strict Session Binding & Auto-Checkout
    let scan_type: 'IN' | 'OUT' = 'IN'

    if (activeSession) {
      // Get logs SPECIFICALLY for the active session
      const sessionLogs = await prisma.attendanceLog.findMany({
        where: { student_id: student.id, session_id: activeSession.id },
        orderBy: { scanned_at: 'desc' },
        take: 1
      })
      
      const currentSessionLastLog = sessionLogs[0]
      
      if (currentSessionLastLog?.scan_type === 'IN') {
        scan_type = 'OUT'
      } else {
        scan_type = 'IN'
      }

      // Auto-Checkout Logic: 
      // If we are scanning IN for a NEW session, but the global absolute last log is still IN 
      // (meaning they forgot to scan OUT of the previous session), we auto-close it.
      if (scan_type === 'IN' && lastLog && lastLog.scan_type === 'IN' && lastLog.session_id !== activeSession.id) {
        // Fetch the old session to get its end time
        let oldSessionEndTime = now
        if (lastLog.session_id) {
          const oldSession = await prisma.eventSession.findUnique({ where: { id: lastLog.session_id } })
          if (oldSession) {
            oldSessionEndTime = oldSession.end_time
          }
        }

        await prisma.attendanceLog.create({
          data: {
            student_id: student.id,
            scan_type: 'OUT',
            event_id: lastLog.event_id,
            session_id: lastLog.session_id,
            scanned_at: oldSessionEndTime, // Set checkout time to the end of that old session
          }
        })
        console.log(`[Auto-Checkout] Closed orphaned IN for student ${student.student_id} in session ${lastLog.session_id}`)
      }

      // Calculate "Late" if scanning IN and it's 15+ minutes past session start_time
      if (scan_type === 'IN') {
        const gracePeriodEnd = new Date(activeSession.start_time.getTime() + 15 * 60000)
        if (now > gracePeriodEnd) {
          is_late = true
        }
      }
    } else {
      // Fallback for global scans (no active session)
      if (lastLog?.scan_type === 'IN') {
        scan_type = 'OUT'
      } else {
        scan_type = 'IN'
      }
    }

    const log = await prisma.attendanceLog.create({
      data: {
        student_id: student.id,
        scan_type,
        // Link to active event and session if they exist
        ...(activeEvent ? { event_id: activeEvent.id } : {}),
        ...(activeSession ? { session_id: activeSession.id, is_late } : {}),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        scan_type,
        scanned_at: log.scanned_at,
        is_late,
        event: activeEvent ? { id: activeEvent.id, name: activeEvent.name } : null,
        session: activeSession ? { id: activeSession.id, name: activeSession.name } : null,
        student: {
          student_id: student.student_id,
          first_name: student.first_name,
          last_name: student.last_name,
          department: student.department,
          year: student.year,
        },
      },
    })
  } catch (error) {
    console.error('[POST /api/scan]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการสแกน' }, { status: 500 })
  }
}

