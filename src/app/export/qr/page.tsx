'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'

function ExportQRContent() {
  const searchParams = useSearchParams()
  const group = searchParams.get('group')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all students matching the group, maybe with a large limit
    const fetchAll = async () => {
      try {
        let url = `/api/students?limit=1000`
        if (group) url += `&group=${encodeURIComponent(group)}`
        
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          // Generate QR data URLs
          const withQRs = await Promise.all(json.data.items.map(async (st: any) => {
            const qrUrl = await QRCode.toDataURL(st.qr_token, {
              width: 200,
              margin: 1,
            })
            return { ...st, qrUrl }
          }))
          setStudents(withQRs)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [group])

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>

  if (students.length === 0) return <div className="p-8 text-center">ไม่พบข้อมูลนิสิตในกลุ่มนี้</div>

  return (
    <div className="bg-white min-h-screen text-black">
      <div className="print:hidden p-4 bg-gray-100 border-b flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">พิมพ์ QR Code {group ? `กลุ่ม: ${group}` : '(ทั้งหมด)'}</h1>
          <p className="text-sm text-gray-600">จำนวน: {students.length} คน</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 shadow-sm"
        >
          🖨️ พิมพ์ / บันทึกเป็น PDF
        </button>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-4 print:gap-4">
          {students.map(st => (
            <div key={st.id} className="border border-gray-300 rounded-lg p-3 text-center flex flex-col items-center justify-between h-[280px] break-inside-avoid">
              <div className="w-full">
                <div className="font-bold text-sm truncate w-full" title={st.first_name + ' ' + st.last_name}>
                  {st.first_name} {st.last_name}
                </div>
                <div className="text-xs text-gray-500">{st.student_id}</div>
                {st.group && <div className="text-xs text-pink-600 font-medium">กลุ่ม: {st.group}</div>}
              </div>
              <img src={st.qrUrl} alt="QR Code" className="w-40 h-40 object-contain my-2" />
              <div className="text-[10px] text-gray-400 font-mono truncate w-full px-2">
                {st.qr_token.substring(0, 13)}...
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid { break-inside: avoid; }
          @page { margin: 1cm; size: A4; }
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
