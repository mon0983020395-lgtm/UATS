# Architecture Document
# Smart Meditation Attendance System

**เวอร์ชัน:** 1.0.0  
**วันที่:** 2026-09-05

---

## 1. ภาพรวมสถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Dashboard  │  │  QR Scanner │  │ Student Mgmt.  │  │
│  │  (RSC)      │  │ (Client)    │  │ (RSC + Client) │  │
│  └──────┬──────┘  └──────┬──────┘  └───────┬────────┘  │
└─────────┼────────────────┼─────────────────┼────────────┘
          │ fetch          │ fetch           │ fetch
          ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   NEXT.JS SERVER                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API Routes (Route Handlers)          │   │
│  │  /api/students   /api/scan   /api/dashboard      │   │
│  │  /api/attendance /api/import /api/export/*       │   │
│  └────────────────────┬────────────────────────────┘   │
│                        │ Prisma ORM                      │
└────────────────────────┼────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   MySQL Database  │
              │                  │
              │  ┌────────────┐  │
              │  │  students  │  │
              │  └────────────┘  │
              │  ┌──────────────┐│
              │  │attendance_logs││
              │  └──────────────┘│
              └──────────────────┘
```

---

## 2. Tech Stack

| Layer | Technology | เหตุผล |
|-------|-----------|--------|
| **Framework** | Next.js 14 (App Router) | Full-stack, SSR, API Routes ในที่เดียว |
| **Language** | TypeScript | Type safety, ลด runtime errors |
| **Styling** | Tailwind CSS | Utility-first, responsive ง่าย |
| **Database** | MySQL 8.0 | Relational, รองรับภาษาไทย (utf8mb4) |
| **ORM** | Prisma | Type-safe queries, migration management |
| **QR Generate** | `qrcode` | Node.js QR Code generator |
| **QR Scan** | `html5-qrcode` | Web Camera QR scanner |
| **Charts** | Chart.js + react-chartjs-2 | Bar chart, responsive |
| **Validation** | Zod | Schema validation สำหรับ API input |
| **CSV** | PapaParse | Parse/generate CSV รองรับ UTF-8 |
| **Date** | date-fns | Format วันที่ภาษาไทย |
| **UUID** | uuid (v4) | สร้าง QR token ที่ไม่ซ้ำกัน |

---

## 3. โครงสร้างหน้าเว็บ (Pages & Routing)

```
/                           → Dashboard
/scan                       → QR Code Scanner
/students                   → รายชื่อนิสิต
/students/register          → ลงทะเบียนนิสิต
/students/[id]              → รายละเอียดนิสิต + QR + ประวัติ
/history                    → ประวัติการสแกนทั้งหมด
/settings                   → Import / Export / Reset
```

---

## 4. API Design

### Request/Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "ข้อความอธิบาย error"
}
```

### API Endpoints

```
┌─────────────────────────────────────────────────────┐
│ Student APIs                                        │
├─────────────┬─────────────────────────────────────── │
│ GET         │ /api/students?search=&page=&limit=    │
│ POST        │ /api/students                         │
│ GET         │ /api/students/:id                     │
│ PUT         │ /api/students/:id                     │
│ DELETE      │ /api/students/:id                     │
│ GET         │ /api/students/:id/qr                  │
├─────────────┼───────────────────────────────────────┤
│ Scan API                                            │
├─────────────┼───────────────────────────────────────┤
│ POST        │ /api/scan  { qr_token }               │
├─────────────┼───────────────────────────────────────┤
│ Dashboard API                                       │
├─────────────┼───────────────────────────────────────┤
│ GET         │ /api/dashboard                        │
├─────────────┼───────────────────────────────────────┤
│ Attendance API                                      │
├─────────────┼───────────────────────────────────────┤
│ GET         │ /api/attendance?date_from=&date_to=   │
│             │   &student_id=&name=&dept=&type=      │
│             │   &page=&limit=                       │
├─────────────┼───────────────────────────────────────┤
│ Data Management                                     │
├─────────────┼───────────────────────────────────────┤
│ POST        │ /api/import  (multipart/form-data)    │
│ GET         │ /api/export/students  (CSV)           │
│ GET         │ /api/export/attendance  (CSV)         │
│ GET         │ /api/export/all  (JSON)               │
│ DELETE      │ /api/reset                            │
└─────────────┴───────────────────────────────────────┘
```

---

## 5. Component Architecture

```
app/
└── layout.tsx (Root Layout)
    ├── Navbar
    │   ├── Logo
    │   └── NavLinks [Dashboard, สแกน, นิสิต, ประวัติ, ตั้งค่า]
    │
    ├── page.tsx (Dashboard)
    │   ├── StatCard × 4
    │   ├── AttendanceChart (Client Component - Chart.js)
    │   └── RecentScans (auto-refresh)
    │
    ├── scan/page.tsx
    │   ├── QRScanner (Client - Camera)
    │   │   └── ScanResult
    │   └── ManualEntry (Client)
    │
    ├── students/page.tsx
    │   ├── SearchBar (Client - debounce)
    │   ├── StudentTable (Server)
    │   │   └── StudentRow × n
    │   │       ├── QRCodeModal
    │   │       └── DeleteConfirmDialog
    │   └── Pagination
    │
    ├── students/register/page.tsx
    │   └── StudentForm (Client)
    │       └── QRCodeDisplay (after submit)
    │
    ├── students/[id]/page.tsx
    │   ├── StudentInfo + EditButton
    │   ├── QRCodeDisplay + DownloadButton
    │   └── AttendanceHistory (student-specific)
    │
    ├── history/page.tsx
    │   ├── FilterPanel (Client)
    │   ├── HistoryTable (Server)
    │   └── Pagination
    │
    └── settings/page.tsx
        ├── ExportSection
        ├── ImportSection (Client - file upload)
        └── DangerZone
            └── ResetConfirmDialog
```

---

## 6. QR Code Flow

```
ลงทะเบียนนิสิต:
──────────────────
User Submit Form
    │
    ▼
POST /api/students
    │
    ├── Generate UUID v4 → qr_token
    ├── Save student + qr_token to DB
    └── Generate QR Code image (PNG) จาก qr_token
        └── Return { student, qrCodeDataUrl }

สแกนเข้า-ออก:
──────────────────
กล้องสแกน QR Code
    │
    ▼ (decode QR → ได้ qr_token string)
POST /api/scan { qr_token }
    │
    ├── ค้นหา student จาก qr_token
    │   └── ไม่พบ → 404 "ไม่พบข้อมูลนิสิต"
    │
    ├── ดึง attendance_log ล่าสุดของ student
    │
    ├── ตรวจ cooldown (30 วินาที)
    │   └── ยังอยู่ใน cooldown → 429
    │
    ├── กำหนด scan_type:
    │   ├── log ล่าสุด = IN → บันทึก OUT
    │   └── log ล่าสุด = OUT / ไม่มี → บันทึก IN
    │
    └── Insert attendance_log → Return result
```

---

## 7. Data Flow - Dashboard

```
Browser (every 30s)
    │ GET /api/dashboard
    ▼
API Route
    │
    ├── COUNT students
    ├── COUNT DISTINCT students ที่มี IN วันนี้
    ├── คำนวณ "อยู่ภายใน": students ที่ log ล่าสุด = IN วันนี้
    ├── คำนวณ "ออกแล้ว": today - inside
    ├── GROUP BY date (7 วัน) → chart data
    └── ดึง 10 log ล่าสุด
    │
    ▼ Response JSON
Browser → อัปเดต State → Re-render Components
```

---

## 8. Security Considerations

| ภัยคุกคาม | มาตรการป้องกัน |
|---------|---------------|
| QR ปลอม | ใช้ UUID token แทนรหัสนิสิต |
| SQL Injection | Prisma ORM + Parameterized queries |
| XSS | React auto-escape + validate input |
| การลบข้อมูลผิดพลาด | 2-step confirmation + พิมพ์ "ยืนยันลบ" |
| Duplicate scan | Cooldown 30 วินาที |

---

## 9. Environment Variables

```env
# ต้องกำหนดก่อน run
DATABASE_URL="mysql://user:password@host:3306/db_name"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Optional
SCAN_COOLDOWN_SECONDS=30      # default: 30
DASHBOARD_REFRESH_SECONDS=30  # default: 30
```

---

## 10. Deployment

**Development:**
```bash
npm run dev           # Next.js dev server (port 3000)
npx prisma studio     # Database GUI (port 5555)
```

**Production (แนะนำ):**
- Host: Node.js server หรือ Vercel
- Database: MySQL บน local server หรือ Cloud
- HTTPS: จำเป็นสำหรับ Camera API ในทุก browser
