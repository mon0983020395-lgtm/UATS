'use client'

import { useState } from 'react'
import QRScanner from '@/components/scan/QRScanner'
import ScanResultDisplay from '@/components/scan/ScanResult'
import ManualEntry from '@/components/scan/ManualEntry'
import type { ScanResult } from '@/types'

export default function ScanPage() {
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState<{ active: boolean; remaining: number } | null>(null)

  const handleScanSuccess = async (decodedText: string) => {
    // Reset state before new scan
    setResult(null)
    setError(null)
    setCooldown(null)

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: decodedText }),
      })
      const json = await res.json()

      if (json.success) {
        setResult(json.data)
      } else if (res.status === 429 && json.data?.cooldown) {
        setCooldown({ active: true, remaining: json.data.remaining })
        
        // Auto count down
        let timeLeft = json.data.remaining
        const timer = setInterval(() => {
          timeLeft -= 1
          if (timeLeft <= 0) {
            clearInterval(timer)
            setCooldown(null)
          } else {
            setCooldown({ active: true, remaining: timeLeft })
          }
        }, 1000)

      } else {
        setError(json.error || 'เกิดข้อผิดพลาดในการสแกน')
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setCooldown(null)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">📷 สแกน QR Code</h1>
        <p className="text-gray-500">สแกน QR Code ของนิสิตเพื่อบันทึกการเข้า-ออก</p>
      </div>

      {result || error || cooldown ? (
        <ScanResultDisplay
          result={result}
          error={error}
          cooldown={cooldown}
          onReset={handleReset}
        />
      ) : (
        <div className="space-y-6">
          <QRScanner onScanSuccess={handleScanSuccess} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">หรือ</span>
            </div>
          </div>

          <ManualEntry
            onResult={setResult}
            onError={setError}
            onCooldown={(remaining) => {
               setCooldown({ active: true, remaining })
               // Auto count down
               let timeLeft = remaining
               const timer = setInterval(() => {
                 timeLeft -= 1
                 if (timeLeft <= 0) {
                   clearInterval(timer)
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
  )
}
