'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navLinks = [
  { href: '/', label: '📊 Dashboard', exact: true },
  { href: '/scan', label: '📷 สแกน QR Code' },
  { href: '/students', label: '👥 นิสิต' },
  { href: '/history', label: '📅 ประวัติ' },
  { href: '/report/session', label: '📋 รายงานวัน' },
  { href: '/report/group', label: '📈 รายงานกลุ่ม' },
  { href: '/settings', label: '⚙️ ตั้งค่า' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-pink-600 text-lg">
            <span className="text-2xl">🧘</span>
            <span className="hidden sm:block">ปฏิบัติธรรม</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href, exact)
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600 mb-1" />
            <span className="block w-5 h-0.5 bg-gray-600" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1">
            {navLinks.map(({ href, label, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(href, exact)
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
