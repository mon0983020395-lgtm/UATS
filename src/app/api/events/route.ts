import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1, 'ชื่อกิจกรรมต้องไม่ว่างเปล่า').max(200),
  description: z.string().optional(),
  start_date: z.string().min(1, 'ต้องระบุวันที่เริ่มต้น'),
  end_date: z.string().min(1, 'ต้องระบุวันที่สิ้นสุด'),
  required_hours: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(false),
})

export async function GET() {
  try {
    const events = await prisma.meditationEvent.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { attendance_logs: true } },
      },
    })
    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('[GET /api/events]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = eventSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { start_date, end_date, is_active, ...rest } = validation.data

    // If setting active, deactivate others first
    if (is_active) {
      await prisma.meditationEvent.updateMany({ data: { is_active: false } })
    }

    const event = await prisma.meditationEvent.create({
      data: {
        ...rest,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_active,
      },
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/events]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
