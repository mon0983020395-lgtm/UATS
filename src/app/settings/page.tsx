'use client'

import { useState } from 'react'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function SettingsPage() {
  const [importLoading, setImportLoading] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    errors: { row: number; error: string }[]
  } | null>(null)

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // 1. นำเข้าข้อมูล (Import)
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportResult(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string
        const Papa = await import('papaparse')
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const data = results.data
            try {
              const res = await fetch('/api/import?mode=skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
              })
              const json = await res.json()
              if (json.success) {
                setImportResult(json.data)
              } else {
                alert('เกิดข้อผิดพลาดในการนำเข้า: ' + json.error)
              }
            } catch (err) {
              alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
            } finally {
              setImportLoading(false)
            }
          },
          error: (error: any) => {
            alert('อ่านไฟล์ CSV ล้มเหลว: ' + error.message)
            setImportLoading(false)
          },
        })
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์')
        setImportLoading(false)
      }
    }
    
    // reset input
    e.target.value = ''
    reader.readAsText(file, 'utf-8')
  }

  // 2. ส่งออกข้อมูลนิสิต (CSV)
  const handleExportStudents = () => {
    window.location.href = '/api/export/students'
  }

  // 3. ส่งออกข้อมูลประวัติการสแกน (CSV)
  const handleExportAttendance = () => {
    window.location.href = '/api/export/attendance'
  }

  // 4. ลบข้อมูลทั้งหมด
  const handleResetData = async () => {
    setResetLoading(true)
    try {
      const res = await fetch('/api/reset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'ยืนยันลบ' }),
      })
      const json = await res.json()
      if (json.success) {
        alert('ลบข้อมูลทั้งหมดในระบบเรียบร้อยแล้ว')
      } else {
        alert('เกิดข้อผิดพลาด: ' + json.error)
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setResetLoading(false)
      setIsResetConfirmOpen(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">การตั้งค่าและจัดการข้อมูล</h1>
        <p className="text-gray-500">นำเข้า ส่งออก และจัดการข้อมูลในระบบ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Import Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">📥 นำเข้าข้อมูลนิสิต (Import)</h2>
          <p className="text-sm text-gray-500 mb-6">
            อัปโหลดไฟล์ CSV เพื่อเพิ่มรายชื่อนิสิตทีละหลายคน 
            (คอลัมน์: student_id, first_name, last_name, department, year, email)
          </p>

          <label className="block w-full">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
              disabled={importLoading}
            />
            <div className={`w-full text-center py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              importLoading ? 'bg-gray-50 border-gray-300' : 'bg-pink-50 border-pink-200 hover:border-pink-400'
            }`}>
              {importLoading ? (
                <span className="text-gray-500">กำลังประมวลผล...</span>
              ) : (
                <>
                  <div className="text-3xl mb-2">📄</div>
                  <span className="text-pink-600 font-medium">คลิกเพื่ออัปโหลดไฟล์ .CSV</span>
                </>
              )}
            </div>
          </label>

          {importResult && (
            <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm">
              <p className="font-bold mb-2">ผลลัพธ์การนำเข้า:</p>
              <ul className="space-y-1">
                <li className="text-green-600">✅ สำเร็จ: {importResult.success} รายการ</li>
                <li className="text-red-600">❌ ล้มเหลว: {importResult.failed} รายการ</li>
              </ul>
              {importResult.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto border-t border-gray-200 pt-2">
                  <p className="text-xs text-gray-500 font-medium mb-1">รายละเอียดข้อผิดพลาด:</p>
                  {importResult.errors.map((e, idx) => (
                    <p key={idx} className="text-xs text-red-500">
                      แถวที่ {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export Section */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">📤 ส่งออกข้อมูล (Export)</h2>
          <p className="text-sm text-gray-500 mb-6">ดาวน์โหลดข้อมูลในระบบออกมาในรูปแบบไฟล์ CSV เพื่อนำไปวิเคราะห์ต่อ</p>
          
          <div className="space-y-3">
            <button
              onClick={handleExportStudents}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">👥 ส่งออกรายชื่อนิสิต</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">.CSV</span>
            </button>
            <button
              onClick={handleExportAttendance}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">📅 ส่งออกประวัติการสแกน</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-md">.CSV</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="md:col-span-2 bg-red-50 p-6 rounded-2xl border border-red-200 shadow-sm mt-4">
          <h2 className="text-lg font-bold text-red-700 mb-2">⚠️ เขตอันตราย (Danger Zone)</h2>
          <p className="text-sm text-red-600 mb-6">
            การกระทำในส่วนนี้จะส่งผลกระทบโดยตรงต่อฐานข้อมูล โปรดใช้งานด้วยความระมัดระวัง
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl border border-red-100">
            <div>
              <h3 className="font-bold text-gray-900">ล้างข้อมูลทั้งหมดในระบบ</h3>
              <p className="text-sm text-gray-500">ลบรายชื่อนิสิตและประวัติการสแกนทั้งหมด (ไม่สามารถกู้คืนได้)</p>
            </div>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="mt-4 sm:mt-0 px-6 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-xl transition-colors whitespace-nowrap"
            >
              ลบข้อมูลทั้งหมด
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="⚠️ ยืนยันการล้างข้อมูลทั้งหมด"
        message="การกระทำนี้จะลบข้อมูล 'นิสิตทั้งหมด' และ 'ประวัติการสแกนทั้งหมด' ออกจากฐานข้อมูลแบบถาวร ไม่สามารถกู้คืนกลับมาได้อีก คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?"
        confirmLabel={resetLoading ? 'กำลังประมวลผล...' : 'ยืนยันลบข้อมูลทั้งหมด'}
        cancelLabel="ยกเลิก"
        dangerous={true}
        onConfirm={handleResetData}
        onCancel={() => !resetLoading && setIsResetConfirmOpen(false)}
      />
    </div>
  )
}
