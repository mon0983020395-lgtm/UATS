'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function GroupReportPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'year' | 'dept' | 'students'>('overview')

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(j => { if (j.success) setEvents(j.data) })
  }, [])

  const fetchReport = () => {
    setLoading(true)
    let url = '/api/report/group?'
    if (selectedEvent) url += `event_id=${selectedEvent}&`
    if (filterYear) url += `year=${filterYear}&`
    if (filterDept) url += `department=${encodeURIComponent(filterDept)}&`
    fetch(url).then(r => r.json()).then(j => {
      if (j.success) setData(j.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchReport() }, [selectedEvent, filterYear, filterDept])

  const handleExport = () => {
    if (!data) return
    const rows = data.students.map((s: any) => ({
      รหัสนิสิต: s.student.student_id,
      ชื่อ: `${s.student.first_name} ${s.student.last_name}`,
      สาขา: s.student.department,
      ชั้นปี: s.student.year ?? '',
      วันที่เข้าร่วม: s.days_attended,
      ชั่วโมงสะสม: s.total_hours,
      สถานะ: s.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์',
    }))
    const header = Object.keys(rows[0]).join(',')
    const csv = '\uFEFF' + header + '\n' + rows.map((r: any) => Object.values(r).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `group_report.csv`
    a.click()
  }

  const tabs = [
    { key: 'overview', label: '📊 ภาพรวม' },
    { key: 'year', label: '🎓 แยกชั้นปี' },
    { key: 'dept', label: '🏫 แยกสาขา' },
    { key: 'students', label: '👤 รายบุคคล' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงานสรุปตามกลุ่ม</h1>
          <p className="text-gray-500">วิเคราะห์ผลการเข้าร่วมแยกตามชั้นปีและสาขาวิชา</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm font-medium transition-colors"
        >
          📥 Export CSV ส่งคณะ
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">กิจกรรม</label>
          <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white">
            <option value="">กิจกรรมปัจจุบัน / ทั้งหมด</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">ชั้นปี</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white">
            <option value="">ทุกชั้นปี</option>
            {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>ชั้นปีที่ {y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">สาขาวิชา</label>
          <input type="text" placeholder="ค้นหาสาขา..." value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none" />
        </div>
      </div>

      {loading ? <div className="py-20"><LoadingSpinner /></div> : data && (
        <>
          {/* Event Header */}
          {data.event && (
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <p className="font-semibold text-pink-800">📌 {data.event.name}</p>
              <p className="text-sm text-pink-600 mt-0.5">เกณฑ์ผ่าน: {data.event.required_hours} ชั่วโมง</p>
            </div>
          )}

          {/* Overall */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-gray-900">{data.overall.total}</p>
              <p className="text-sm text-gray-500 mt-1">นิสิตทั้งหมด</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-600">{data.overall.passed}</p>
              <p className="text-sm text-green-600 mt-1">ผ่านเกณฑ์</p>
            </div>
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 text-center shadow-sm">
              <p className="text-3xl font-bold text-pink-600">{data.overall.pass_rate}%</p>
              <p className="text-sm text-pink-600 mt-1">อัตราผ่านเกณฑ์</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t.key ? 'border-b-2 border-pink-500 text-pink-600 bg-pink-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-x-auto">
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  {data.year_summary.map((y: any) => (
                    <div key={y.year} className="flex items-center gap-4">
                      <span className="w-24 text-sm text-gray-600">ชั้นปีที่ {y.year}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${y.pass_rate}%` }}>
                          <span className="text-xs text-white font-medium">{y.pass_rate}%</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-20 text-right">{y.passed}/{y.total} คน</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'year' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">ชั้นปี</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ทั้งหมด</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ผ่านเกณฑ์</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ไม่ผ่าน</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">อัตราผ่าน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.year_summary.map((y: any) => (
                      <tr key={y.year} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">ชั้นปีที่ {y.year}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{y.total}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{y.passed}</td>
                        <td className="px-4 py-3 text-center text-red-500">{y.total - y.passed}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${y.pass_rate >= 80 ? 'text-green-600' : 'text-red-500'}`}>{y.pass_rate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'dept' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">สาขาวิชา</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ทั้งหมด</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ผ่านเกณฑ์</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ไม่ผ่าน</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">อัตราผ่าน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.department_summary.map((d: any) => (
                      <tr key={d.department} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{d.department}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{d.total}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{d.passed}</td>
                        <td className="px-4 py-3 text-center text-red-500">{d.total - d.passed}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${d.pass_rate >= 80 ? 'text-green-600' : 'text-red-500'}`}>{d.pass_rate}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'students' && (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">รหัสนิสิต</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">สาขา/ปี</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">วันที่เข้า</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">ชม.สะสม</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-600">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.students.map((s: any) => (
                      <tr key={s.student.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">
                          <Link href={`/report/student/${s.student.id}`} className="font-mono text-xs text-pink-500 hover:underline">{s.student.student_id}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900">{s.student.first_name} {s.student.last_name}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{s.student.department}{s.student.year && ` ปี ${s.student.year}`}</td>
                        <td className="px-4 py-2.5 text-center text-gray-600">{s.days_attended} วัน</td>
                        <td className="px-4 py-2.5 text-center font-medium text-gray-800">{s.total_hours} ชม.</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {s.passed ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
