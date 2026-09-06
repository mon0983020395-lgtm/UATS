import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Papa from 'papaparse'

export async function GET(request: NextRequest) {
  try {
    const students = await prisma.student.findMany({
      orderBy: { student_id: 'asc' },
    })

    const data = students.map((s) => ({
      student_id: s.student_id,
      first_name: s.first_name,
      last_name: s.last_name,
      department: s.department,
      year: s.year ?? '',
      email: s.email ?? '',
      qr_token: s.qr_token,
      created_at: s.created_at.toISOString(),
    }))

    const csv = Papa.unparse(data, { header: true })
    // UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="students_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/export/students]', error)
    return NextResponse.json({ success: false, error: '??????????????????? Export' }, { status: 500 })
  }
}
