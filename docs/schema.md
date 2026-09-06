# Database Schema
# Smart Meditation Attendance System

**Database:** MySQL 8.0+  
**Character Set:** utf8mb4 (รองรับภาษาไทยและ Emoji)  
**Collation:** utf8mb4_unicode_ci  
**ORM:** Prisma

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Student {
  id          Int              @id @default(autoincrement())
  student_id  String           @unique @db.VarChar(20)   // รหัสนิสิต
  first_name  String           @db.VarChar(100)           // ชื่อ
  last_name   String           @db.VarChar(100)           // นามสกุล
  department  String           @db.VarChar(150)           // สาขาวิชา
  year        Int?             @db.TinyInt                // ชั้นปี (1-6)
  email       String?          @db.VarChar(150)           // อีเมล
  qr_token    String           @unique @db.VarChar(36)    // UUID v4 ใน QR Code
  created_at  DateTime         @default(now())
  updated_at  DateTime         @updatedAt

  attendance_logs AttendanceLog[]

  @@index([student_id])
  @@index([first_name, last_name])
  @@index([department])
  @@map("students")
}

model AttendanceLog {
  id          Int           @id @default(autoincrement())
  student_id  Int                                         // FK → students.id
  scan_type   ScanType                                    // IN หรือ OUT
  scanned_at  DateTime      @default(now())

  student     Student       @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@index([student_id])
  @@index([scanned_at])
  @@index([student_id, scanned_at])
  @@map("attendance_logs")
}

enum ScanType {
  IN
  OUT
}
```

---

## SQL DDL (อ้างอิง)

```sql
-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS meditation_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meditation_attendance;

