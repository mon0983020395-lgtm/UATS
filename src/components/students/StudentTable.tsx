'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Student } from '@/types'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

interface StudentTableProps {
  students: Student[]
  onDelete: (id: number) => Promise<void>
}

export default function StudentTable({ students, onDelete }: StudentTableProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    await onDelete(deleteId)
    setIsDeleting(false)
    setDeleteId(null)
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-500">ไม่พบข้อมูลนิสิต</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">รหัสนิสิต</th>
                <th className="px-6 py-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-6 py-3 font-medium">สาขาวิชา</th>
                <th className="px-6 py-3 font-medium">กลุ่ม</th>
                <th className="px-6 py-3 font-medium">ชั้นปี</th>
                <th className="px-6 py-3 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-gray-900">{student.student_id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.department}</td>
                  <td className="px-6 py-4 text-gray-600">{student.group || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{student.year ? `ปี ${student.year}` : '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/students/${student.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ดูข้อมูล
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setDeleteId(student.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="ยืนยันการลบข้อมูล"
        message="คุณต้องการลบข้อมูลนิสิตคนนี้ใช่หรือไม่? ข้อมูลประวัติการสแกนทั้งหมดของนิสิตคนนี้จะถูกลบด้วยและไม่สามารถกู้คืนได้"
        confirmLabel={isDeleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
        dangerous={true}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setDeleteId(null)}
      />
    </>
  )
}
