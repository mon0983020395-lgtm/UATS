import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateStudentSchema } from '@/lib/validations'

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

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendance_logs: {
          orderBy: { scanned_at: 'desc' },
          take: 50,
        },
      },
    })

    if (!student) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลนิสิต' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    console.error('[GET /api/students/:id]', error)
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
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const body = await request.json()
    const validation = updateStudentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    // Check student exists
    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลนิสิต' }, { status: 404 })
    }

    // Check duplicate student_id if changed
    if (validation.data.student_id && validation.data.student_id !== existing.student_id) {
      const dup = await prisma.student.findUnique({
        where: { student_id: validation.data.student_id },
      })
      if (dup) {
        return NextResponse.json(
          { success: false, error: `รหัสนิสิต ${validation.data.student_id} มีอยู่ในระบบแล้ว` },
          { status: 409 }
        )
      }
    }

    const { qr_token: _, ...updateData } = validation.data as any
    const student = await prisma.student.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: student })
  } catch (error) {
    console.error('[PUT /api/students/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await context.params
    const id = parseInt(idStr)
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'ID ไม่ถูกต้อง' }, { status: 400 })
    }

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลนิสิต' }, { status: 404 })
    }

    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'ลบข้อมูลนิสิตสำเร็จ' })
  } catch (error) {
    console.error('[DELETE /api/students/:id]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการลบข้อมูล' }, { status: 500 })
  }
}
