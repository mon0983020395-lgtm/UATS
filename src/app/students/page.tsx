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

  const [students, setStudents] = useState<Student[]>([])
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(initialSearch)

  const fetchStudents = useCallback(async (page: number, query: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/students?page=${page}&limit=20&search=${encodeURIComponent(query)}`)
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
      params.set('page', '1')
      router.replace(`/students?${params.toString()}`, { scroll: false })
      
      fetchStudents(1, search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search, router, fetchStudents])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', newPage.toString())
    router.replace(`/students?${params.toString()}`, { scroll: false })
    fetchStudents(newPage, search)
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        fetchStudents(meta.page, search)
      } else {
        alert(json.error || 'ลบไม่สำเร็จ')
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาด')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายชื่อนิสิต</h1>
          <p className="text-gray-500">จัดการข้อมูลนิสิตและคิวอาร์โค้ด ({meta.total} คน)</p>
        </div>
        <Link
          href="/students/register"
          className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors text-center shadow-sm"
        >
          + ลงทะเบียนนิสิตใหม่
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="ค้นหา รหัสนิสิต, ชื่อ, นามสกุล, สาขา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-100 focus:border-pink-400 outline-none text-sm"
          />
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
