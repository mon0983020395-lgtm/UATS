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

    // Check cooldown
    if (lastLog) {
      const now = new Date()
      const diff = (now.getTime() - lastLog.scanned_at.getTime()) / 1000
      if (diff < COOLDOWN_SECONDS) {
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
    const scan_type = lastLog?.scan_type === 'IN' ? 'OUT' : 'IN'

    const log = await prisma.attendanceLog.create({
      data: {
        student_id: student.id,
        scan_type,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        scan_type,
        scanned_at: log.scanned_at,
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
