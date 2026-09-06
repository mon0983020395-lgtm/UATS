import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.attendanceLog.deleteMany()
  await prisma.student.deleteMany()

  const departments = [
    'วิทยาการคอมพิวเตอร์',
    'เทคโนโลยีสารสนเทศ',
    'วิศวกรรมซอฟต์แวร์',
    'นิเทศศาสตร์',
    'บริหารธุรกิจ',
  ]

  const students = Array.from({ length: 20 }, (_, i) => ({
    student_id: `640${String(i + 1).padStart(7, '0')}`,
    first_name: `นิสิต${i + 1}`,
    last_name: 'ทดสอบ',
    department: departments[i % departments.length],
    year: (i % 4) + 1,
    email: `student${i + 1}@test.ac.th`,
    qr_token: uuidv4(),
  }))

  const created = await prisma.student.createMany({ data: students, skipDuplicates: true })
  console.log(`✅ Seeded ${created.count} students`)

  // Add some attendance logs for testing
  const allStudents = await prisma.student.findMany({ take: 5 })
  const now = new Date()

  for (const student of allStudents) {
    // Yesterday IN/OUT
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(8, 30, 0, 0)
    await prisma.attendanceLog.create({
      data: {
        student_id: student.id,
        scan_type: 'IN',
        scanned_at: yesterday,
      },
    })
    yesterday.setHours(17, 0, 0, 0)
    await prisma.attendanceLog.create({
      data: {
        student_id: student.id,
        scan_type: 'OUT',
        scanned_at: yesterday,
      },
    })
  }

  console.log('✅ Seeded attendance logs')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
