'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'
import Link from 'next/link'

type TextStyle = {
  top: number
  left: number
  fontSize: number
  color: string
  visible: boolean
  fontWeight: 'normal' | 'bold'
  textAlign: 'left' | 'center' | 'right'
}

function BadgeExportContent() {
  const searchParams = useSearchParams()
  const group = searchParams.get('group')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Badge Design State
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [cardSize, setCardSize] = useState({ width: 210, height: 297 })
  
  // Element Positions & Styles
  const [qrStyle, setQrStyle] = useState({ top: 50, left: 50, size: 40 })
  const [nameStyle, setNameStyle] = useState<TextStyle>({ top: 15, left: 50, fontSize: 16, color: '#000000', visible: true, fontWeight: 'bold', textAlign: 'center' })
  const [idStyle, setIdStyle] = useState<TextStyle>({ top: 22, left: 50, fontSize: 12, color: '#666666', visible: true, fontWeight: 'normal', textAlign: 'center' })
  const [groupStyle, setGroupStyle] = useState<TextStyle>({ top: 30, left: 50, fontSize: 14, color: '#e53e3e', visible: true, fontWeight: 'bold', textAlign: 'center' })

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
              color: { dark: '#000000', light: '#FFFFFF00' }
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
      
      const img = new Image()
      img.onload = () => {
        const ratio = img.height / img.width
        setCardSize({ width: 250, height: 250 * ratio })
      }
      img.src = url
    }
  }

  const printDocument = () => {
    window.print()
  }

  const getTransform = (align: 'left' | 'center' | 'right') => {
    if (align === 'left') return 'translate(0%, -50%)'
    if (align === 'right') return 'translate(-100%, -50%)'
    return 'translate(-50%, -50%)'
  }

  const TextControl = ({ label, style, setStyle }: { label: string, style: TextStyle, setStyle: (s: TextStyle) => void }) => (
    <div className="space-y-3 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
      <label className="font-bold text-sm text-gray-700 flex justify-between items-center border-b pb-2">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-normal text-gray-500">แสดงผล</span>
          <input type="checkbox" checked={style.visible} onChange={e => setStyle({...style, visible: e.target.checked})} className="w-4 h-4 text-pink-600 rounded" />
        </div>
      </label>
      
      {style.visible && (
        <div className="space-y-3 text-xs">
          {/* Size & Weight */}
          <div className="flex justify-between items-center gap-2">
            <span>ขนาด ({style.fontSize}px)</span>
            <input type="range" min="8" max="40" value={style.fontSize} onChange={e => setStyle({...style, fontSize: Number(e.target.value)})} className="flex-1" />
            <button 
              onClick={() => setStyle({...style, fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold'})}
              className={`px-2 py-1 rounded border ${style.fontWeight === 'bold' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'}`}
              title="ตัวหนา/ตัวบาง"
            >
              <b>B</b>
            </button>
          </div>
          
          {/* Color & Alignment */}
          <div className="flex justify-between items-center gap-2">
            <span>สีอักษร</span>
            <input type="color" value={style.color} onChange={e => setStyle({...style, color: e.target.value})} className="w-8 h-6 rounded cursor-pointer" />
            
            <div className="flex border rounded overflow-hidden ml-auto">
              <button onClick={() => setStyle({...style, textAlign: 'left'})} className={`px-2 py-1 ${style.textAlign === 'left' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>👈</button>
              <button onClick={() => setStyle({...style, textAlign: 'center'})} className={`px-2 py-1 border-l border-r ${style.textAlign === 'center' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>↔️</button>
              <button onClick={() => setStyle({...style, textAlign: 'right'})} className={`px-2 py-1 ${style.textAlign === 'right' ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}`}>👉</button>
            </div>
          </div>

          {/* X & Y Axis */}
          <div className="space-y-1 pt-1 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span>แกน Y (บน-ล่าง)</span>
              <input type="range" min="0" max="100" value={style.top} onChange={e => setStyle({...style, top: Number(e.target.value)})} className="w-2/3" />
            </div>
            <div className="flex justify-between items-center">
              <span>แกน X (ซ้าย-ขวา)</span>
              <input type="range" min="0" max="100" value={style.left} onChange={e => setStyle({...style, left: Number(e.target.value)})} className="w-2/3" />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>
  if (students.length === 0) return <div className="p-8 text-center">ไม่พบข้อมูลนิสิตในกลุ่มนี้</div>

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      <div className="print:hidden bg-white shadow-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎨 สตูดิโอออกแบบบัตรประจำตัว</h1>
              <p className="text-gray-500 text-sm">อัปโหลดพื้นหลังบัตร ปรับแต่งฟอนต์ สี และการจัดวางได้อย่างอิสระ</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 max-h-[40vh] overflow-y-auto">
            
            {/* Background & QR Code Setup */}
            <div className="space-y-4 lg:col-span-1">
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm space-y-2">
                <label className="font-bold text-sm text-gray-700 border-b pb-2 block">1. พื้นหลัง & QR Code</label>
                <input type="file" accept="image/png, image/jpeg" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-pink-50 text-pink-600 border border-pink-200 py-2 rounded-lg hover:bg-pink-100 transition-colors text-sm font-medium"
                >
                  {bgImage ? 'เปลี่ยนรูปพื้นหลัง' : '+ อัปโหลดรูปจาก Canva'}
                </button>
                
                <div className="space-y-1 text-xs pt-2">
                  <div className="flex justify-between items-center">
                    <span>ขนาด QR ({qrStyle.size}%)</span>
                    <input type="range" min="10" max="90" value={qrStyle.size} onChange={e => setQrStyle({...qrStyle, size: Number(e.target.value)})} className="w-1/2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>แกน Y</span>
                    <input type="range" min="0" max="100" value={qrStyle.top} onChange={e => setQrStyle({...qrStyle, top: Number(e.target.value)})} className="w-1/2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>แกน X</span>
                    <input type="range" min="0" max="100" value={qrStyle.left} onChange={e => setQrStyle({...qrStyle, left: Number(e.target.value)})} className="w-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Controls */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextControl label="2. ชื่อ-สกุล" style={nameStyle} setStyle={setNameStyle} />
              <TextControl label="3. รหัสนิสิต" style={idStyle} setStyle={setIdStyle} />
              <TextControl label="4. กลุ่ม (ถ้ามี)" style={groupStyle} setStyle={setGroupStyle} />
            </div>

          </div>
        </div>
      </div>

      {/* Canvas Area (Printable) */}
      <div className="p-4 md:p-8 max-w-7xl mx-auto print:p-0 print:max-w-none print:m-0">
        {!bgImage && (
          <div className="print:hidden text-center text-gray-500 py-20 border-2 border-dashed border-gray-300 rounded-2xl bg-white">
            <h2 className="text-xl font-bold mb-2">อัปโหลดภาพพื้นหลังบัตรเพื่อเริ่มต้น</h2>
            <p>ออกแบบพื้นหลังใน Canva เว้นที่ว่างสำหรับข้อความ แล้วนำไฟล์มาอัปโหลดที่นี่</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-[2mm]">
          {students.map((st) => (
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
              {!bgImage && <div className="absolute inset-0 border-2 border-gray-200 rounded-lg"></div>}

              {/* QR Code */}
              <div 
                className="absolute transform -translate-y-1/2 bg-white rounded-md print:bg-transparent"
                style={{
                  top: `${qrStyle.top}%`,
                  left: `${qrStyle.left}%`,
                  width: `${qrStyle.size}%`,
                  height: `${qrStyle.size}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <img src={st.qrUrl} alt="QR" className="w-full h-full object-contain mix-blend-multiply" />
              </div>

              {/* Name */}
              {nameStyle.visible && (
                <div 
                  className="absolute whitespace-nowrap"
                  style={{
                    top: `${nameStyle.top}%`,
                    left: `${nameStyle.left}%`,
                    fontSize: `${nameStyle.fontSize}px`,
                    color: nameStyle.color,
                    fontWeight: nameStyle.fontWeight,
                    transform: getTransform(nameStyle.textAlign),
                    textAlign: nameStyle.textAlign
                  }}
                >
                  {st.first_name} {st.last_name}
                </div>
              )}

              {/* Student ID */}
              {idStyle.visible && (
                <div 
                  className="absolute whitespace-nowrap"
                  style={{
                    top: `${idStyle.top}%`,
                    left: `${idStyle.left}%`,
                    fontSize: `${idStyle.fontSize}px`,
                    color: idStyle.color,
                    fontWeight: idStyle.fontWeight,
                    transform: getTransform(idStyle.textAlign),
                    textAlign: idStyle.textAlign
                  }}
                >
                  {st.student_id}
                </div>
              )}

              {/* Group */}
              {groupStyle.visible && st.group && (
                <div 
                  className="absolute whitespace-nowrap"
                  style={{
                    top: `${groupStyle.top}%`,
                    left: `${groupStyle.left}%`,
                    fontSize: `${groupStyle.fontSize}px`,
                    color: groupStyle.color,
                    fontWeight: groupStyle.fontWeight,
                    transform: getTransform(groupStyle.textAlign),
                    textAlign: groupStyle.textAlign
                  }}
                >
                  กลุ่ม: {st.group}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { 
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:break-inside-avoid { break-inside: avoid !important; }
          @page { margin: 5mm; size: A4 portrait; }
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
