import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { sessionId } = await context.params
    const sid = parseInt(sessionId)
    
    if (isNaN(sid)) {
      return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    await prisma.eventSession.delete({
      where: { id: sid },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/events/:id/sessions/:sessionId]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการลบช่วงเวลา' }, { status: 500 })
  }
}
