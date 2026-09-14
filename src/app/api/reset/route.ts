import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const confirmation = body.confirmation

    if (confirmation !== 'ยืนยันลบ') {
      return NextResponse.json(
        { success: false, error: 'กรุณาพิมพ์ "ยืนยันลบ" เพื่อยืนยันการล้างข้อมูลทั้งหมด' },
        { status: 400 }
      )
    }

    // Delete in order (FK constraint)
    const deletedLogs = await prisma.attendanceLog.deleteMany()
    const deletedStudents = await prisma.student.deleteMany()

    return NextResponse.json({
      success: true,
      message: 'ล้างข้อมูลทั้งหมดสำเร็จ',
      data: {
        deletedStudents: deletedStudents.count,
        deletedLogs: deletedLogs.count,
      },
    })
  } catch (error) {
    console.error('[DELETE /api/reset]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการล้างข้อมูล' }, { status: 500 })
  }
}
