# Implementation Plan
# Smart Meditation Attendance System

**เวอร์ชัน:** 1.0.0  
**วันที่:** 2026-09-05

---

## Phase ภาพรวม

```
Phase 1: Project Setup & Database          [1-2 วัน]
Phase 2: Core Backend APIs                 [2-3 วัน]
Phase 3: Frontend - Dashboard & Scan       [2-3 วัน]
Phase 4: Frontend - Student & History      [2-3 วัน]
Phase 5: Import/Export & Settings          [1-2 วัน]
Phase 6: Testing & Bug Fix                 [1-2 วัน]
─────────────────────────────────────────
รวมประมาณ                                 [9-15 วัน]
```

---

## Phase 1: Project Setup & Database

### 1.1 Initialize โปรเจค
```bash
npx create-next-app@latest smart-attendance \
  --typescript --tailwind --eslint --app --src-dir

cd smart-attendance

# Dependencies หลัก
npm install prisma @prisma/client
npm install qrcode @types/qrcode
npm install html5-qrcode
npm install chart.js react-chartjs-2
npm install zod
npm install uuid @types/uuid
npm install papaparse @types/papaparse  # CSV parsing
npm install date-fns                    # date formatting

# Dev dependencies
npm install -D prisma
```

### 1.2 Environment Setup
สร้างไฟล์ `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/meditation_attendance"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 1.3 Prisma Setup
```bash
npx prisma init --datasource-provider mysql
# แก้ไข prisma/schema.prisma ตาม schema.md
npx prisma migrate dev --name init
npx prisma generate
```

### 1.4 Folder Structure
```
src/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx              # Dashboard
│   ├── scan/
│   │   └── page.tsx              # QR Scanner
│   ├── students/
│   │   ├── page.tsx              # Student List
│   │   ├── register/
│   │   │   └── page.tsx          # Register Form
│   │   └── [id]/
│   │       └── page.tsx          # Student Detail
│   ├── history/
│   │   └── page.tsx              # Attendance History
│   ├── settings/
│   │   └── page.tsx              # Import/Export/Reset
│   ├── api/
│   │   ├── students/
│   │   │   ├── route.ts          # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │       └── qr/
│   │   │           └── route.ts  # GET QR image
│   │   ├── scan/
│   │   │   └── route.ts          # POST scan
│   │   ├── dashboard/
│   │   │   └── route.ts          # GET stats + chart
│   │   ├── attendance/
│   │   │   └── route.ts          # GET history + filter
│   │   ├── import/
│   │   │   └── route.ts          # POST import
│   │   ├── export/
│   │   │   ├── students/
│   │   │   │   └── route.ts      # GET CSV
│   │   │   ├── attendance/
│   │   │   │   └── route.ts      # GET CSV
│   │   │   └── all/
│   │   │       └── route.ts      # GET JSON
│   │   └── reset/
│   │       └── route.ts          # DELETE all
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                       # Base UI (shadcn/ui)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── AttendanceChart.tsx
│   │   └── RecentScans.tsx
│   ├── scan/
│   │   ├── QRScanner.tsx
│   │   ├── ScanResult.tsx
│   │   └── ManualEntry.tsx
│   ├── students/
│   │   ├── StudentTable.tsx
│   │   ├── StudentForm.tsx
│   │   └── QRCodeDisplay.tsx
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── qr.ts                     # QR Code utilities
│   ├── export.ts                 # Export helpers
│   └── validations.ts            # Zod schemas
└── types/
    └── index.ts                  # TypeScript types
