'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import Link from 'next/link'

function BadgeExportContent() {
  const searchParams = useSearchParams()
  const group = searchParams.get('group')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Badge Design State
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [cardSize, setCardSize] = useState({ width: 210, height: 297 }) // Default A4 ratio for standard vertical badge
  
  // Element Positions (in percentage to scale properly)
  const [qrStyle, setQrStyle] = useState({ top: 50, left: 50, size: 40 })
  const [nameStyle, setNameStyle] = useState({ top: 15, left: 50, fontSize: 16, color: '#000000', visible: true })
  const [idStyle, setIdStyle] = useState({ top: 22, left: 50, fontSize: 12, color: '#666666', visible: true })
  const [groupStyle, setGroupStyle] = useState({ top: 30, left: 50, fontSize: 14, color: '#e53e3e', visible: true })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        let url = `/api/students?limit=1000`
        if (group) url += `&group=${encodeURIComponent(group)}`
        
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          const withQRs = await Promise.all(json.data.items.map(async (st: any) => {
            const qrUrl = await QRCode.toDataURL(st.qr_token, {
              width: 300,
              margin: 0,
              color: { dark: '#000000', light: '#FFFFFF00' } // transparent background
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBgImage(url)
      
      // Auto-adjust ratio based on image (optional, basic implementation)
      const img = new Image()
      img.onload = () => {
        // Keep a manageable width for screen preview, e.g., 300px base
        const ratio = img.height / img.width
        setCardSize({ width: 250, height: 250 * ratio })
      }
      img.src = url
    }
  }

  const printDocument = () => {
    window.print()
  }

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>
  if (students.length === 0) return <div className="p-8 text-center">ไม่พบข้อมูลนิสิตในกลุ่มนี้</div>

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      {/* Control Panel (Hidden when printing) */}
      <div className="print:hidden bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎨 สตูดิโอออกแบบบัตรประจำตัว</h1>
              <p className="text-gray-500 text-sm">อัปโหลดพื้นหลังบัตรจาก Canva และจัดวางตำแหน่งข้อมูลให้ตรงกัน</p>
            </div>
            <div className="flex gap-2">
              <Link href="/students" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300">
                กลับ
              </Link>
              <button 
                onClick={printDocument}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 shadow-sm flex items-center gap-2"
              >
                🖨️ พิมพ์บัตรทั้งหมด ({students.length} ใบ)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            {/* Background Upload */}
            <div className="space-y-2 lg:col-span-1">
              <label className="font-bold text-sm text-gray-700">1. พื้นหลังบัตร (Canva)</label>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-lg hover:bg-gray-50 hover:border-pink-400 transition-colors text-sm"
              >
                {bgImage ? 'เปลี่ยนรูปพื้นหลัง' : 'อัปโหลดรูปพื้นหลัง'}
              </button>
            </div>

            {/* QR Code Adjustments */}
            <div className="space-y-2 lg:col-span-1">
              <label className="font-bold text-sm text-gray-700">2. ตำแหน่ง QR Code</label>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span>ขนาด: {qrStyle.size}%</span>
                  <input type="range" min="10" max="90" value={qrStyle.size} onChange={e => setQrStyle({...qrStyle, size: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>แกน Y (บน-ล่าง):</span>
                  <input type="range" min="0" max="100" value={qrStyle.top} onChange={e => setQrStyle({...qrStyle, top: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>แกน X (ซ้าย-ขวา):</span>
                  <input type="range" min="0" max="100" value={qrStyle.left} onChange={e => setQrStyle({...qrStyle, left: Number(e.target.value)})} className="w-1/2" />
                </div>
              </div>
            </div>

            {/* Name Adjustments */}
            <div className="space-y-2 lg:col-span-1">
              <label className="font-bold text-sm text-gray-700 flex justify-between">
                <span>3. ชื่อ-สกุล</span>
                <input type="checkbox" checked={nameStyle.visible} onChange={e => setNameStyle({...nameStyle, visible: e.target.checked})} />
              </label>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span>ขนาดอักษร: {nameStyle.fontSize}px</span>
                  <input type="range" min="8" max="40" value={nameStyle.fontSize} onChange={e => setNameStyle({...nameStyle, fontSize: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>แกน Y:</span>
                  <input type="range" min="0" max="100" value={nameStyle.top} onChange={e => setNameStyle({...nameStyle, top: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>สี:</span>
                  <input type="color" value={nameStyle.color} onChange={e => setNameStyle({...nameStyle, color: e.target.value})} className="w-1/2 h-5" />
                </div>
              </div>
            </div>

            {/* ID Adjustments */}
            <div className="space-y-2 lg:col-span-1">
              <label className="font-bold text-sm text-gray-700 flex justify-between">
                <span>4. รหัสนิสิต</span>
                <input type="checkbox" checked={idStyle.visible} onChange={e => setIdStyle({...idStyle, visible: e.target.checked})} />
              </label>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span>แกน Y:</span>
                  <input type="range" min="0" max="100" value={idStyle.top} onChange={e => setIdStyle({...idStyle, top: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>สี:</span>
                  <input type="color" value={idStyle.color} onChange={e => setIdStyle({...idStyle, color: e.target.value})} className="w-1/2 h-5" />
                </div>
              </div>
            </div>

            {/* Group Adjustments */}
            <div className="space-y-2 lg:col-span-1">
              <label className="font-bold text-sm text-gray-700 flex justify-between">
                <span>5. กลุ่ม</span>
                <input type="checkbox" checked={groupStyle.visible} onChange={e => setGroupStyle({...groupStyle, visible: e.target.checked})} />
              </label>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span>แกน Y:</span>
                  <input type="range" min="0" max="100" value={groupStyle.top} onChange={e => setGroupStyle({...groupStyle, top: Number(e.target.value)})} className="w-1/2" />
                </div>
                <div className="flex justify-between items-center">
                  <span>สี:</span>
                  <input type="color" value={groupStyle.color} onChange={e => setGroupStyle({...groupStyle, color: e.target.value})} className="w-1/2 h-5" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Canvas Area (Printable) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto print:p-0 print:max-w-none print:m-0">
        {!bgImage && (
          <div className="print:hidden text-center text-gray-500 py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
            <h2 className="text-xl font-bold mb-2">อัปโหลดภาพพื้นหลังบัตรเพื่อเริ่มต้น</h2>
            <p>ออกแบบพื้นหลังใน Canva เว้นที่ว่างสำหรับ QR Code และข้อความ แล้วนำไฟล์มาอัปโหลดที่นี่</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-[2mm]">
          {students.map((st, index) => (
            <div 
              key={st.id} 
              className="relative overflow-hidden bg-white shadow-sm print:shadow-none print:break-inside-avoid print:border print:border-gray-100"
              style={{
                width: bgImage ? cardSize.width : 250,
                height: bgImage ? cardSize.height : 350,
                backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                margin: '0 auto',
              }}
            >
              {/* Fallback border if no image */}
              {!bgImage && <div className="absolute inset-0 border-2 border-gray-200 rounded-lg"></div>}

              {/* QR Code */}
              <div 
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-md print:bg-transparent"
                style={{
                  top: `${qrStyle.top}%`,
                  left: `${qrStyle.left}%`,
                  width: `${qrStyle.size}%`,
                  height: `${qrStyle.size}%`,
                }}
              >
                <img src={st.qrUrl} alt="QR" className="w-full h-full object-contain mix-blend-multiply" />
              </div>

              {/* Name */}
              {nameStyle.visible && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap"
                  style={{
                    top: `${nameStyle.top}%`,
                    left: `${nameStyle.left}%`,
                    fontSize: `${nameStyle.fontSize}px`,
                    color: nameStyle.color,
                  }}
                >
                  {st.first_name} {st.last_name}
                </div>
              )}

              {/* Student ID */}
              {idStyle.visible && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 font-medium whitespace-nowrap"
                  style={{
                    top: `${idStyle.top}%`,
                    left: `${idStyle.left}%`,
                    fontSize: `${idStyle.fontSize}px`,
                    color: idStyle.color,
                  }}
                >
                  {st.student_id}
                </div>
              )}

              {/* Group */}
              {groupStyle.visible && st.group && (
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 font-bold whitespace-nowrap"
                  style={{
                    top: `${groupStyle.top}%`,
                    left: `${groupStyle.left}%`,
                    fontSize: `${groupStyle.fontSize}px`,
                    color: groupStyle.color,
                  }}
                >
                  กลุ่ม: {st.group}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid !important; }
          @page { 
            margin: 5mm; 
            size: A4 portrait;
          }
        }
      `}} />
    </div>
  )
}

export default function BadgeExportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <BadgeExportContent />
    </Suspense>
  )
}
