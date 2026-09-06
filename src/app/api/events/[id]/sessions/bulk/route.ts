import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, addDays, differenceInDays } from 'date-fns'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventId = parseInt(id)
    if (isNaN(eventId)) {
      return NextResponse.json({ success: false, error: 'ID กิจกรรมไม่ถูกต้อง' }, { status: 400 })
    }

    const body = await request.json()
    const { startDate, endDate, templates } = body

    if (!startDate || !endDate || !templates || !Array.isArray(templates)) {
      return NextResponse.json({ success: false, error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = differenceInDays(end, start) + 1

    if (days <= 0 || days > 30) {
      return NextResponse.json({ success: false, error: 'ช่วงวันไม่ถูกต้อง หรือมากเกินไป (สูงสุด 30 วัน)' }, { status: 400 })
    }

    const newSessions = []

    for (let i = 0; i < days; i++) {
      const currentDate = addDays(start, i)
      const dateString = currentDate.toISOString().split('T')[0] // yyyy-MM-dd

      for (const t of templates) {
        // t.start_time is like "04:00"
        const sessionStart = new Date(`${dateString}T${t.start_time}:00`)
        let sessionEnd = new Date(`${dateString}T${t.end_time}:00`)
        
        // Handle cross-day sessions (e.g. 23:00 to 01:00)
        if (sessionEnd < sessionStart) {
          sessionEnd = addDays(sessionEnd, 1)
        }

        newSessions.push({
          event_id: eventId,
          name: t.name,
          start_time: sessionStart,
          end_time: sessionEnd
        })
      }
    }

    const created = await prisma.eventSession.createMany({
      data: newSessions,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      message: `สร้างสำเร็จ ${created.count} รอบ`,
      data: { count: created.count }
    })
  } catch (error) {
    console.error('[POST /api/events/[id]/sessions/bulk]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างรอบอัตโนมัติ' }, { status: 500 })
  }
}
