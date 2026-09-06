'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import type { EventSession } from '@/types'

interface SessionManagerProps {
  eventId: number
}

export default function SessionManager({ eventId }: SessionManagerProps) {
  const [sessions, setSessions] = useState<EventSession[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '' })
  const [saving, setSaving] = useState(false)

  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
    templates: [
      { name: 'รอบเช้ามืด', start_time: '04:00', end_time: '06:00' },
      { name: 'รอบสาย', start_time: '09:00', end_time: '11:00' },
      { name: 'รอบบ่าย', start_time: '13:00', end_time: '16:00' },
      { name: 'รอบค่ำ', start_time: '18:00', end_time: '21:00' }
    ]
  })

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}/sessions`)
      const json = await res.json()
      if (json.success) setSessions(json.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: '', start_time: '', end_time: '' })
        fetchSessions()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${eventId}/sessions/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkForm),
      })
      if (res.ok) {
        setShowBulkForm(false)
        fetchSessions()
        alert('สร้างรอบอัตโนมัติสำเร็จ')
      } else {
        const err = await res.json()
        alert('ผิดพลาด: ' + err.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (sessionId: number) => {
    if (!confirm('ต้องการลบช่วงเวลานี้หรือไม่?')) return
    await fetch(`/api/events/${eventId}/sessions/${sessionId}`, { method: 'DELETE' })
    fetchSessions()
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700">🕒 รอบการอบรม (Sessions)</h4>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowBulkForm(!showBulkForm); setShowForm(false) }}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            ⚡ สร้างรายวัน (Bulk)
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setShowBulkForm(false) }}
            className="text-xs text-pink-600 hover:text-pink-700 font-medium"
          >
            + เพิ่มรอบแบบกำหนดเอง
          </button>
        </div>
      </div>

      {showBulkForm && (
        <form onSubmit={handleBulkSubmit} className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-200">
          <h5 className="text-sm font-medium text-blue-800 mb-3">⚡ สร้างรอบปฏิบัติธรรมอัตโนมัติ</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ตั้งแต่วันที่</label>
              <input type="date" required value={bulkForm.startDate} onChange={e => setBulkForm({...bulkForm, startDate: e.target.value})} className="w-full border rounded px-2 py-1 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ถึงวันที่</label>
              <input type="date" required value={bulkForm.endDate} onChange={e => setBulkForm({...bulkForm, endDate: e.target.value})} className="w-full border rounded px-2 py-1 text-sm outline-none" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-2">รูปแบบรอบในแต่ละวัน (เวลา 00:00 - 23:59)</label>
            {bulkForm.templates.map((t, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input type="text" value={t.name} onChange={e => {
                  const newT = [...bulkForm.templates]; newT[idx].name = e.target.value; setBulkForm({...bulkForm, templates: newT})
                }} className="flex-1 border rounded px-2 py-1 text-xs outline-none" placeholder="ชื่อรอบ" required />
                <input type="time" value={t.start_time} onChange={e => {
                  const newT = [...bulkForm.templates]; newT[idx].start_time = e.target.value; setBulkForm({...bulkForm, templates: newT})
                }} className="w-24 border rounded px-2 py-1 text-xs outline-none" required />
                <span className="text-xs text-gray-500">-</span>
                <input type="time" value={t.end_time} onChange={e => {
                  const newT = [...bulkForm.templates]; newT[idx].end_time = e.target.value; setBulkForm({...bulkForm, templates: newT})
                }} className="w-24 border rounded px-2 py-1 text-xs outline-none" required />
                <button type="button" onClick={() => {
                  setBulkForm({...bulkForm, templates: bulkForm.templates.filter((_, i) => i !== idx)})
                }} className="text-red-500 hover:text-red-700 font-bold px-1">&times;</button>
              </div>
            ))}
            <button type="button" onClick={() => setBulkForm({...bulkForm, templates: [...bulkForm.templates, { name: 'รอบใหม่', start_time: '00:00', end_time: '01:00' }]})} className="text-xs text-blue-600 hover:underline mt-1">+ เพิ่มรอบในเทมเพลต</button>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowBulkForm(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded">ยกเลิก</button>
            <button type="submit" disabled={saving || bulkForm.templates.length === 0} className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50">
              สร้างอัตโนมัติ
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ชื่อรอบ</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น รอบเช้า"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">เวลาเริ่ม (รวมวันที่)</label>
              <input
                required
                type="datetime-local"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-pink-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">เวลาสิ้นสุด (รวมวันที่)</label>
              <input
                required
                type="datetime-local"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-pink-400"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-200 rounded">ยกเลิก</button>
            <button type="submit" disabled={saving} className="px-3 py-1 text-xs text-white bg-pink-500 hover:bg-pink-600 rounded disabled:opacity-50">
              บันทึก
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-xs text-gray-500 py-2">กำลังโหลด...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-xs text-gray-400 py-2">ยังไม่มีการแบ่งรอบการอบรม</div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {sessions.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 rounded p-2 text-sm hover:shadow-sm transition-shadow">
              <div>
                <span className="font-medium text-gray-800">{s.name}</span>
                <span className="text-gray-500 ml-2 text-xs">
                  {format(new Date(s.start_time), 'd MMM yyyy HH:mm', { locale: th })} - {format(new Date(s.end_time), 'HH:mm', { locale: th })}
                </span>
              </div>
              <button
                onClick={() => handleDelete(s.id)}
                className="text-red-500 hover:text-red-700 text-xs px-2"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
