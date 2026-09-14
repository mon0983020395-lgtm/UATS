'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QRCode from 'qrcode'
import Link from 'next/link'

function ExportQRContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialGroup = searchParams.get('group') || ''
  
  const [group, setGroup] = useState(initialGroup)
  const [groups, setGroups] = useState<string[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then(j => {
        if (j.success) setGroups(j.data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        let url = `/api/students?limit=5000&sort=student_id`
        if (group) url += `&group=${encodeURIComponent(group)}`
        
        const res = await fetch(url)
        const json = await res.json()
        if (json.success && json.data?.items) {
          const withQRs = await Promise.all(json.data.items.map(async (st: any) => {
            const qrUrl = await QRCode.toDataURL(st.qr_token, {
              width: 250,
              margin: 1,
            })
            return { ...st, qrUrl }
          }))
          setStudents(withQRs)
        } else {
          setStudents([])
        }
      } catch (err) {
        console.error(err)
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [group])

  const handleGroupChange = (newGroup: string) => {
    setGroup(newGroup)
    const params = new URLSearchParams()
    if (newGroup) params.set('group', newGroup)
    router.replace(`/export/qr${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="print:hidden p-4 bg-gray-100 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-50">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/students"
            className="text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm font-medium"
          >
            ← กลับ
          </Link>
          <div>
            <h1 className="text-xl font-bold">พิมพ์ QR Code {group ? `กลุ่ม: ${group}` : '(ทั้งหมด)'}</h1>
            <p className="text-xs text-gray-600">จำนวน: {students.length} คน</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={group}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">ทุกกลุ่ม (ทั้งหมด)</option>
            {groups.map(g => (
              <option key={g} value={g}>กลุ่ม: {g}</option>
            ))}
          </select>

          <button 
            onClick={() => window.print()}
            disabled={students.length === 0}
            className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap"
          >
            🖨️ พิมพ์ / PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-3"></div>
          กำลังโหลดข้อมูลและสร้าง QR Code...
        </div>
      ) : students.length === 0 ? (
        <div className="p-20 text-center text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <div className="font-bold text-lg text-gray-700">ไม่พบข้อมูลนิสิต</div>
          <p className="text-sm mt-1">{group ? `ไม่มีนิสิตในกลุ่ม "${group}"` : 'ยังไม่มีนิสิตในระบบ'}</p>
        </div>
      ) : (
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-4 print:gap-4">
            {students.map(st => (
              <div key={st.id} className="border border-gray-300 rounded-lg p-3 text-center flex flex-col items-center justify-between h-[280px] break-inside-avoid shadow-sm print:shadow-none">
                <div className="w-full">
                  <div className="font-bold text-sm truncate w-full" title={`${st.first_name} ${st.last_name}`}>
                    {st.first_name} {st.last_name}
                  </div>
                  <div className="text-xs text-gray-500">{st.student_id}</div>
                  {st.group && <div className="text-xs text-pink-600 font-medium">กลุ่ม: {st.group}</div>}
                </div>
                <img src={st.qrUrl} alt="QR Code" className="w-36 h-36 object-contain my-2" />
                <div className="text-[10px] text-gray-400 font-mono truncate w-full px-1">
                  {st.qr_token.substring(0, 13)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid { break-inside: avoid !important; }
          @page { margin: 8mm; size: A4 portrait; }
        }
      `}} />
    </div>
  )
}

export default function ExportQRPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <ExportQRContent />
    </Suspense>
  )
}
