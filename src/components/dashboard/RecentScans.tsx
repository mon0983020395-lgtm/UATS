'use client'

import { useEffect, useState } from 'react'
import type { RecentScan } from '@/types'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function RecentScans() {
  const [scans, setScans] = useState<RecentScan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const json = await res.json()
      if (json.success) setScans(json.data.recentScans)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScans()
    const interval = setInterval(fetchScans, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="flex justify-center py-8"><LoadingSpinner text="กำลังโหลดข้อมูล..." /></div>

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">🕒 รายการสแกนล่าสุด</h2>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">อัปเดตทุก 30 วินาที</span>
      </div>
      {scans.length === 0 ? (
        <p className="text-center text-gray-400 py-8">ยังไม่มีรายการสแกน</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-2 font-medium text-gray-500">เวลา</th>
                <th className="pb-2 font-medium text-gray-500">รหัสนิสิต</th>
                <th className="pb-2 font-medium text-gray-500">ชื่อ-นามสกุล</th>
                <th className="pb-2 font-medium text-gray-500">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {scans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="py-2 text-gray-600">
                    {format(new Date(scan.scanned_at), 'HH:mm:ss', { locale: th })}
                  </td>
                  <td className="py-2 font-mono text-gray-700">{scan.student.student_id}</td>
                  <td className="py-2 text-gray-800">
                    {scan.student.first_name} {scan.student.last_name}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        scan.scan_type === 'IN'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {scan.scan_type === 'IN' ? '🟢 เข้า' : '⚫ ออก'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
