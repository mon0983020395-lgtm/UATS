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

    // Determine scan type: IN/OUT toggle
    // If last log was IN → next is OUT, otherwise IN
    // Special case: if last log was yesterday's OUT → today starts fresh with IN
    let scan_type: 'IN' | 'OUT'
    if (lastLog?.scan_type === 'IN') {
      scan_type = 'OUT'
    } else {
      scan_type = 'IN'
    }

    // Find active event to associate with this scan
    const now = new Date()
    const activeEvent = await prisma.meditationEvent.findFirst({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
      },
    })

    // Find active session for this event (allowing scan 30 mins before start and 30 mins after end)
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

      // Calculate "Late" if scanning IN and it's 15+ minutes past session start_time
      if (activeSession && scan_type === 'IN') {
        const gracePeriodEnd = new Date(activeSession.start_time.getTime() + 15 * 60000)
        if (now > gracePeriodEnd) {
          is_late = true
        }
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

