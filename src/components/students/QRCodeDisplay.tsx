'use client'

interface QRCodeDisplayProps {
  qrCodeUrl: string
  studentId: string
  studentName: string
}

export default function QRCodeDisplay({ qrCodeUrl, studentId, studentName }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrCodeUrl} alt={`QR Code for ${studentId}`} className="w-48 h-48" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg">{studentName}</h3>
      <p className="text-gray-500 mb-4">{studentId}</p>
      <a
        href={qrCodeUrl}
        download={`qr_${studentId}.png`}
        className="inline-flex items-center justify-center bg-pink-500 hover:bg-pink-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto"
      >
        📥 ดาวน์โหลด QR Code
      </a>
    </div>
  )
}
