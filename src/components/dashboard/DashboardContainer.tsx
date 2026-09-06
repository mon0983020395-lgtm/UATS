'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/dashboard/StatCard'
import AttendanceChart from '@/components/dashboard/AttendanceChart'
import RecentScans from '@/components/dashboard/RecentScans'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { format } from 'date-fns'

export default function DashboardContainer() {
  const [data, setData] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(j => {
      if (j.success) setEvents(j.data)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    let url = '/api/dashboard'
    const params = new URLSearchParams()
    if (selectedEvent) params.append('event_id', selectedEvent)
    if (selectedSession) params.append('session_id', selectedSession)
    
    if (params.toString()) {
      url += '?' + params.toString()
    }

    fetch(url)
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setData(j.data)
        }
      })
      .finally(() => setLoading(false))
  }, [selectedEvent, selectedSession])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมระบบ</h1>
          <p className="text-gray-500">ข้อมูลสถิติการเข้า-ออกนิสิตแบบเรียลไทม์</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div>
            <select
              value={selectedEvent}
              onChange={e => {
                setSelectedEvent(e.target.value)
                setSelectedSession('')
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white"
            >
              <option value="">ทั้งหมด (Global)</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>
          {selectedEvent && (
            <div>
              <select
                value={selectedSession}
                onChange={e => setSelectedSession(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none bg-white min-w-[150px]"
              >
                <option value="">ทุกรอบในกิจกรรมนี้</option>
                {events.find(ev => ev.id.toString() === selectedEvent)?.sessions?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({format(new Date(s.start_time), 'HH:mm')} - {format(new Date(s.end_time), 'HH:mm')})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="นิสิตทั้งหมด"
              value={data.totalStudents}
              icon="👥"
              color="blue"
              subtitle="ลงทะเบียนในระบบ"
            />
            <StatCard
              title="ผู้เข้าร่วม"
              value={data.todayAttendees}
              icon="📅"
              color="green"
              subtitle={selectedEvent || selectedSession ? 'ผู้เข้าร่วมอย่างน้อย 1 ครั้ง' : 'มาอย่างน้อย 1 ครั้ง (วันนี้)'}
            />
            <StatCard
              title="อยู่ภายในสถานที่"
              value={data.currentlyInside}
              icon="🟢"
              color="pink"
              subtitle="สแกนเข้าล่าสุด"
            />
            <StatCard
              title="ออกไปแล้ว"
              value={data.alreadyLeft}
              icon="⚫"
              color="orange"
              subtitle="สแกนออกล่าสุด"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AttendanceChart 
                data={data.chartData} 
                title={selectedSession ? '📈 สถิติ (ไม่ได้แสดงกราฟในมุมมองรอบ)' : selectedEvent ? '📈 จำนวนผู้เข้าร่วมรายวัน' : '📈 ผู้เข้าร่วมย้อนหลัง 7 วัน'} 
              />
            </div>
            <div className="lg:col-span-1">
              <RecentScans customScans={data.recentScans} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-red-500">
          ไม่สามารถโหลดข้อมูล Dashboard ได้
        </div>
      )}
    </div>
  )
}
