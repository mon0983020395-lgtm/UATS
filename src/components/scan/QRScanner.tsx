'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    // กำหนดตั้งค่า scanner
    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    const handleSuccess = (decodedText: string) => {
      // เมื่อแสกนสำเร็จ หยุดชั่วคราว
      setIsScanning(false)
      scannerRef.current?.pause(true)
      onScanSuccess(decodedText)
    }

    const handleError = (err: any) => {
      // Ignore routine scan errors
    }

    if (isScanning) {
      scannerRef.current.render(handleSuccess, handleError)
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScanSuccess, isScanning])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden">
      <div id="qr-reader" className="w-full"></div>
      {!isScanning && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsScanning(true)
              scannerRef.current?.resume()
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            เปิดกล้องอีกครั้ง
          </button>
        </div>
      )}
    </div>
  )
}
