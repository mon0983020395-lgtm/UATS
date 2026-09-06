'use client'

import { useState } from 'react'
import type { ScanResult } from '@/types'

interface ManualEntryProps {
  onResult: (result: ScanResult) => void
  onError: (error: string) => void
  onCooldown: (remaining: number) => void
}

export default function ManualEntry({ onResult, onError, onCooldown }: ManualEntryProps) {
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId.trim() }),
      })
      const json = await res.json()

      if (json.success) {
        onResult(json.data)
        setStudentId('')
      } else if (res.status === 429 && json.data?.cooldown) {
        onCooldown(json.data.remaining)
      } else {
        onError(json.error || 'เกิดข้อผิดพลาด')
      }
    } catch {
      onError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-3">⌨️ พิมพ์รหัสนิสิต (สำรองกรณีกล้องเสีย)</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="รหัสนิสิต เช่น 6401234567"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !studentId.trim()}
          className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'กำลัง...' : 'สแกน'}
        </button>
      </form>
    </div>
  )
}
