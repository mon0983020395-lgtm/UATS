'use client'

import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { ScanResult } from '@/types'

interface ScanResultProps {
  result: ScanResult | null
  error: string | null
  cooldown: { active: boolean; remaining: number } | null
  onReset: () => void
}

export default function ScanResultDisplay({ result, error, cooldown, onReset }: ScanResultProps) {
  if (cooldown?.active) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">⏱️</div>
        <h3 className="text-xl font-bold text-orange-700 mb-1">โปรดรออีกสักครู่</h3>
        <p className="text-orange-600 text-lg font-semibold">{cooldown.remaining} วินาที</p>
        <p className="text-orange-500 text-sm mt-1">ไม่สามารถสแกนซ้ำภายใน 30 วินาที</p>
        <button onClick={onReset} className="mt-4 text-sm text-orange-500 underline">
          สแกนใหม่
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="text-5xl mb-3">❌</div>
        <h3 className="text-xl font-bold text-red-700 mb-1">เกิดข้อผิดพลาด</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={onReset}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          ลองใหม่
        </button>
      </div>
    )
  }

  if (result) {
    const isIn = result.scan_type === 'IN'
    return (
      <div
        className={`rounded-2xl border-2 p-6 text-center ${
          isIn ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300'
        }`}
      >
        <div className="text-6xl mb-3">{isIn ? '🟢' : '🟠'}</div>
        <div
          className={`inline-block px-6 py-2 rounded-full text-xl font-bold mb-4 ${
            isIn ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
          }`}
        >
          {isIn ? '✔ เข้า' : '✔ ออก'}
        </div>
        {result.is_late && isIn && (
          <div className="inline-block px-4 py-1.5 ml-2 rounded-full text-sm font-bold mb-4 bg-orange-100 text-orange-600 border border-orange-200">
            ⚠️ เข้าสาย
          </div>
        )}
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {result.student.first_name} {result.student.last_name}
        </h3>
        <p className="text-gray-500 mb-1">รหัสนิสิต: {result.student.student_id}</p>
        <p className="text-gray-500 text-sm mb-1">{result.student.department}</p>
        {result.session && (
          <p className="text-pink-600 text-sm font-medium mb-1">📍 รอบ: {result.session.name}</p>
        )}
        <p className="text-gray-400 text-sm">
          {format(new Date(result.scanned_at), 'dd MMMM yyyy HH:mm:ss', { locale: th })}
        </p>
        <button
          onClick={onReset}
          className="mt-5 bg-pink-500 hover:bg-pink-600 text-white px-8 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          สแกนคนถัดไป
        </button>
      </div>
    )
  }

  return null
}
