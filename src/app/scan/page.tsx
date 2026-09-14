'use client'

import { useState, useRef, useEffect } from 'react'
import QRScanner from '@/components/scan/QRScanner'
import ScanResultDisplay from '@/components/scan/ScanResult'
import ManualEntry from '@/components/scan/ManualEntry'
import type { ScanResult } from '@/types'

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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else if (type === 'warning') {
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } else {
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    }
  } catch (e) {
    // Ignore audio permission restrictions
  }
}

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<{ active: boolean; remaining: number } | null>(null)
  const [showManual, setShowManual] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearExistingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearExistingTimer()
  }, [])

  const handleScanSuccess = async (decodedText: string) => {
    setIsProcessing(true)
    clearExistingTimer()

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: decodedText }),
      })
      const json = await res.json()

      if (json.success) {
        playSound('success')
        setResult(json.data)
        setError(null)
        setCooldown(null)
      } else if (res.status === 429 && json.data?.cooldown) {
        playSound('warning')
        setResult(null)
        setError(null)
        
        let timeLeft = json.data.remaining
        setCooldown({ active: true, remaining: timeLeft })

        timerRef.current = setInterval(() => {
          timeLeft -= 1
          if (timeLeft <= 0) {
            clearExistingTimer()
            setCooldown(null)
          } else {
            setCooldown({ active: true, remaining: timeLeft })
          }
        }, 1000)
      } else {
        playSound('error')
        setResult(null)
        setError(json.error || 'เกิดข้อผิดพลาดในการสแกน')
        setCooldown(null)
      }
    } catch (err) {
      playSound('error')
      setResult(null)
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
      setCooldown(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    clearExistingTimer()
    setResult(null)
    setError(null)
    setCooldown(null)
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">📷 สแกน QR Code</h1>
        <p className="text-gray-500 text-sm">ถือบัตรห้อยคอหรือ QR Code หน้ากล้องเพื่อบันทึกเวลา</p>
      </div>

      {/* Persistent Camera Scanner (Never unmounts) */}
      <div className="relative">
        <QRScanner onScanSuccess={handleScanSuccess} disabled={isProcessing} />
        {isProcessing && (
          <div className="absolute top-2 right-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-md shadow-md animate-pulse">
            กำลังบันทึก...
          </div>
        )}
      </div>

      {/* Result Display Banner right below camera */}
      {(result || error || cooldown) && (
        <div className="pt-1">
          <ScanResultDisplay
            result={result}
            error={error}
            cooldown={cooldown}
            onReset={handleReset}
          />
        </div>
      )}

      {/* Collapsible Manual Entry */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <button
          onClick={() => setShowManual(!showManual)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 flex justify-between items-center"
        >
          <span>⌨️ สแกนไม่ได้ หรือกล้องมีปัญหา? (กรอกรหัสนิสิตด้วยตนเอง)</span>
          <span className="text-xs text-gray-400">{showManual ? '▲ ซ่อน' : '▼ เปิด'}</span>
        </button>
        
        {showManual && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <ManualEntry
              onResult={(res) => {
                playSound('success')
                setResult(res)
                setError(null)
                setCooldown(null)
              }}
              onError={(err) => {
                playSound('error')
                setError(err)
                setResult(null)
                setCooldown(null)
              }}
              onCooldown={(remaining) => {
                playSound('warning')
                clearExistingTimer()
                setResult(null)
                setError(null)
                let timeLeft = remaining
                setCooldown({ active: true, remaining: timeLeft })
                timerRef.current = setInterval(() => {
                  timeLeft -= 1
                  if (timeLeft <= 0) {
                    clearExistingTimer()
                    setCooldown(null)
                  } else {
                    setCooldown({ active: true, remaining: timeLeft })
                  }
                }, 1000)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
