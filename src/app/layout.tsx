import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'ระบบสแกนการปฏิบัติธรรม',
  description: 'Smart Meditation Attendance System - ระบบสแกน QR Code เข้า-ออกการปฏิบัติธรรม',
  keywords: ['ปฏิบัติธรรม', 'QR Code', 'นิสิต', 'สแกน'],
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="bg-gray-50 min-h-screen antialiased">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
