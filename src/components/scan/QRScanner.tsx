'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
  disabled?: boolean
}

export default function QRScanner({ onScanSuccess, disabled = false }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null)
  const isBusyRef = useRef(false)

  const onScanSuccessRef = useRef(onScanSuccess)
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 15, 
          qrbox: { width: 260, height: 260 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
        },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          if (disabled || isBusyRef.current) return

          const now = Date.now()
          // Debounce same QR code within 3.5 seconds to prevent spamming
          if (
            lastScannedRef.current &&
            lastScannedRef.current.text === decodedText &&
            now - lastScannedRef.current.time < 3500
          ) {
            return
          }

          lastScannedRef.current = { text: decodedText, time: now }
          isBusyRef.current = true

          onScanSuccessRef.current(decodedText)

          // Allow next scan after 1.5 seconds cooldown
          setTimeout(() => {
            isBusyRef.current = false
          }, 1500)
        },
        () => {
          // Ignore normal scan frame errors
        }
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [disabled])

  const togglePause = () => {
    if (!scannerRef.current) return
    if (isPaused) {
      scannerRef.current.resume()
      setIsPaused(false)
    } else {
      scannerRef.current.pause(true)
      setIsPaused(true)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 overflow-hidden relative">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-green-500 animate-pulse'}`} />
          <span className="text-xs font-medium text-gray-600">
            {isPaused ? 'พักการสแกน' : 'กล้องพร้อมสแกนต่อเนื่อง'}
          </span>
        </div>
        <button
          onClick={togglePause}
          className="text-xs text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition-colors"
        >
          {isPaused ? '▶️ เปิดกล้อง' : '⏸️ พักกล้อง'}
        </button>
      </div>

      <div id="qr-reader" className="w-full"></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader img { display: none; }
        #qr-reader__dashboard_section_csr span { margin-right: 10px; font-size: 13px; }
        #qr-reader__dashboard_section_csr select { 
          padding: 6px 10px; 
          border-radius: 8px; 
          border: 1px solid #ddd; 
          margin-bottom: 8px;
          font-size: 13px;
        }
        #qr-reader__dashboard_section_csr button { 
          background-color: #ec4899; 
          color: white; 
          border: none; 
          padding: 6px 14px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          margin: 4px;
        }
        #qr-reader__dashboard_section_swaplink { display: none; }
      `}} />
    </div>
  )
}
