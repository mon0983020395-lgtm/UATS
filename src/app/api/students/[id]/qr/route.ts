import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateQRCodeBuffer } from '@/lib/qr'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลนิสิต' }, { status: 404 })
    }

    const buffer = await generateQRCodeBuffer(student.qr_token)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr_${student.student_id}.png"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('[GET /api/students/:id/qr]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้าง QR Code' }, { status: 500 })
  }
}