```

---

## Phase 2: Core Backend APIs

### 2.1 Prisma Client Singleton
**ไฟล์:** `src/lib/db.ts`
- สร้าง PrismaClient singleton (รองรับ dev hot-reload)

### 2.2 Student APIs
**ไฟล์:** `src/app/api/students/route.ts`
- `GET /api/students` → list with search + pagination
- `POST /api/students` → create + generate qr_token (UUID v4) + สร้าง QR Code

**ไฟล์:** `src/app/api/students/[id]/route.ts`
- `GET /api/students/:id` → student detail + latest status
- `PUT /api/students/:id` → update (ยกเว้น qr_token)
- `DELETE /api/students/:id` → delete + cascade logs

**ไฟล์:** `src/app/api/students/[id]/qr/route.ts`
- `GET /api/students/:id/qr` → return QR Code image (PNG buffer)

### 2.3 Scan API (Core Logic)
**ไฟล์:** `src/app/api/scan/route.ts`
```typescript
// POST /api/scan
// Body: { qr_token: string }
// Logic:
// 1. หา student จาก qr_token
// 2. ดึง log ล่าสุดของ student
// 3. ถ้า log.scanned_at < 30s ที่แล้ว → 429 Too Many Requests
// 4. ถ้า log.scan_type = 'IN' → บันทึก 'OUT'
// 5. ถ้า log.scan_type = 'OUT' หรือไม่มี log → บันทึก 'IN'
// Response: { student, scan_type, scanned_at }
```

### 2.4 Dashboard API
**ไฟล์:** `src/app/api/dashboard/route.ts`
- นับ total students
- นับ today's attendees (distinct students ที่มี IN วันนี้)
- นับ currently inside (IN ล่าสุด ยังไม่มี OUT วันนี้)
- นับ already left
- กราฟ 7 วัน (daily IN count)
- 10 รายการล่าสุด

### 2.5 Attendance History API
**ไฟล์:** `src/app/api/attendance/route.ts`
- Query params: `date_from`, `date_to`, `student_id`, `name`, `department`, `scan_type`, `page`, `limit`

### 2.6 Import/Export APIs
- Export CSV ใช้ UTF-8 BOM (`\uFEFF`) สำหรับ Excel
- Import: parse → validate → upsert

---

## Phase 3: Frontend - Dashboard & Scan

### 3.1 Layout & Navigation
- `Navbar.tsx`: logo + menu links (Dashboard, สแกน, นิสิต, ประวัติ, ตั้งค่า)
- `layout.tsx`: apply Navbar + global styles

### 3.2 Dashboard Page (`/`)
Components:
- `StatCard` × 4: นิสิตทั้งหมด, วันนี้, อยู่ภายใน, ออกแล้ว
- `AttendanceChart`: Bar chart 7 วัน (Chart.js)
- `RecentScans`: ตาราง 10 รายการล่าสุด
- Auto-refresh ทุก 30 วินาที (`setInterval` + `router.refresh()`)

### 3.3 Scan Page (`/scan`)
Components:
- `QRScanner`: เปิดกล้อง ใช้ html5-qrcode
  - แสดง viewfinder + overlay
  - Callback เมื่อสแกนสำเร็จ → call POST /api/scan
- `ScanResult`: แสดงผลหลังสแกน
  - สำเร็จ (สีเขียว): ชื่อ, รหัสนิสิต, สถานะ, เวลา
  - ไม่พบ (สีแดง): "ไม่พบข้อมูลนิสิต"
  - Cooldown (สีส้ม): "กรุณารอ X วินาที"
- `ManualEntry`: input field + ปุ่มค้นหาด้วยรหัสนิสิต

---

## Phase 4: Frontend - Student & History

### 4.1 Student List Page (`/students`)
- ตาราง: รหัสนิสิต, ชื่อ-นามสกุล, สาขา, ชั้นปี, สถานะปัจจุบัน, actions
- Search bar (debounce 300ms)
- Pagination (20 per page)
- ปุ่ม: ดู QR, แก้ไข, ลบ (พร้อม confirm)

### 4.2 Register Page (`/students/register`)
- Form: รหัสนิสิต, ชื่อ, นามสกุล, สาขาวิชา, ชั้นปี, อีเมล
- Validate ก่อน submit
- หลัง submit สำเร็จ → แสดง QR Code + ปุ่ม download + ปุ่ม "ลงทะเบียนคนต่อไป"

### 4.3 Student Detail Page (`/students/[id]`)
- ข้อมูลนิสิต + ปุ่มแก้ไข
- QR Code พร้อมปุ่ม download
- ตารางประวัติการสแกนของนิสิตคนนี้

### 4.4 History Page (`/history`)
- Filter panel: date range picker, รหัสนิสิต, ชื่อ, สาขา, สถานะ
- ตารางประวัติ: เวลา, รหัสนิสิต, ชื่อ, สาขา, สถานะ
- Pagination (20 per page)

---

## Phase 5: Import/Export & Settings

### 5.1 Settings Page (`/settings`)

**Export Section:**
- ปุ่ม "Export นิสิต (CSV)"
- ปุ่ม "Export ประวัติ (CSV)"
- ปุ่ม "Export ทั้งหมด (JSON)"

**Import Section:**
- Upload CSV/JSON file
- Preview table แสดง 5 แถวแรก
- แสดง error รายแถว (ถ้ามี)
- ปุ่ม "Confirm Import"

**Danger Zone:**
- ปุ่ม "ล้างข้อมูลทั้งระบบ" (สีแดง)
- Modal: พิมพ์ "ยืนยันลบ" → กด Confirm

---

## Phase 6: Testing & Bug Fix

### 6.1 Manual Testing Checklist
- [ ] ลงทะเบียนนิสิตใหม่ → QR Code ถูกต้อง
- [ ] สแกน QR → บันทึก IN สำเร็จ
- [ ] สแกน QR อีกครั้ง → บันทึก OUT สำเร็จ
- [ ] สแกนซ้ำใน 30 วินาที → แสดง cooldown
- [ ] Dashboard แสดงตัวเลขถูกต้อง
- [ ] Filter ประวัติทำงานถูกต้อง
- [ ] Export CSV เปิดใน Excel ได้
- [ ] Import CSV สำเร็จ
- [ ] ลบนิสิต → ประวัติหายด้วย
- [ ] ล้างข้อมูล → ต้องพิมพ์ยืนยัน
- [ ] ทดสอบบนมือถือ (Responsive)
- [ ] ทดสอบผ่านกล้องมือถือจริง

### 6.2 Performance Check
- [ ] Dashboard โหลด < 3 วินาที
- [ ] สแกนและบันทึก < 1 วินาที
- [ ] ตาราง 100+ รายการ scroll smooth

---

## Dependencies สรุป

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "tailwindcss": "^3.x",
    "@prisma/client": "^5.x",
    "qrcode": "^1.5.x",
    "html5-qrcode": "^2.3.x",
    "chart.js": "^4.x",
    "react-chartjs-2": "^5.x",
    "zod": "^3.x",
    "uuid": "^9.x",
    "papaparse": "^5.x",
    "date-fns": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@types/qrcode": "^1.5.x",
    "@types/uuid": "^9.x",
    "@types/papaparse": "^5.x"
  }
}
```
