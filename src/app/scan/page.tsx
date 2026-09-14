'use client'

import { useState, useRef, useEffect } from 'react'
import QRScanner from '@/components/scan/QRScanner'
import ManualEntry from '@/components/scan/ManualEntry'
import type { ScanResult } from '@/types'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

// Web Audio sound effects
function playSound(type: 'success' | 'warning' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.type = 'sine'
      osc.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.08) // B5
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } else if (type === 'warning') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    }
  } catch (e) {
    // Ignore audio permission restrictions
  }
}

interface ScanHistoryItem {
  id: string
  student_id: string
  first_name: string
  last_name: string
  department: string
  group?: string | null
  scan_type: 'IN' | 'OUT'
  is_late?: boolean
  scanned_at: string
}

export default function ScanPage() {
  const [latestResult, setLatestResult] = useState<ScanResult | null>(null)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [errorNotice, setErrorNotice] = useState<string | null>(null)
  const [cooldownNotice, setCooldownNotice] = useState<string | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [flash, setFlash] = useState(false)
  
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearNoticeTimer = () => {
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current)
      noticeTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearNoticeTimer()
  }, [])

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 300)
  }

  const handleScanSuccess = async (decodedText: string) => {
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: decodedText }),
      })
      const json = await res.json()

      if (json.success) {
        playSound('success')
        triggerFlash()
        setLatestResult(json.data)
        setErrorNotice(null)
        setCooldownNotice(null)

        // Prepend to live history feed (keep last 8 items)
        const newItem: ScanHistoryItem = {
          id: Math.random().toString(),
          student_id: json.data.student.student_id,
          first_name: json.data.student.first_name,
          last_name: json.data.student.last_name,
          department: json.data.student.department,
          group: json.data.student.group,
          scan_type: json.data.scan_type,
          is_late: json.data.is_late,
          scanned_at: json.data.scanned_at,
        }
        setHistory((prev) => [newItem, ...prev.slice(0, 7)])

      } else if (res.status === 429 && json.data?.cooldown) {
        playSound('warning')
        setCooldownNotice(`นิสิตคนนี้เพิ่งสแกนไป (กรุณารอ ${json.data.remaining} วินาที)`)
        clearNoticeTimer()
        noticeTimerRef.current = setTimeout(() => {
          setCooldownNotice(null)
        }, 3000)
      } else {
        playSound('error')
        setErrorNotice(json.error || 'ไม่พบข้อมูลนิสิตในระบบ')
        clearNoticeTimer()
        noticeTimerRef.current = setTimeout(() => {
          setErrorNotice(null)
        }, 3500)
      }
    } catch (err) {
      playSound('error')
      setErrorNotice('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      clearNoticeTimer()
      noticeTimerRef.current = setTimeout(() => {
        setErrorNotice(null)
      }, 3500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white px-5 py-3.5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>📷 จุดสแกนเข้า-ออกอัตโนมัติ</span>
            <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-normal">
              ⚡ ยื่นบัตรแล้วเดินเข้าได้เลย
            </span>
          </h1>
          <p className="text-pink-100 text-xs mt-0.5">
            สแกนต่อเนื่องความเร็วสูง ไม่ต้องกดปุ่มใดๆ ทั้งสิ้น
          </p>
        </div>
        <div className="bg-black/20 px-3 py-1.5 rounded-xl text-xs font-medium self-end sm:self-auto">
          สแกนในเซสชันนี้: <strong className="text-white text-sm">{history.length}</strong> คน
        </div>
      </div>

      {/* Floating Temporary Alerts (Auto-dismisses without interrupting next scans) */}
      {cooldownNotice && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span>{cooldownNotice}</span>
          </div>
          <span className="text-xs text-amber-700">(คนถัดไปสแกนต่อได้ทันที)</span>
        </div>
      )}

      {errorNotice && (
        <div className="bg-red-100 border border-red-300 text-red-900 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <span>{errorNotice}</span>
          </div>
          <button onClick={() => setErrorNotice(null)} className="text-xs text-red-700 hover:underline">
            ✕ ปิด
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Camera (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className={`transition-all duration-200 ${flash ? 'ring-4 ring-emerald-400 rounded-2xl' : ''}`}>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </div>

          {/* Collapsible Manual Entry */}
          <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <button
              onClick={() => setShowManual(!showManual)}
              className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-600 hover:bg-gray-50 flex justify-between items-center"
            >
              <span>⌨️ กรอกรหัสนิสิตด้วยตนเอง (กรณีไม่มีบัตร)</span>
              <span className="text-gray-400">{showManual ? '▲ ซ่อน' : '▼ เปิด'}</span>
            </button>
            
            {showManual && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <ManualEntry
                  onResult={(res) => {
                    playSound('success')
                    triggerFlash()
                    setLatestResult(res)
                    setErrorNotice(null)
                    setCooldownNotice(null)
                    setHistory((prev) => [
                      {
                        id: Math.random().toString(),
                        student_id: res.student.student_id,
                        first_name: res.student.first_name,
                        last_name: res.student.last_name,
                        department: res.student.department,
                        scan_type: res.scan_type,
                        is_late: res.is_late,
                        scanned_at: res.scanned_at,
                      },
                      ...prev.slice(0, 7)
                    ])
                  }}
                  onError={(err) => {
                    playSound('error')
                    setErrorNotice(err)
                  }}
                  onCooldown={(remaining) => {
                    playSound('warning')
                    setCooldownNotice(`นิสิตคนนี้เพิ่งสแกนไป (กรุณารอ ${remaining} วินาที)`)
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Latest Scan & Live Feed (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Latest Student Card */}
          {latestResult ? (
            <div
              className={`rounded-2xl border-2 p-5 text-center shadow-md animate-in fade-in zoom-in-95 duration-150 ${
                latestResult.scan_type === 'IN'
                  ? 'bg-emerald-50/90 border-emerald-400'
                  : 'bg-sky-50/90 border-sky-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">{latestResult.scan_type === 'IN' ? '🟢' : '🔵'}</span>
                <span
                  className={`px-3.5 py-0.5 rounded-full text-sm font-bold text-white shadow-sm ${
                    latestResult.scan_type === 'IN' ? 'bg-emerald-600' : 'bg-sky-600'
                  }`}
                >
                  {latestResult.scan_type === 'IN' ? '✔ บันทึกเข้าสำเร็จ' : '✔ บันทึกออกสำเร็จ'}
                </span>
                {latestResult.is_late && latestResult.scan_type === 'IN' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-800 border border-amber-300">
                    ⚠️ เข้าสาย
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-0.5">
                {latestResult.student.first_name} {latestResult.student.last_name}
              </h2>
              <p className="text-sm font-mono font-bold text-gray-600 mb-1">
                {latestResult.student.student_id}
              </p>
              <div className="flex justify-center gap-2 text-xs text-gray-500 mb-2">
                <span>{latestResult.student.department}</span>
                {latestResult.student.group && (
                  <span className="text-pink-600 font-semibold">• กลุ่ม {latestResult.student.group}</span>
                )}
              </div>

              <div className="text-xs text-gray-400 font-medium bg-white/70 py-1 px-3 rounded-lg inline-block border border-gray-100">
                เวลา: {format(new Date(latestResult.scanned_at), 'HH:mm:ss น.', { locale: th })}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🪪</div>
              <div className="font-semibold text-gray-600 text-base">พร้อมรับการสแกน</div>
              <p className="text-xs mt-1">ยื่น QR Code นิสิตหน้ากล้องเพื่อบันทึกทันที</p>
            </div>
          )}

          {/* Live Recent Feed */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>📋 รายการสแกนล่าสุด ({history.length})</span>
              <span className="text-[10px] font-normal text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                บันทึกสดอัตโนมัติ
              </span>
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                ยังไม่มีการสแกนในรอบนี้
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white ${
                          item.scan_type === 'IN' ? 'bg-emerald-500' : 'bg-sky-500'
                        }`}
                      >
                        {item.scan_type === 'IN' ? 'IN' : 'OUT'}
                      </span>
                      <div>
                        <div className="font-bold text-gray-800">
                          {item.first_name} {item.last_name}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono">
                          {item.student_id} {item.group ? `• กลุ่ม ${item.group}` : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono text-gray-700 font-medium">
                        {format(new Date(item.scanned_at), 'HH:mm:ss', { locale: th })}
                      </div>
                      {item.is_late && item.scan_type === 'IN' && (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          สาย
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
