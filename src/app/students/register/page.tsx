'use client'

import { useState } from 'react'
import Link from 'next/link'
import StudentForm from '@/components/students/StudentForm'
import QRCodeDisplay from '@/components/students/QRCodeDisplay'

export default function RegisterPage() {
  const [successData, setSuccessData] = useState<{
    qrCodeDataURL: string
    student: any
  } | null>(null)

  const handleSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      
      if (json.success) {
        setSuccessData({
          qrCodeDataURL: json.data.qrCodeDataURL,
          student: json.data.student,
        })
        return { success: true }
      }
      return { success: false, error: json.error }
    } catch (error) {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }
    }
  }

  const handleRegisterNew = () => {
    setSuccessData(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-gray-500 hover:text-gray-900">
          ← กลับ
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลงทะเบียนนิสิตใหม่</h1>
          <p className="text-gray-500">เพิ่มข้อมูลนิสิตเพื่อสร้าง QR Code</p>
        </div>
      </div>

      {successData ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-6">
          <div className="text-green-500 text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-green-700">ลงทะเบียนสำเร็จ!</h2>
          
          <div className="flex justify-center">
            <QRCodeDisplay
              qrCodeUrl={successData.qrCodeDataURL}
              studentId={successData.student.student_id}
              studentName={`${successData.student.first_name} ${successData.student.last_name}`}
            />
          </div>

          <div className="pt-4">
            <button
              onClick={handleRegisterNew}
              className="bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              + ลงทะเบียนคนต่อไป
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <StudentForm onSubmit={handleSubmit} submitLabel="ลงทะเบียนและสร้าง QR Code" />
        </div>
      )}
    </div>
  )
}
