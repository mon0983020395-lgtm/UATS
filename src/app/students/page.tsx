'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import StudentTable from '@/components/students/StudentTable'
import Pagination from '@/components/shared/Pagination'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import type { Student, PaginatedResponse } from '@/types'

function StudentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialSearch = searchParams.get('search') || ''
  const initialGroup = searchParams.get('group') || ''

  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)
  const [group, setGroup] = useState(initialGroup)

  useEffect(() => {
    fetch('/api/groups').then(r => r.json()).then(j => {
      if (j.success) setGroups(j.data)
    })
  }, [])

  const fetchStudents = useCallback(async (page: number, query: string, grp: string) => {
    setLoading(true)
    try {
      let url = `/api/students?page=${page}&limit=20&search=${encodeURIComponent(query)}`
      if (grp) url += `&group=${encodeURIComponent(grp)}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        const data = json.data as PaginatedResponse<Student>
        setStudents(data.items)
        setMeta(data.meta)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (group) params.set('group', group)
      params.set('page', '1')
      router.replace(`/students?${params.toString()}`, { scroll: false })
      
      fetchStudents(1, search, group)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, group, router, fetchStudents])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (group) params.set('group', group)
    params.set('page', newPage.toString())
    router.replace(`/students?${params.toString()}`, { scroll: false })
    fetchStudents(newPage, search, group)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบข้อมูลนิสิตนี้ใช่หรือไม่?')) return
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        fetchStudents(meta.page, search, group)
      } else {
        alert(json.error || 'ลบไม่สำเร็จ')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  const handlePrintQR = () => {
    let url = '/export/qr'
    if (group) url += `?group=${encodeURIComponent(group)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายชื่อนิสิต</h1>
          <p className="text-gray-500">จัดการข้อมูลนิสิตและคิวอาร์โค้ด ({meta.total} คน)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintQR}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            🖨️ พิมพ์ QR {group ? `(กลุ่ม ${group})` : '(ทั้งหมด)'}
          </button>
          <Link
            href="/students/register"
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2.5 rounded-xl font-medium transition-colors text-center shadow-sm"
          >
            + ลงทะเบียนนิสิตใหม่
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ค้นหา รหัสนิสิต, ชื่อ, นามสกุล, สาขา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none text-sm"
          />
        </div>
        <div className="md:w-64">
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none text-sm bg-white"
          >
            <option value="">ทุกกลุ่ม</option>
            {groups.map(g => (
              <option key={g} value={g}>กลุ่ม: {g}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : (
        <>
          <StudentTable students={students} onDelete={handleDelete} />
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div className="py-20"><LoadingSpinner /></div>}>
      <StudentsContent />
    </Suspense>
  )
}
