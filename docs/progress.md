# Progress Tracker
# Smart Meditation Attendance System

**เริ่มต้น:** 2026-09-05  
**เป้าหมายแล้วเสร็จ:** TBD

---

## สถานะภาพรวม

```
Phase 1: Project Setup & Database    [ ] 0%
Phase 2: Core Backend APIs           [ ] 0%
Phase 3: Frontend Dashboard & Scan   [ ] 0%
Phase 4: Frontend Student & History  [ ] 0%
Phase 5: Import/Export & Settings    [ ] 0%
Phase 6: Testing & Bug Fix           [ ] 0%
──────────────────────────────────────────
ความคืบหน้ารวม                       [ ] 0%
```

---

## Phase 1: Project Setup & Database

### Setup
- [ ] สร้างโปรเจค Next.js (`create-next-app`)
- [ ] ติดตั้ง dependencies ทั้งหมด
- [ ] ตั้งค่า `.env` file
- [ ] ตั้งค่า Tailwind CSS
- [ ] สร้าง folder structure ตาม `implementation-plan.md`

### Database
- [ ] ติดตั้ง MySQL และสร้าง database `meditation_attendance`
- [ ] Copy Prisma Schema จาก `schema.md` → `prisma/schema.prisma`
- [ ] รัน `npx prisma migrate dev --name init`
- [ ] รัน `npx prisma generate`
- [ ] สร้าง `src/lib/db.ts` (Prisma singleton)
- [ ] (Optional) รัน `npx prisma db seed` สำหรับ dev data

**หมายเหตุ:** ______________________________

---

## Phase 2: Core Backend APIs

### Student APIs
- [ ] `GET /api/students` — list + search + pagination
- [ ] `POST /api/students` — create + UUID qr_token
- [ ] `GET /api/students/[id]` — detail
- [ ] `PUT /api/students/[id]` — update
- [ ] `DELETE /api/students/[id]` — delete + cascade
- [ ] `GET /api/students/[id]/qr` — QR Code image (PNG)

### Scan API
- [ ] `POST /api/scan` — scan logic (IN/OUT toggle + cooldown)
- [ ] ทดสอบ scan flow ด้วย curl/Postman

### Dashboard API
- [ ] `GET /api/dashboard` — stats (total, today, inside, left)
- [ ] เพิ่ม chart data (7 วัน)
- [ ] เพิ่ม recent 10 scans

### Attendance API
- [ ] `GET /api/attendance` — history + filters + pagination

### Data Management APIs
- [ ] `POST /api/import` — import CSV/JSON
- [ ] `GET /api/export/students` — export students CSV
- [ ] `GET /api/export/attendance` — export attendance CSV
- [ ] `GET /api/export/all` — export all JSON
- [ ] `DELETE /api/reset` — clear all data

**หมายเหตุ:** ______________________________

---

## Phase 3: Frontend - Dashboard & Scan

### Layout & Navigation
- [ ] `app/layout.tsx` — root layout
- [ ] `components/layout/Navbar.tsx` — navigation bar
- [ ] Global styles / font setup

### Dashboard Page (`/`)
- [ ] `components/dashboard/StatCard.tsx` — stat card component
- [ ] `components/dashboard/AttendanceChart.tsx` — Bar chart (Chart.js)
- [ ] `components/dashboard/RecentScans.tsx` — latest 10 scans
- [ ] `app/page.tsx` — assemble dashboard
- [ ] Auto-refresh ทุก 30 วินาที
- [ ] Loading skeleton / spinner

### Scan Page (`/scan`)
- [ ] `components/scan/QRScanner.tsx` — html5-qrcode camera
- [ ] `components/scan/ScanResult.tsx` — success/error display
- [ ] `components/scan/ManualEntry.tsx` — manual student_id input
- [ ] `app/scan/page.tsx` — assemble scan page
- [ ] ทดสอบกล้องบน PC
- [ ] ทดสอบกล้องบนมือถือ

**หมายเหตุ:** ______________________________

---

## Phase 4: Frontend - Student & History

### Shared Components
- [ ] `components/shared/LoadingSpinner.tsx`
- [ ] `components/shared/EmptyState.tsx`
- [ ] `components/shared/ConfirmDialog.tsx`
- [ ] `components/shared/Pagination.tsx`

### Student Pages
- [ ] `components/students/StudentTable.tsx` — table + search
- [ ] `components/students/StudentForm.tsx` — register/edit form
- [ ] `components/students/QRCodeDisplay.tsx` — QR + download btn
- [ ] `app/students/page.tsx` — student list
- [ ] `app/students/register/page.tsx` — register form
- [ ] `app/students/[id]/page.tsx` — student detail + history

### History Page
- [ ] Filter panel component (date range, search, status)
- [ ] History table component
- [ ] `app/history/page.tsx` — history page

**หมายเหตุ:** ______________________________

---

## Phase 5: Import/Export & Settings

### Settings Page
- [ ] Export students (CSV)
- [ ] Export attendance (CSV)
- [ ] Export all (JSON)
- [ ] Import file upload UI
- [ ] Import preview table
- [ ] Import validation & error display
- [ ] Import confirm action
- [ ] Reset (2-step confirm + พิมพ์ "ยืนยันลบ")
- [ ] `app/settings/page.tsx` — assemble

**หมายเหตุ:** ______________________________

---

## Phase 6: Testing & Bug Fix

### Functional Tests
- [ ] ลงทะเบียนนิสิตใหม่ + QR ถูกต้อง
- [ ] สแกน QR → IN
- [ ] สแกน QR → OUT (scan ครั้งที่ 2)
- [ ] สแกนซ้ำ < 30 วินาที → cooldown message
- [ ] QR ที่ไม่มีในระบบ → error message
- [ ] Dashboard ตัวเลขถูกต้อง
- [ ] กรองประวัติทุก filter
- [ ] Export CSV เปิดใน Excel ได้ (ภาษาไทย OK)
- [ ] Import CSV สำเร็จ
- [ ] Import CSV มี error → แสดง error รายแถว
- [ ] ลบนิสิต → ประวัติหายด้วย
- [ ] Reset → ต้องพิมพ์ยืนยัน

### Responsive Tests
- [ ] PC (1920×1080)
- [ ] Tablet (768px)
- [ ] Mobile (375px)
- [ ] Projector (ตัวอักษรอ่านง่าย ระยะ 3-5 เมตร)

### Performance
- [ ] Dashboard load < 3s
- [ ] Scan response < 1s
- [ ] ตาราง 100+ รายการ scroll smooth

**Bugs พบ:**
| # | อาการ | สถานะ |
|---|------|-------|
| 1 | | |
| 2 | | |

---

## Log การเปลี่ยนแปลง

| วันที่ | Phase | รายการ | ผู้ดำเนินการ |
|-------|-------|--------|------------|
| 2026-09-05 | Setup | สร้างเอกสารโปรเจค (prd, agents, plan, architecture, schema, progress) | - |
| | | | |

---

## ปัญหาและข้อสังเกต

> บันทึกปัญหาหรือข้อสังเกตระหว่างการพัฒนาที่นี่

- 

---

## คำสั่งที่ใช้บ่อย

```bash
# Start development
npm run dev

# Database
npx prisma studio          # เปิด GUI ฐานข้อมูล
npx prisma migrate dev     # สร้าง migration ใหม่
npx prisma db seed         # ใส่ข้อมูลทดสอบ

# Build
npm run build
npm run start
```
