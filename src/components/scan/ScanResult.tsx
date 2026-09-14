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
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="text-4xl mb-2">⏱️</div>
        <h3 className="text-lg font-bold text-amber-800 mb-1">สแกนซ้ำเร็วเกินไป</h3>
        <p className="text-amber-700 text-sm font-medium">
          นิสิตคนนี้เพิ่งบันทึกไป กรุณารออีก <span className="font-bold text-lg text-amber-900">{cooldown.remaining}</span> วินาที
        </p>
        <p className="text-xs text-amber-600 mt-1">
          (เพื่อป้องกันการสแกนซ้อน — นิสิตคนถัดไปสามารถนำ QR มาสแกนต่อได้ทันทีครับ)
        </p>
        <button
          onClick={onReset}
          className="mt-3 text-xs bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1.5 rounded-lg font-medium transition-colors"
        >
          ✕ ปิดการแจ้งเตือน
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="text-4xl mb-2">❌</div>
        <h3 className="text-lg font-bold text-red-700 mb-1">ไม่สามารถบันทึกได้</h3>
        <p className="text-red-600 text-sm font-medium">{error}</p>
        <button
          onClick={onReset}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-5 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          ✕ ปิดการแจ้งเตือน
        </button>
      </div>
    )
  }

  if (result) {
    const isIn = result.scan_type === 'IN'
    return (
      <div
        className={`rounded-2xl border-2 p-6 text-center shadow-sm animate-in fade-in zoom-in-95 duration-200 ${
          isIn ? 'bg-emerald-50 border-emerald-400' : 'bg-sky-50 border-sky-400'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl">{isIn ? '🟢' : '🔵'}</span>
          <span
            className={`px-4 py-1 rounded-full text-base font-bold text-white ${
              isIn ? 'bg-emerald-600' : 'bg-sky-600'
            }`}
          >
            {isIn ? '✔ บันทึกเวลาเข้า' : '✔ บันทึกเวลาออก'}
          </span>
          {result.is_late && isIn && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
              ⚠️ เข้าสาย
            </span>
          )}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {result.student.first_name} {result.student.last_name}
        </h3>
        <p className="text-gray-600 text-sm mb-1 font-mono">รหัส: {result.student.student_id}</p>
        <p className="text-gray-500 text-xs mb-2">{result.student.department}</p>
        
        {result.session && (
          <div className="inline-block bg-white/80 border border-pink-200 text-pink-700 text-xs px-3 py-1 rounded-full font-medium mb-2">
            📍 รอบ: {result.session.name}
          </div>
        )}

        <p className="text-gray-400 text-xs">
          บันทึกเมื่อ: {format(new Date(result.scanned_at), 'HH:mm:ss', { locale: th })} น.
        </p>

        <div className="mt-4 pt-3 border-t border-gray-200/50 flex justify-center gap-2">
          <span className="text-xs text-gray-500 font-medium self-center">
            📸 กล้องเปิดอยู่ พร้อมสแกนคนถัดไปได้เลย
          </span>
        </div>
      </div>
    )
  }

  return null
}
