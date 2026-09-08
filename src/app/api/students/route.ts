import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createStudentSchema, studentsQuerySchema } from '@/lib/validations'
import { generateQRCodeDataURL } from '@/lib/qr'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = studentsQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      group: searchParams.get('group') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    if (!query.success) {
      return NextResponse.json({ success: false, error: 'Invalid query parameters' }, { status: 400 })
    }

    const { search, group, page, limit } = query.data
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { student_id: { contains: search } },
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { department: { contains: search } },
      ]
    }

    if (group) {
      where.group = group
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          attendance_logs: {
            orderBy: { scanned_at: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.student.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: students,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/students]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createStudentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check duplicate student_id
    const existing = await prisma.student.findUnique({
      where: { student_id: data.student_id },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: `รหัสนิสิต ${data.student_id} มีอยู่ในระบบแล้ว` },
        { status: 409 }
      )
    }

    const qr_token = uuidv4()
    const student = await prisma.student.create({
      data: { ...data, qr_token },
    })

    const qrCodeDataURL = await generateQRCodeDataURL(qr_token)

    return NextResponse.json(
      { success: true, data: { student, qrCodeDataURL } },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/students]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 })
  }
}
