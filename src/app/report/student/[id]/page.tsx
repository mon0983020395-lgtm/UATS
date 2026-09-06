'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function HoursBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const passed = value >= max && max > 0
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{value.toFixed(1)} ชม.</span>
        <span>เป้าหมาย {max} ชม.</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${passed ? 'bg-green-500' : 'bg-pink-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function StudentReportPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(j => {
      if (j.success) setEvents(j.data)
    })
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    const url = selectedEvent
      ? `/api/report/student/${id}?event_id=${selectedEvent}`
      : `/api/report/student/${id}`
    fetch(url).then(r => r.json()).then(j => {
      if (j.success) setData(j.data)
    }).finally(() => setLoading(false))
  }, [id, selectedEvent])

  const handlePrint = () => window.print()

  if (loading) return <div className="py-20"><LoadingSpinner /></div>
  if (!data) return <div className="py-10 text-center text-gray-500">ไม่พบข้อมูล</div>

  const { student, event, summary, sessions, daily_summary } = data

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <Link href="/students" className="text-sm text-pink-500 hover:underline">← กลับไปรายชื่อนิสิต</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">รายงานรายบุคคล</h1>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white"
          >
            <option value="">กิจกรรมปัจจุบัน / ทั้งหมด</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            🖨️ พิมพ์
          </button>
        </div>
      </div>

      {/* Student Info Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-2xl">
            🧘
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-gray-500 text-sm">รหัสนิสิต: <span className="font-mono font-medium text-gray-800">{student.student_id}</span></p>
            <p className="text-gray-500 text-sm">
              {student.department}
              {student.year && ` · ชั้นปีที่ ${student.year}`}
            </p>
          </div>
          {event && (
            <div className="text-right">
              <p className="text-xs text-gray-400">กิจกรรม</p>
              <p className="font-semibold text-gray-800">{event.name}</p>
              <p className="text-xs text-gray-500">
                {format(new Date(event.start_date), 'd MMM yyyy', { locale: th })} –{' '}
                {format(new Date(event.end_date), 'd MMM yyyy', { locale: th })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'วันที่เข้าร่วม', value: `${summary.days_attended} วัน`, icon: '📅', color: 'blue' },
          { label: 'จำนวนครั้งที่เข้าร่วม', value: `${summary.total_sessions} ครั้ง`, icon: '🔄', color: 'purple' },
          { label: 'ชั่วโมงสะสม', value: `${summary.total_hours} ชม.`, icon: '⏱', color: 'pink' },
          {
            label: 'สถานะ',
            value: event
              ? summary.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'
              : 'ไม่ได้กำหนด',
            icon: summary.passed ? '✅' : '❌',
            color: summary.passed ? 'green' : 'red',
          },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl mb-1">{card.icon}</div>
            <p className="text-lg font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Hours Progress Bar */}
      {event && event.required_hours > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">ความคืบหน้าชั่วโมง</h3>
          <HoursBar value={summary.total_hours} max={summary.required_hours} />
        </div>
      )}

      {/* Session Log Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">บันทึกการเข้าร่วมแต่ละครั้ง</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">เวลาเข้า</th>
                <th className="px-5 py-3 text-left font-medium">เวลาออก</th>
                <th className="px-5 py-3 text-left font-medium">ระยะเวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">ยังไม่มีข้อมูลการเข้าร่วม</td></tr>
              ) : sessions.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3 text-gray-800">
                    <span className="text-green-600 font-medium">🟢</span>{' '}
                    {format(new Date(s.in), 'dd MMM yyyy HH:mm', { locale: th })}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {s.out ? (
                      <><span className="text-gray-500">⚫</span>{' '}{format(new Date(s.out), 'dd MMM yyyy HH:mm', { locale: th })}</>
                    ) : (
                      <span className="text-yellow-600 text-xs bg-yellow-50 px-2 py-0.5 rounded-full">ยังอยู่</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {s.out
                      ? `${Math.floor(s.duration_minutes / 60)} ชม. ${s.duration_minutes % 60} นาที`
                      : '—'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
