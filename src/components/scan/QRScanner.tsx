'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null)
  const onScanSuccessRef = useRef(onScanSuccess)

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess
  }, [onScanSuccess])

  // 1. Get Cameras on mount
  useEffect(() => {
    let isMounted = true

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Prefer external webcam if available, or first camera
          const externalWebcam = devices.find(
            (d) => !d.label.toLowerCase().includes('integrated') && !d.label.toLowerCase().includes('front')
          )
          setSelectedCamera(externalWebcam ? externalWebcam.id : devices[0].id)
        } else {
          setCameraError('ไม่พบกล้องในอุปกรณ์นี้')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Camera detection error:', err)
        setCameraError('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้องในเบราว์เซอร์')
      })

    return () => {
      isMounted = false
    }
  }, [])

  // 2. Start scanner when camera is selected
  useEffect(() => {
    if (!selectedCamera) return

    const qrContainerId = 'qr-reader-video-box'
    const html5QrCode = new Html5Qrcode(qrContainerId)
    scannerRef.current = html5QrCode

    let isCancelled = false

    html5QrCode
      .start(
        selectedCamera,
        {
          fps: 20, // High frame rate for ultra-fast scanning
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const now = Date.now()
          // Debounce only the EXACT same QR code within 2.5 seconds
          // Different students scan with 0ms delay!
          if (
            lastScannedRef.current &&
            lastScannedRef.current.text === decodedText &&
            now - lastScannedRef.current.time < 2500
          ) {
            return
          }

          lastScannedRef.current = { text: decodedText, time: now }
          onScanSuccessRef.current(decodedText)
        },
        () => {
          // Ignore normal scan frame misses
        }
      )
      .then(() => {
        if (!isCancelled) {
          setIsScanning(true)
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to start camera:', err)
          setCameraError('เปิดกล้องไม่สำเร็จ กรุณาตรวจสอบว่าไม่มีโปรแกรมอื่นใช้งานกล้องอยู่')
        }
      })

    return () => {
      isCancelled = true
      setIsScanning(false)
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear()
          })
          .catch((e) => {
            console.warn('Error stopping scanner:', e)
          })
      } else {
        html5QrCode.clear()
      }
    }
  }, [selectedCamera])

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 overflow-hidden relative">
      {/* Clean single camera bar controlled purely by React */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isScanning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs font-semibold text-gray-700">
            {isScanning ? '⚡ กล้องทำงานปกติ พร้อมสแกนต่อเนื่อง' : 'กำลังเริ่มกล้อง...'}
          </span>
        </div>

        {cameras.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>📷 กล้อง:</span>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-pink-500 text-xs font-medium max-w-[200px] truncate"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label || `Camera ${c.id.substring(0, 5)}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {cameraError ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center text-sm border border-red-200">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="font-bold text-base">{cameraError}</div>
          <p className="text-xs text-red-500 mt-1">โปรดตรวจสอบว่าได้อนุญาตให้เบราว์เซอร์เข้าถึงกล้องแล้ว</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
          <div id="qr-reader-video-box" className="w-full max-w-full"></div>

          {/* Clean scanning viewfinder overlay */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-emerald-400/70 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
