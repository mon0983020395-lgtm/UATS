'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { href: '/', label: '📊 แดชบอร์ด', exact: true },
  { href: '/scan', label: '📷 สแกน QR' },
  {
    label: '👥 จัดการข้อมูล',
    children: [
      { href: '/students', label: '👥 ฐานข้อมูลนิสิต' },
      { href: '/history', label: '📅 ประวัติการสแกน' },
    ]
  },
  {
    label: '📑 รายงานผล',
    children: [
      { href: '/report/matrix', label: '🧮 ตารางเช็คชื่อ (Matrix)' },
      { href: '/report/session', label: '📋 สรุปรายวัน' },
      { href: '/report/group', label: '📈 สรุปรายกลุ่ม' },
    ]
  },
  { href: '/settings', label: '⚙️ ตั้งค่าระบบ' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-pink-600 text-lg">
            <span className="text-2xl">🧘</span>
            <span className="hidden sm:block">ปฏิบัติธรรม</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item, idx) => {
              if (item.children) {
                const isChildActive = item.children.some(child => isActive(child.href))
                return (
                  <div key={idx} className="relative group">
                    <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                      isChildActive ? 'bg-pink-50 text-pink-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}>
                      {item.label}
                      <span className="text-[10px] opacity-50">▼</span>
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 mt-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white border border-gray-100 rounded-xl shadow-lg py-2">
                        {item.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-4 py-2.5 text-sm transition-colors ${
                              isActive(child.href) ? 'text-pink-600 bg-pink-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            
            <button
              onClick={handleLogout}
              className="ml-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              🚪 ออกจากระบบ
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileOpen ? 'rotate-45 translate-y-1.5' : 'mb-1'}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileOpen ? 'opacity-0' : 'mb-1'}`} />
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all ${mobileOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-1 mt-2 animate-in fade-in slide-in-from-top-2">
            {menuItems.map((item, idx) => {
              if (item.children) {
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">
                      {item.label}
                    </div>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={`px-8 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive(child.href)
                            ? 'bg-pink-50 text-pink-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href, item.exact)
                      ? 'bg-pink-50 text-pink-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            <div className="h-px bg-gray-100 my-2"></div>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 text-left rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              🚪 ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
