'use client'

import { useState } from 'react'
import Link from 'next/link'
import StudentForm from '@/components/students/StudentForm'
import QRCodeDisplay from '@/components/students/QRCodeDisplay'

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState<'single' | 'import'>('single')
  
  // Single Registration State
  const [successData, setSuccessData] = useState<{
    qrCodeDataURL: string
    student: any
  } | null>(null)

  // Import State
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const handleSingleSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      
      if (json.success) {
        setSuccessData({
          qrCodeDataURL: json.data.qrCodeDataURL,
          student: json.data.student,
        })
        return { success: true }
      }
      return { success: false, error: json.error }
    } catch (error) {
      return { success: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' }
    }
  }

  const handleRegisterNew = () => {
    setSuccessData(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setImportResult(null)
      setImportError(null)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setImportResult(null)
    setImportError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', 'skip')

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        setImportResult(json.data)
        setFile(null)
        if (document.getElementById('file-upload')) {
          (document.getElementById('file-upload') as HTMLInputElement).value = ''
        }
      } else {
        setImportError(json.error || 'เกิดข้อผิดพลาดในการนำเข้า')
      }
    } catch (err) {
      setImportError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setImporting(false)
    }
  }

  const handleExportCSV = async () => {
    window.location.href = '/api/export/students'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/students" className="text-gray-500 hover:text-gray-900">
            ← กลับ
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลนิสิต</h1>
            <p className="text-gray-500">เพิ่มข้อมูล ลงทะเบียน หรือนำเข้า/ส่งออกข้อมูล</p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <span>📥</span> ส่งออกเป็น CSV (Export)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'single'
                ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            ลงทะเบียนทีละคน
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            นำเข้าข้อมูลหลายคน (Import CSV)
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'single' && (
            <div>
              {successData ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-6">
                  <div className="text-green-500 text-5xl">✅</div>
                  <h2 className="text-2xl font-bold text-green-700">ลงทะเบียนสำเร็จ!</h2>
                  
                  <div className="flex justify-center">
                    <QRCodeDisplay
                      qrCodeUrl={successData.qrCodeDataURL}
                      studentId={successData.student.student_id}
                      studentName={`${successData.student.first_name} ${successData.student.last_name}`}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleRegisterNew}
                      className="bg-white border-2 border-green-500 text-green-700 hover:bg-green-50 px-6 py-2.5 rounded-xl font-medium transition-colors"
                    >
                      + ลงทะเบียนคนต่อไป
                    </button>
                  </div>
                </div>
              ) : (
                <StudentForm onSubmit={handleSingleSubmit} submitLabel="ลงทะเบียนและสร้าง QR Code" />
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm space-y-2">
                <p><strong>คำแนะนำ:</strong> อัปโหลดไฟล์ CSV ที่มีโครงสร้างคอลัมน์ดังนี้ (ภาษาอังกฤษตัวพิมพ์เล็ก)</p>
                <code className="block bg-white/60 p-2 rounded text-blue-900 border border-blue-200 font-mono text-xs overflow-x-auto">
                  student_id,first_name,last_name,department,group,year,email
                </code>
                <ul className="list-disc list-inside text-blue-700 ml-2">
                  <li><strong>student_id, first_name, last_name, department:</strong> บังคับต้องมี</li>
                  <li><strong>group, year, email:</strong> เว้นว่างได้</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-3xl">
                    📁
                  </div>
                  <div className="text-gray-700 font-medium text-lg">
                    {file ? file.name : 'คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่'}
                  </div>
                  <p className="text-gray-500 text-sm">รองรับไฟล์ .csv และ .json (UTF-8)</p>
                </label>
              </div>

              {importError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
                  ❌ {importError}
                </div>
              )}

              {importResult && (
                <div className="bg-green-50 border border-green-200 p-6 rounded-xl space-y-3">
                  <h3 className="font-bold text-green-800 text-lg">📊 ผลการนำเข้าข้อมูล</h3>
                  <div className="flex gap-6">
                    <div className="text-green-700">
                      ✅ นำเข้าสำเร็จ: <strong>{importResult.success}</strong> รายการ
                    </div>
                    <div className="text-red-600">
                      ❌ ไม่สำเร็จ: <strong>{importResult.failed}</strong> รายการ
                    </div>
                  </div>
                  
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto bg-white rounded-lg border border-red-100 p-3">
                      <p className="font-bold text-red-700 text-sm mb-2">รายการที่ผิดพลาด:</p>
                      <ul className="text-sm space-y-1">
                        {importResult.errors.map((err: any, idx: number) => (
                          <li key={idx} className="text-red-600 border-b border-gray-50 pb-1">
                            แถว {err.row} (รหัส: {err.student_id}) - {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'กำลังนำเข้าข้อมูล...' : 'เริ่มนำเข้าข้อมูล'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
