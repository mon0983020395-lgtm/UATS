import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import Papa from 'papaparse'

interface ImportRow {
  student_id: string
  first_name: string
  last_name: string
  department: string
  group?: string
  year?: string
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = (formData.get('mode') as string) || 'skip' // 'skip' | 'update'

    if (!file) {
      return NextResponse.json({ success: false, error: 'ไม่พบไฟล์' }, { status: 400 })
    }

    const text = await file.text()
    let rows: ImportRow[] = []

    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text)
        rows = Array.isArray(data) ? data : data.students || []
      } catch {
        return NextResponse.json({ success: false, error: 'ไฟล์ JSON ไม่ถูกต้อง' }, { status: 400 })
      }
    } else {
      const parsed = Papa.parse<ImportRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
      })
      rows = parsed.data
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'ไม่พบข้อมูลในไฟล์' }, { status: 400 })
    }

    const errors: { row: number; student_id: string; error: string }[] = []
    let successCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Excel row (1=header, data starts at 2)

      if (!row.student_id || !row.first_name || !row.last_name || !row.department) {
        errors.push({
          row: rowNum,
          student_id: row.student_id || '?',
          error: 'ข้อมูลไม่ครบถ้วน (ต้องมี student_id, first_name, last_name, department)',
        })
        continue
      }

      const year = row.year ? parseInt(String(row.year)) : null
      if (row.year && (isNaN(year!) || year! < 1 || year! > 6)) {
        errors.push({ row: rowNum, student_id: row.student_id, error: 'ชั้นปีต้องเป็นตัวเลข 1-6' })
        continue
      }

      try {
        const existing = await prisma.student.findUnique({
          where: { student_id: String(row.student_id).trim() },
        })

        if (existing) {
          if (mode === 'update') {
            await prisma.student.update({
              where: { student_id: String(row.student_id).trim() },
              data: {
                first_name: String(row.first_name).trim(),
                last_name: String(row.last_name).trim(),
                department: String(row.department).trim(),
                group: row.group ? String(row.group).trim() : null,
                year,
                email: row.email ? String(row.email).trim() : null,
              },
            })
            successCount++
          } else {
            errors.push({ row: rowNum, student_id: row.student_id, error: 'มีรหัสนิสิตนี้แล้ว (ข้ามการทำงาน)' })
          }
        } else {
          await prisma.student.create({
            data: {
              student_id: String(row.student_id).trim(),
              first_name: String(row.first_name).trim(),
              last_name: String(row.last_name).trim(),
              department: String(row.department).trim(),
              group: row.group ? String(row.group).trim() : null,
              year,
              email: row.email ? String(row.email).trim() : null,
              qr_token: uuidv4(),
            },
          })
          successCount++
        }
      } catch (err) {
        errors.push({ row: rowNum, student_id: row.student_id, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
      }
    }

    return NextResponse.json({
      success: true,
      data: { success: successCount, failed: errors.length, errors },
    })
  } catch (error) {
    console.error('[POST /api/import]', error)
    return NextResponse.json({ success: false, error: 'เกิดข้อผิดพลาดในการ Import' }, { status: 500 })
  }
}
