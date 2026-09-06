'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/components/shared/Pagination'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

function HistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [logs, setLogs] = useState<any[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)

  const [filters, setFilters] = useState({
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    student_id: searchParams.get('student_id') || '',
    scan_type: searchParams.get('scan_type') || '',
  })

  const fetchLogs = useCallback(async (page: number, currentFilters: typeof filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '50')
      
      if (currentFilters.date_from) params.set('date_from', currentFilters.date_from)
      if (currentFilters.date_to) params.set('date_to', currentFilters.date_to)
      if (currentFilters.student_id) params.set('student_id', currentFilters.student_id)
      if (currentFilters.scan_type) params.set('scan_type', currentFilters.scan_type)

      const res = await fetch(`/api/attendance?${params.toString()}`)
      const json = await res.json()
      
      if (json.success) {
        setLogs(json.data.items)
        setMeta(json.data.meta)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(1, filters)
  }, []) 

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.student_id) params.set('student_id', filters.student_id)
    if (filters.scan_type) params.set('scan_type', filters.scan_type)
    router.replace(`/history?${params.toString()}`, { scroll: false })
    
    fetchLogs(1, filters)
  }

  const clearFilters = () => {
    const emptyFilters = { date_from: '', date_to: '', student_id: '', scan_type: '' }
    setFilters(emptyFilters)
    router.replace('/history', { scroll: false })
    fetchLogs(1, emptyFilters)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ประวัติการสแกนเข้า-ออก</h1>
        <p className="text-gray-500">เรียกดูข้อมูลย้อนหลังทั้งหมด ({meta.total} รายการ)</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ตั้งแต่วันที่</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ถึงวันที่</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">รหัสนิสิต</label>
            <input
              type="text"
              name="student_id"
              placeholder="ค้นหารหัส..."
              value={filters.student_id}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">สถานะ</label>
            <select
              name="scan_type"
              value={filters.scan_type}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white"
            >
              <option value="">ทั้งหมด</option>
              <option value="IN">เข้า (IN)</option>
              <option value="OUT">ออก (OUT)</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            ล้างตัวกรอง
          </button>
          <button
            onClick={applyFilters}
            className="px-6 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
          >
            🔍 ค้นหา
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-medium">วัน-เวลา</th>
                  <th className="px-6 py-3 font-medium">รหัสนิสิต</th>
                  <th className="px-6 py-3 font-medium">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-gray-800">
                        {format(new Date(log.scanned_at), 'dd MMM yyyy HH:mm:ss', { locale: th })}
                      </td>
                      <td className="px-6 py-3 font-mono text-gray-900">{log.student.student_id}</td>
                      <td className="px-6 py-3 text-gray-700">
                        {log.student.first_name} {log.student.last_name}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            log.scan_type === 'IN'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {log.scan_type === 'IN' ? '🟢 เข้า' : '⚫ ออก'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-100">
             <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={(p) => fetchLogs(p, filters)} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="py-20"><LoadingSpinner /></div>}>
      <HistoryContent />
    </Suspense>
  )
}
