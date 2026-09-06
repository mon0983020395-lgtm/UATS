'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

export default function MatrixReportPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(j => {
      if (j.success && j.data.length > 0) {
        setEvents(j.data)
        setSelectedEvent(j.data[0].id.toString())
      }
    })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    fetch(`/api/report/matrix?event_id=${selectedEvent}`)
      .then(r => r.json())
      .then(j => {
        if (j.success) setData(j.data)
      })
      .finally(() => setLoading(false))
  }, [selectedEvent])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <span className="text-green-500 font-bold" title="ตรงเวลา">🟢</span>
      case 'LATE': return <span className="text-yellow-500 font-bold" title="สาย">🟡</span>
      default: return <span className="text-red-500 font-bold" title="ขาด">🔴</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตารางเช็คชื่อ (Matrix Report)</h1>
          <p className="text-gray-500">รายงานสรุปการเข้าร่วมรายรอบตลอดโครงการ</p>
        </div>
        <div>
          <select
            value={selectedEvent}
            onChange={e => setSelectedEvent(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none bg-white min-w-[250px]"
          >
            <option value="" disabled>เลือกกิจกรรม...</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : data?.sessions?.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border text-center text-gray-500">
          ไม่พบข้อมูลรอบการอบรมในกิจกรรมนี้
        </div>
      ) : data ? (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              พบข้อมูล <strong>{data.students.length}</strong> คน, <strong>{data.sessions.length}</strong> รอบ
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">🟢 ตรงเวลา</span>
              <span className="flex items-center gap-1">🟡 สาย</span>
              <span className="flex items-center gap-1">🔴 ขาด</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-gray-700 bg-gray-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold border-r min-w-[50px] text-center sticky left-0 z-20 bg-gray-100">ลำดับ</th>
                  <th className="px-4 py-3 font-semibold border-r min-w-[120px] sticky left-[50px] z-20 bg-gray-100">รหัสนิสิต</th>
                  <th className="px-4 py-3 font-semibold border-r min-w-[150px] sticky left-[170px] z-20 bg-gray-100">ชื่อ-นามสกุล</th>
                  {data.sessions.map((sess: any, idx: number) => (
                    <th key={sess.id} className="px-3 py-2 font-medium border-r min-w-[80px] text-center whitespace-nowrap">
                      <div className="text-[10px] text-gray-500">{format(new Date(sess.start_time), 'd MMM', { locale: th })}</div>
                      <div className="truncate w-full max-w-[80px]" title={sess.name}>{sess.name}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-center border-l bg-gray-50">สรุป (เข้า/รอบ)</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student: any, idx: number) => {
                  let presentCount = 0;
                  data.sessions.forEach((sess: any) => {
                    const st = student.attendance[sess.id]?.status
                    if (st === 'PRESENT' || st === 'LATE') presentCount++
                  })

                  return (
                    <tr key={student.id} className="border-b hover:bg-pink-50/50 transition-colors">
                      <td className="px-4 py-3 border-r text-center text-gray-500 sticky left-0 z-10 bg-white">{idx + 1}</td>
                      <td className="px-4 py-3 border-r font-mono text-gray-700 sticky left-[50px] z-10 bg-white">{student.student_id}</td>
                      <td className="px-4 py-3 border-r font-medium text-gray-900 sticky left-[170px] z-10 bg-white">
                        {student.first_name} {student.last_name}
                      </td>
                      {data.sessions.map((sess: any) => (
                        <td key={sess.id} className="px-3 py-3 border-r text-center">
                          {getStatusBadge(student.attendance[sess.id]?.status)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center border-l font-bold text-gray-700 bg-gray-50">
                        {presentCount} / {data.sessions.length}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
