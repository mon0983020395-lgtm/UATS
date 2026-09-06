'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface MeditationEvent {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  required_hours: number
  is_active: boolean
  created_at: string
  _count?: { attendance_logs: number }
}

const emptyForm = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  required_hours: 0,
  is_active: false,
}

export default function EventsManager() {
  const [events, setEvents] = useState<MeditationEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<MeditationEvent | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/events')
      const json = await res.json()
      if (json.success) setEvents(json.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEvents() }, [])

  const openCreate = () => {
    setEditEvent(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (event: MeditationEvent) => {
    setEditEvent(event)
    setForm({
      name: event.name,
      description: event.description || '',
      start_date: event.start_date.split('T')[0],
      end_date: event.end_date.split('T')[0],
      required_hours: event.required_hours,
      is_active: event.is_active,
    })
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = editEvent ? `/api/events/${editEvent.id}` : '/api/events'
      const method = editEvent ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setShowForm(false)
        fetchEvents()
      } else {
        setError(json.error || 'เกิดข้อผิดพลาด')
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบกิจกรรมนี้หรือไม่?')) return
    await fetch(`/api/events/${id}`, { method: 'DELETE' })
    fetchEvents()
  }

  const handleSetActive = async (event: MeditationEvent) => {
    await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: true }),
    })
    fetchEvents()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">จัดการกิจกรรมปฏิบัติธรรม</h2>
          <p className="text-sm text-gray-500">กำหนดชื่อกิจกรรม, ช่วงเวลา และเกณฑ์ชั่วโมงผ่าน</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + เพิ่มกิจกรรม
        </button>
      </div>

      {showForm && (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            {editEvent ? '✏️ แก้ไขกิจกรรม' : '➕ เพิ่มกิจกรรมใหม่'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกิจกรรม *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น ปฏิบัติธรรม ภาคต้น 2568"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น *</label>
                <input
                  type="date" required
                  value={form.start_date}
                  onChange={e => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด *</label>
                <input
                  type="date" required
                  value={form.end_date}
                  onChange={e => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชั่วโมงขั้นต่ำที่ต้องการ (ชั่วโมง)</label>
                <input
                  type="number" min="0" step="0.5"
                  value={form.required_hours}
                  onChange={e => setForm({ ...form, required_hours: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4 text-pink-500 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">ตั้งเป็นกิจกรรมที่กำลังดำเนินอยู่</span>
                </label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย (ไม่บังคับ)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none resize-none"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 pt-2 border-t border-pink-200">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={saving} className="px-6 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg disabled:opacity-60">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-10"><LoadingSpinner /></div>
      ) : events.length === 0 ? (
        <div className="py-10 text-center text-gray-500">
          <p className="text-3xl mb-2">🕌</p>
          <p>ยังไม่มีกิจกรรม</p>
          <p className="text-sm">กดปุ่ม "+ เพิ่มกิจกรรม" เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div
              key={event.id}
              className={`bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${event.is_active ? 'border-pink-300 shadow-sm ring-1 ring-pink-200' : 'border-gray-200'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  {event.is_active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      🟢 กำลังดำเนินอยู่
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(event.start_date), 'd MMM yyyy', { locale: th })} –{' '}
                  {format(new Date(event.end_date), 'd MMM yyyy', { locale: th })}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  ⏱ ต้องการ <strong>{event.required_hours}</strong> ชั่วโมง &nbsp;|&nbsp;
                  📋 บันทึกการสแกน <strong>{event._count?.attendance_logs ?? 0}</strong> รายการ
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!event.is_active && (
                  <button
                    onClick={() => handleSetActive(event)}
                    className="text-xs px-3 py-1.5 border border-green-400 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    ตั้งเป็นกิจกรรมปัจจุบัน
                  </button>
                )}
                <button onClick={() => openEdit(event)} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">✏️ แก้ไข</button>
                <button onClick={() => handleDelete(event.id)} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors">🗑 ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
