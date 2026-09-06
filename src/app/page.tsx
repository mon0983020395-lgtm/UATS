import StatCard from '@/components/dashboard/StatCard'
import AttendanceChart from '@/components/dashboard/AttendanceChart'
import RecentScans from '@/components/dashboard/RecentScans'
import { prisma } from '@/lib/db'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { th } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    // Total students
    const totalStudents = await prisma.student.count()

    // Today attendees (distinct students with IN today)
    const todayAttendeesResult = await prisma.attendanceLog.groupBy({
      by: ['student_id'],
      where: {
        scan_type: 'IN',
        scanned_at: { gte: todayStart, lte: todayEnd },
      },
    })
    const todayAttendees = todayAttendeesResult.length

    // Currently inside: students whose LATEST log today is IN
    const todayLogs = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM (
        SELECT al.student_id, al.scan_type
        FROM attendance_logs al
        INNER JOIN (
          SELECT student_id, MAX(id) as max_id
          FROM attendance_logs
          WHERE scanned_at >= ${todayStart} AND scanned_at <= ${todayEnd}
          GROUP BY student_id
        ) latest ON al.id = latest.max_id
      ) last_logs
      WHERE last_logs.scan_type = 'IN'
    `
    const currentlyInside = Number(todayLogs[0]?.count ?? 0)
    const alreadyLeft = todayAttendees - currentlyInside

    // Chart data: 7 days
    const sevenDaysAgo = startOfDay(subDays(now, 6))
    const chartRaw = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT
        DATE(scanned_at) as date,
        COUNT(DISTINCT student_id) as count
      FROM attendance_logs
      WHERE scan_type = 'IN'
        AND scanned_at >= ${sevenDaysAgo}
      GROUP BY DATE(scanned_at)
      ORDER BY date ASC
    `

    // Fill in missing days
    const chartMap = new Map(
      chartRaw.map((r) => [format(new Date(r.date), 'yyyy-MM-dd'), Number(r.count)])
    )
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i)
      const key = format(date, 'yyyy-MM-dd')
      return {
        date: key,
        count: chartMap.get(key) ?? 0,
        label: format(date, 'd MMM', { locale: th }),
      }
    })

    return {
      totalStudents,
      todayAttendees,
      currentlyInside,
      alreadyLeft,
      chartData,
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-2">ไม่สามารถโหลดข้อมูล Dashboard ได้</p>
        <p className="text-gray-500 text-sm">กรุณาตรวจสอบการเชื่อมต่อฐานข้อมูล</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h1>
        <p className="text-gray-500">ข้อมูลสถิติการเข้า-ออกนิสิตแบบเรียลไทม์</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="นิสิตทั้งหมด"
          value={data.totalStudents}
          icon="👥"
          color="blue"
          subtitle="ลงทะเบียนในระบบ"
        />
        <StatCard
          title="ผู้เข้าร่วมวันนี้"
          value={data.todayAttendees}
          icon="📅"
          color="green"
          subtitle="มาอย่างน้อย 1 ครั้ง"
        />
        <StatCard
          title="อยู่ภายในสถานที่"
          value={data.currentlyInside}
          icon="🟢"
          color="pink"
          subtitle="สแกนเข้าล่าสุด"
        />
        <StatCard
          title="ออกไปแล้ว"
          value={data.alreadyLeft}
          icon="⚫"
          color="orange"
          subtitle="สแกนออกล่าสุด"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart data={data.chartData} />
        </div>
        <div className="lg:col-span-1">
          <RecentScans />
        </div>
      </div>
    </div>
  )
}
