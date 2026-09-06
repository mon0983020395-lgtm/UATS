'use client'

import { useState } from 'react'
import type { Student } from '@/types'

interface StudentFormProps {
  initialData?: Partial<Student>
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string; data?: any }>
  submitLabel?: string
}

export default function StudentForm({ initialData, onSubmit, submitLabel = 'บันทึก' }: StudentFormProps) {
  const [formData, setFormData] = useState({
    student_id: initialData?.student_id || '',
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    department: initialData?.department || '',
    year: initialData?.year?.toString() || '',
    email: initialData?.email || '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...formData,
      year: formData.year ? parseInt(formData.year) : null,
      email: formData.email || null,
    }

    const result = await onSubmit(payload)
    if (!result.success) {
      setError(result.error || 'เกิดข้อผิดพลาดในการบันทึก')
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนิสิต <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="student_id"
          required
          maxLength={20}
          value={formData.student_id}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          placeholder="ex. 6401234567"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="first_name"
            required
            maxLength={100}
            value={formData.first_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="last_name"
            required
            maxLength={100}
            value={formData.last_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">สาขาวิชา <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="department"
            required
            maxLength={150}
            value={formData.department}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ชั้นปี</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white"
          >
            <option value="">ไม่ระบุ</option>
            {[1, 2, 3, 4, 5, 6].map(y => (
              <option key={y} value={y}>ปี {y}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
        <input
          type="email"
          name="email"
          maxLength={150}
          value={formData.email}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          placeholder="example@student.ac.th"
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'กำลังบันทึก...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
