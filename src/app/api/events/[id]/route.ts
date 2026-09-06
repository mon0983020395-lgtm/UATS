import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  required_hours: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    const event = await prisma.meditationEvent.findUnique({
      where: { id },
      include: { _count: { select: { attendance_logs: true } } },
    })
    if (!event) return NextResponse.json({ success: false, error: 'ไม่พบกิจกรรม' }, { status: 404 })

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('[GET /api/events/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    const body = await request.json()
    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.issues[0].message }, { status: 400 })
    }

    const { start_date, end_date, is_active, ...rest } = validation.data

    if (is_active) {
      await prisma.meditationEvent.updateMany({ data: { is_active: false } })
    }

    const event = await prisma.meditationEvent.update({
      where: { id },
      data: {
        ...rest,
        ...(start_date ? { start_date: new Date(start_date) } : {}),
        ...(end_date ? { end_date: new Date(end_date) } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      },
    })

    return NextResponse.json({ success: true, data: event })
  } catch (error) {
    console.error('[PUT /api/events/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })

    await prisma.meditationEvent.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'ลบกิจกรรมสำเร็จ' })
  } catch (error) {
    console.error('[DELETE /api/events/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }
}
