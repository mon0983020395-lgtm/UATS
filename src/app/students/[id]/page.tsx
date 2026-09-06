'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import StudentForm from '@/components/students/StudentForm'
import QRCodeDisplay from '@/components/students/QRCodeDisplay'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrUrl, setQrUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${id}`)
      const json = await res.json()
      if (json.success) {
        setStudent(json.data)
        setQrUrl(`/api/students/${id}/qr`)
      } else {
        router.push('/students')
      }
    } catch {
      router.push('/students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudent()
  }, [id])

  const handleUpdate = async (data: any) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        setStudent({ ...student, ...json.data })
        setIsEditing(false)
        return { success: true }
      }
      return { success: false, error: json.error }
    } catch {
      return { success: false, error: 'ไม่สามารถบันทึกได้' }
    }
  }

  if (loading) return <div className="py-20"><LoadingSpinner /></div>
  if (!student) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-gray-500 hover:text-gray-900">
          ← กลับ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ข้อมูลนิสิต</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">ข้อมูลส่วนตัว</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-pink-600 text-sm font-medium hover:underline"
              >
                {isEditing ? 'ยกเลิกแก้ไข' : '✏️ แก้ไขข้อมูล'}
              </button>
            </div>

            {isEditing ? (
              <StudentForm
                initialData={student}
                onSubmit={handleUpdate}
                submitLabel="บันทึกการแก้ไข"
              />
            ) : (
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">รหัสนิสิต</p>
                  <p className="font-medium text-gray-900">{student.student_id}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">ชั้นปี</p>
                  <p className="font-medium text-gray-900">{student.year ? `ปี ${student.year}` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">ชื่อ-นามสกุล</p>
                  <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">สาขาวิชา</p>
                  <p className="font-medium text-gray-900">{student.department}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">อีเมล</p>
                  <p className="font-medium text-gray-900">{student.email || '-'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">ประวัติการสแกน 50 รายการล่าสุด</h2>
            {student.attendance_logs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">ยังไม่มีประวัติการสแกน</p>
            ) : (
              <div className="overflow-hidden border border-gray-100 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-gray-600 font-medium">วัน-เวลา</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {student.attendance_logs.map((log: any) => (
                      <tr key={log.id}>
                        <td className="px-4 py-2 text-gray-800">
                          {format(new Date(log.scanned_at), 'dd MMM yyyy HH:mm:ss', { locale: th })}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.scan_type === 'IN'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {log.scan_type === 'IN' ? '🟢 เข้า' : '⚫ ออก'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* QR Column */}
        <div className="md:col-span-1">
          <QRCodeDisplay
            qrCodeUrl={qrUrl}
            studentId={student.student_id}
            studentName={`${student.first_name} ${student.last_name}`}
          />
        </div>
      </div>
    </div>
  )
}
