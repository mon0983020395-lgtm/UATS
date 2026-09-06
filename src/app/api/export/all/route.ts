import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const [students, attendanceLogs] = await Promise.all([
      prisma.student.findMany({ orderBy: { student_id: 'asc' } }),
      prisma.attendanceLog.findMany({
        orderBy: { scanned_at: 'desc' },
        include: {
          student: { select: { student_id: true } },
        },
      }),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      students: students.map((s) => ({ ...s, created_at: s.created_at.toISOString(), updated_at: s.updated_at.toISOString() })),
      attendance_logs: attendanceLogs.map((l) => ({
        ...l,
        scanned_at: l.scanned_at.toISOString(),
        student: undefined,
        student_code: l.student.student_id,
      })),
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="meditation_attendance_${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/export/all]', error)
    return NextResponse.json({ success: false, error: '??????????????????? Export' }, { status: 500 })
  }
}
