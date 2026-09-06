import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const sessionSchema = z.object({
  name: z.string().min(1, 'ระบุชื่อรอบการอบรม'),
  start_time: z.string().min(1, 'ระบุเวลาเริ่ม'),
  end_time: z.string().min(1, 'ระบุเวลาสิ้นสุด'),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const eventId = parseInt(id)
    if (isNaN(eventId)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    const sessions = await prisma.eventSession.findMany({
      where: { event_id: eventId },
      orderBy: { start_time: 'asc' },
    })

    return NextResponse.json({ success: true, data: sessions })
  } catch (error) {
    console.error('[GET /api/events/:id/sessions]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const eventId = parseInt(id)
    if (isNaN(eventId)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    const body = await request.json()
    const validation = sessionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { name, start_time, end_time } = validation.data

    const session = await prisma.eventSession.create({
      data: {
        event_id: eventId,
        name,
        start_time: new Date(start_time),
        end_time: new Date(end_time),
      },
    })

    return NextResponse.json({ success: true, data: session })
  } catch (error) {
    console.error('[POST /api/events/:id/sessions]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
