import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const groups = await prisma.student.findMany({
      where: { group: { not: null } },
      select: { group: true },
      distinct: ['group'],
      orderBy: { group: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: groups.map(g => g.group)
    })
  } catch (error) {
    console.error('[GET /api/groups]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลกลุ่ม' }, { status: 500 })
  }
}