-- ตาราง students
CREATE TABLE students (
  id          INT           NOT NULL AUTO_INCREMENT,
  student_id  VARCHAR(20)   NOT NULL,
  first_name  VARCHAR(100)  NOT NULL,
  last_name   VARCHAR(100)  NOT NULL,
  department  VARCHAR(150)  NOT NULL,
  year        TINYINT       NULL,
  email       VARCHAR(150)  NULL,
  qr_token    VARCHAR(36)   NOT NULL,
  created_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)   NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY students_student_id_key (student_id),
  UNIQUE KEY students_qr_token_key (qr_token),
  INDEX idx_student_id (student_id),
  INDEX idx_name (first_name, last_name),
  INDEX idx_department (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ตาราง attendance_logs
CREATE TABLE attendance_logs (
  id          INT           NOT NULL AUTO_INCREMENT,
  student_id  INT           NOT NULL,
  scan_type   ENUM('IN','OUT') NOT NULL,
  scanned_at  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  INDEX idx_student_id (student_id),
  INDEX idx_scanned_at (scanned_at),
  INDEX idx_student_time (student_id, scanned_at),
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id)
    REFERENCES students(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## คำอธิบาย Fields

### ตาราง `students`

| Field | Type | Null | Key | คำอธิบาย |
|-------|------|------|-----|---------|
| `id` | INT | NO | PK | Auto increment primary key |
| `student_id` | VARCHAR(20) | NO | UQ | รหัสนิสิต เช่น "6401234567" |
| `first_name` | VARCHAR(100) | NO | | ชื่อ (ภาษาไทย/อังกฤษ) |
| `last_name` | VARCHAR(100) | NO | | นามสกุล |
| `department` | VARCHAR(150) | NO | | สาขาวิชา เช่น "วิทยาการคอมพิวเตอร์" |
| `year` | TINYINT | YES | | ชั้นปี (1-6), null = ไม่ระบุ |
| `email` | VARCHAR(150) | YES | | อีเมล, null = ไม่ระบุ |
| `qr_token` | VARCHAR(36) | NO | UQ | UUID v4 เช่น "550e8400-e29b-41d4-a716-446655440000" |
| `created_at` | DATETIME(3) | NO | | วันที่ลงทะเบียน |
| `updated_at` | DATETIME(3) | NO | | วันที่แก้ไขล่าสุด |

### ตาราง `attendance_logs`

| Field | Type | Null | Key | คำอธิบาย |
|-------|------|------|-----|---------|
| `id` | INT | NO | PK | Auto increment primary key |
| `student_id` | INT | NO | FK | อ้างอิง students.id (CASCADE DELETE) |
| `scan_type` | ENUM | NO | | 'IN' = เข้า, 'OUT' = ออก |
| `scanned_at` | DATETIME(3) | NO | IDX | เวลาที่สแกน (millisecond precision) |

---

## Indexes และเหตุผล

| Index | Table | Columns | เหตุผล |
|-------|-------|---------|-------|
| `idx_student_id` | students | student_id | ค้นหาด้วยรหัสนิสิตบ่อย |
| `idx_name` | students | first_name, last_name | ค้นหาด้วยชื่อ |
| `idx_department` | students | department | กรองตามสาขาวิชา |
| `idx_student_id` | attendance_logs | student_id | JOIN กับ students |
| `idx_scanned_at` | attendance_logs | scanned_at | Filter ตามวันที่ |
| `idx_student_time` | attendance_logs | student_id, scanned_at | ดึง log ล่าสุดของนิสิต (Scan Logic) |

---

## Queries สำคัญ (Prisma)

### 1. ค้นหา student จาก qr_token (Scan)
```typescript
const student = await prisma.student.findUnique({
  where: { qr_token: token },
  include: {
    attendance_logs: {
      orderBy: { scanned_at: 'desc' },
      take: 1,
    }
  }
})
```

### 2. คำนวณ "อยู่ภายในสถานที่" ปัจจุบัน
```typescript
// ดึง last log ของแต่ละ student วันนี้
// นับเฉพาะคนที่ last log = IN

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)

const insideStudents = await prisma.$queryRaw`
  SELECT COUNT(*) as count
  FROM (
    SELECT student_id, scan_type
    FROM attendance_logs
    WHERE scanned_at >= ${todayStart}
    AND id = (
      SELECT MAX(id) FROM attendance_logs al2
      WHERE al2.student_id = attendance_logs.student_id
      AND al2.scanned_at >= ${todayStart}
    )
  ) last_logs
  WHERE scan_type = 'IN'
`
```

### 3. กราฟ 7 วัน (ผู้เข้าร่วม distinct ต่อวัน)
```typescript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
sevenDaysAgo.setHours(0, 0, 0, 0)

const chartData = await prisma.$queryRaw`
  SELECT
    DATE(scanned_at) as date,
    COUNT(DISTINCT student_id) as count
  FROM attendance_logs
  WHERE scan_type = 'IN'
    AND scanned_at >= ${sevenDaysAgo}
  GROUP BY DATE(scanned_at)
  ORDER BY date ASC
`
```

### 4. ตรวจ Cooldown
```typescript
const lastLog = await prisma.attendanceLog.findFirst({
  where: { student_id: student.id },
  orderBy: { scanned_at: 'desc' }
})

const cooldownSeconds = 30
const now = new Date()
const diff = (now.getTime() - lastLog.scanned_at.getTime()) / 1000

if (diff < cooldownSeconds) {
  const remaining = Math.ceil(cooldownSeconds - diff)
  return { error: `กรุณารอ ${remaining} วินาที`, remaining }
}
```

---

## Development Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  const departments = [
    'วิทยาการคอมพิวเตอร์',
    'เทคโนโลยีสารสนเทศ',
    'วิศวกรรมซอฟต์แวร์',
    'นิเทศศาสตร์',
    'บริหารธุรกิจ',
  ]

  const students = Array.from({ length: 20 }, (_, i) => ({
    student_id: `640${String(i + 1).padStart(7, '0')}`,
    first_name: `นิสิต${i + 1}`,
    last_name: `ทดสอบ`,
    department: departments[i % departments.length],
    year: (i % 4) + 1,
    email: `student${i + 1}@test.ac.th`,
    qr_token: uuidv4(),
  }))

  await prisma.student.createMany({ data: students })
  console.log(`Seeded ${students.length} students`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

เพิ่มใน `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

รัน seed:
```bash
npx prisma db seed
```

---

## Migration Commands

```bash
# สร้าง migration ใหม่
npx prisma migrate dev --name <ชื่อ>

# Deploy migration (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# เปิด Prisma Studio (GUI)
npx prisma studio

# Generate Prisma Client
npx prisma generate
```
