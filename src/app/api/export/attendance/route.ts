import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Papa from 'papaparse'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const where: any = {}
    if (date_from || date_to) {
      where.scanned_at = {}
      if (date_from) where.scanned_at.gte = new Date(date_from)
      if (date_to) where.scanned_at.lte = new Date(date_to + 'T23:59:59')
    }

    const logs = await prisma.attendanceLog.findMany({
      where,
      orderBy: { scanned_at: 'desc' },
      include: {
        student: {
          select: { student_id: true, first_name: true, last_name: true, department: true },
        },
      },
    })

    const data = logs.map((log) => ({
      student_id: log.student.student_id,
      first_name: log.student.first_name,
      last_name: log.student.last_name,
      department: log.student.department,
      scan_type: log.scan_type === 'IN' ? '????' : '???',
      scanned_at: format(log.scanned_at, 'dd/MM/yyyy HH:mm:ss', { locale: th }),
    }))

    const csv = Papa.unparse(data, { header: true })
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/export/attendance]', error)
    return NextResponse.json({ success: false, error: '??????????????????? Export' }, { status: 500 })
  }
}
