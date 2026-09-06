'use client'

import { Suspense, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import Link from 'next/link'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function SessionReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [showAbsent, setShowAbsent] = useState(false)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(j => { if (j.success) setEvents(j.data) })
  }, [])

  const fetchReport = () => {
    setLoading(true)
    let url = `/api/report/session?date=${date}`
    if (selectedEvent) url += `&event_id=${selectedEvent}`
    fetch(url).then(r => r.json()).then(j => {
      if (j.success) setData(j.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchReport() }, [date, selectedEvent])

  const handleExport = () => {
    if (!data) return
    const rows = data.attendance_list.map((a: any) => ({
      รหัสนิสิต: a.student.student_id,
      ชื่อ: `${a.student.first_name} ${a.student.last_name}`,
      สาขา: a.student.department,
      ชั้นปี: a.student.year ?? '',
      สถานะ: a.attended ? 'เข้าร่วม' : 'ขาด',
      เวลาเข้า: a.first_in ? format(new Date(a.first_in), 'HH:mm', { locale: th }) : '',
      เวลาออก: a.last_out ? format(new Date(a.last_out), 'HH:mm', { locale: th }) : '',
      ระยะเวลา_นาที: a.duration_minutes,
    }))
    const header = Object.keys(rows[0]).join(',')
    const csv = '\uFEFF' + header + '\n' + rows.map((r: any) => Object.values(r).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `session_report_${date}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานภาพรวมรายวัน</h1>
          <p className="text-gray-500">ตรวจสอบผู้เข้าร่วม/ขาด และอัตราการเข้าร่วมประจำวัน</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm font-medium transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">วันที่</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">กิจกรรม</label>
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white"
          >
            <option value="">ทั้งหมด</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input type="checkbox" id="showAbsent" checked={showAbsent} onChange={e => setShowAbsent(e.target.checked)} className="rounded" />
          <label htmlFor="showAbsent" className="text-sm text-gray-700 cursor-pointer">แสดงเฉพาะผู้ขาด</label>
        </div>
      </div>

      {loading ? <div className="py-20"><LoadingSpinner /></div> : data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'นิสิตทั้งหมด', value: data.summary.total, icon: '👥', color: 'text-gray-900' },
              { label: 'เข้าร่วม', value: data.summary.attended, icon: '🟢', color: 'text-green-600' },
              { label: 'ขาด', value: data.summary.absent, icon: '⚫', color: 'text-gray-500' },
              { label: 'อัตราการเข้าร่วม', value: `${data.summary.attendance_rate}%`, icon: '📊', color: data.summary.attendance_rate >= 80 ? 'text-green-600' : 'text-red-500' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl mb-1">{c.icon}</div>
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>อัตราการเข้าร่วม</span>
              <span>{data.summary.attendance_rate}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${data.summary.attendance_rate >= 80 ? 'bg-green-500' : data.summary.attendance_rate >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                style={{ width: `${data.summary.attendance_rate}%` }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">
                รายชื่อ{showAbsent ? 'ผู้ขาด' : 'ทั้งหมด'} — {format(new Date(date), 'd MMMM yyyy', { locale: th })}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">รหัสนิสิต</th>
                    <th className="px-5 py-3 text-left font-medium">ชื่อ-นามสกุล</th>
                    <th className="px-5 py-3 text-left font-medium">สาขา</th>
                    <th className="px-5 py-3 text-center font-medium">สถานะ</th>
                    <th className="px-5 py-3 text-center font-medium">เข้า</th>
                    <th className="px-5 py-3 text-center font-medium">ออก</th>
                    <th className="px-5 py-3 text-center font-medium">ระยะเวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.attendance_list
                    .filter((a: any) => showAbsent ? !a.attended : true)
                    .map((a: any) => (
                      <tr key={a.student.id} className={`hover:bg-gray-50/50 ${!a.attended ? 'opacity-60' : ''}`}>
                        <td className="px-5 py-3 font-mono text-xs text-gray-700">
                          <Link href={`/report/student/${a.student.id}`} className="text-pink-500 hover:underline">{a.student.student_id}</Link>
                        </td>
                        <td className="px-5 py-3 text-gray-900">{a.student.first_name} {a.student.last_name}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">{a.student.department}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${a.attended ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {a.attended ? '🟢 เข้าร่วม' : '⚫ ขาด'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600 text-xs">
                          {a.first_in ? format(new Date(a.first_in), 'HH:mm') : '—'}
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600 text-xs">
                          {a.last_out ? format(new Date(a.last_out), 'HH:mm') : '—'}
                        </td>
                        <td className="px-5 py-3 text-center text-gray-600 text-xs">
                          {a.duration_minutes > 0
                            ? `${Math.floor(a.duration_minutes / 60)}:${String(a.duration_minutes % 60).padStart(2, '0')} ชม.`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
