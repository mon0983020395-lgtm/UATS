'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  const onScanSuccessRef = useRef(onScanSuccess)
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true
        },
        false
      )

      scannerRef.current.render(
        (decodedText) => {
          setIsScanning(false)
          scannerRef.current?.pause(true)
          onScanSuccessRef.current(decodedText)
        },
        () => {
          // Ignore routine scan errors
        }
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden relative">
      <div id="qr-reader" className="w-full"></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader img { display: none; }
        #qr-reader__dashboard_section_csr span { margin-right: 10px; font-size: 14px; }
        #qr-reader__dashboard_section_csr select { 
          padding: 6px; 
          border-radius: 8px; 
          border: 1px solid #ddd; 
          margin-bottom: 10px;
        }
        #qr-reader__dashboard_section_csr button { 
          background-color: #ec4899; 
          color: white; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 8px; 
          cursor: pointer;
          font-weight: 500;
          margin: 5px;
        }
        #qr-reader__dashboard_section_swaplink { display: none; }
      `}} />

      {!isScanning && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <button
            onClick={() => {
              setIsScanning(true)
              scannerRef.current?.resume()
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg transition-colors"
          >
            📷 เปิดกล้องเพื่อสแกนต่อ
          </button>
        </div>
      )}
    </div>
  )
}
