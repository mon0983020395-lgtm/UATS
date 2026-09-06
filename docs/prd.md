# Product Requirements Document (PRD)
# ระบบสแกนเข้า-ออกนิสิตที่ปฏิบัติธรรม
## Smart Meditation Attendance System

**เวอร์ชัน:** 1.0.0  
**วันที่:** 2026-09-05  
**สถานะ:** Draft

---

## 1. ภาพรวมผลิตภัณฑ์ (Product Overview)

### 1.1 วัตถุประสงค์
พัฒนา Web Application สำหรับบันทึกการเข้าและออกของนิสิตที่เข้าร่วมกิจกรรมปฏิบัติธรรม โดยใช้ QR Code ประจำตัวแทนการลงชื่อด้วยกระดาษ ช่วยลดขั้นตอนการทำงาน เพิ่มความแม่นยำ และให้ผู้ดูแลตรวจสอบข้อมูลได้แบบ Real-time

### 1.2 ผู้ใช้งานเป้าหมาย
| กลุ่ม | บทบาท |
|-------|-------|
| **ผู้ดูแลระบบ (Admin)** | ลงทะเบียนนิสิต, ดู Dashboard, จัดการข้อมูล, Export/Import |
| **เจ้าหน้าที่สแกน** | ใช้หน้าสแกน QR Code เข้า-ออก |
| **นิสิต** | ถือ QR Code ประจำตัวสำหรับสแกน |

### 1.3 ขอบเขตของระบบ (Scope)
- ✅ Web Application (ไม่ใช่ Native App)
- ✅ รองรับ PC, Tablet, Smartphone, Projector
- ✅ ใช้กล้องของอุปกรณ์สำหรับสแกน QR Code
- ✅ บันทึกข้อมูลลง MySQL
- ❌ ไม่รองรับ Offline Mode (v1.0)
- ❌ ไม่มีระบบแจ้งเตือน SMS/Email (v1.0)

---

## 2. คุณสมบัติของระบบ (Functional Requirements)

### FR-01: ลงทะเบียนนิสิต (Student Registration)
**Priority:** Must Have

**รายละเอียด:**
- กรอกข้อมูลนิสิต: รหัสนิสิต*, ชื่อ*, นามสกุล*, สาขาวิชา*, ชั้นปี, อีเมล
- ตรวจสอบรหัสนิสิตซ้ำก่อนบันทึก
- ระบบสร้าง `qr_token` (UUID v4) และ QR Code ประจำตัวอัตโนมัติ
- แสดง QR Code ให้ดาวน์โหลดหรือพิมพ์ได้

**Acceptance Criteria:**
- [ ] บันทึกข้อมูลนิสิตสำเร็จและสร้าง QR Code ภายใน 2 วินาที
- [ ] รหัสนิสิตซ้ำต้องแสดง error message ชัดเจน
- [ ] QR Code สแกนได้จริงและ map กลับถึง token ในฐานข้อมูล

---

### FR-02: สแกนเข้า-ออก (QR Code Scanning)
**Priority:** Must Have

**รายละเอียด:**
- เปิดกล้องผ่าน Web Camera API / MediaDevices API
- สแกน QR Code และ decode เป็น `qr_token`
- ค้นหา token ในฐานข้อมูล → ระบุตัวตนนิสิต
- กำหนด scan type อัตโนมัติตาม Logic:
  - ถ้าสถานะล่าสุด = `OUT` หรือยังไม่เคยสแกน → บันทึก `IN`
  - ถ้าสถานะล่าสุด = `IN` → บันทึก `OUT`
- หลังสแกนสำเร็จ แสดง: ชื่อ-นามสกุล, รหัสนิสิต, สถานะ (เข้า/ออก), เวลา
- ป้องกันสแกนซ้ำ: ถ้าสแกน QR เดิมภายใน **30 วินาที** ให้ ignore
- รองรับ Manual Entry (พิมพ์รหัสนิสิตสำรอง กรณีกล้องมีปัญหา)

**Acceptance Criteria:**
- [ ] สแกนสำเร็จและแสดงผลภายใน 1 วินาที
- [ ] สแกน QR ที่ไม่มีในระบบ แสดง error "ไม่พบข้อมูลนิสิต"
- [ ] cooldown 30 วินาทีทำงานถูกต้อง
- [ ] Manual Entry สามารถค้นหาด้วยรหัสนิสิตได้

---

### FR-03: Dashboard
**Priority:** Must Have

**รายละเอียด:**
- Stat Cards แสดง:
  - จำนวนนิสิตทั้งหมดในระบบ
  - จำนวนผู้เข้าร่วมวันนี้ (scan IN อย่างน้อย 1 ครั้ง)
  - จำนวนผู้ที่อยู่ภายในสถานที่ปัจจุบัน (scan IN ล่าสุด ยังไม่มี OUT)
  - จำนวนผู้ที่ออกแล้ว
- กราฟแท่ง (Bar Chart) แสดงจำนวนผู้เข้าร่วมย้อนหลัง **7 วัน** (ใช้ Chart.js)
- ตารางรายการสแกนล่าสุด **10 รายการ** (auto-refresh ทุก 30 วินาที)

**Acceptance Criteria:**
- [ ] ข้อมูล Stat Cards ถูกต้องและตรงกับ Database
- [ ] กราฟแสดงข้อมูลย้อนหลัง 7 วันครบถ้วน
- [ ] รายการสแกนล่าสุดเรียงตามเวลาล่าสุดก่อน

---

### FR-04: จัดการข้อมูลนิสิต (Student Management)
**Priority:** Must Have

**รายละเอียด:**
- ตารางรายชื่อนิสิตทั้งหมดพร้อม Pagination
- ค้นหาด้วย: รหัสนิสิต, ชื่อ, สาขาวิชา
- แก้ไขข้อมูลนิสิต (ยกเว้น qr_token)
- ลบนิสิต → ลบ attendance_logs ที่เกี่ยวข้องด้วย (CASCADE)
- ดู QR Code ของแต่ละคน (พร้อม download)
- ดูประวัติการเข้า-ออกของนิสิตรายบุคคล

**Acceptance Criteria:**
- [ ] ค้นหาทำงานได้แบบ real-time (debounce 300ms)
- [ ] ลบนิสิตต้องมี confirmation dialog
- [ ] หลังลบ ประวัติที่เกี่ยวข้องหายออกจากระบบทั้งหมด

---

### FR-05: ประวัติการเข้า-ออก (Attendance History)
**Priority:** Must Have

**รายละเอียด:**
- ตารางแสดงประวัติการสแกนทั้งหมด
- กรองตาม: วันที่ (date range), รหัสนิสิต, ชื่อ, สาขาวิชา, สถานะ (IN/OUT)
- Pagination อย่างน้อย 20 รายการต่อหน้า
- เรียงตามเวลาล่าสุดก่อน (default)

**Acceptance Criteria:**
- [ ] การกรองทำงานได้ถูกต้องทุก field
- [ ] แสดงเวลาในรูปแบบ วัน/เดือน/ปี พ.ศ. + เวลา (ไทย)

---

### FR-06: Import / Export ข้อมูล
**Priority:** Must Have

**รายละเอียด:**
- **Export นิสิต** (CSV): student_id, name, department, year, email
- **Export ประวัติ** (CSV): student_id, name, scan_type, scanned_at
- **Export ทั้งหมด** (JSON): รวม students + attendance_logs
- **Import นิสิต** (CSV/JSON):
  - Preview ก่อน import
  - Validate format และแจ้ง error รายแถว
  - Handle duplicate student_id (skip หรือ update)
- **ล้างข้อมูลทั้งระบบ**: ต้องพิมพ์ "ยืนยันลบ" เพื่อยืนยัน

**Acceptance Criteria:**
- [ ] Export CSV เปิดได้ใน Excel โดยไม่มีปัญหา encoding ภาษาไทย (UTF-8 BOM)
- [ ] Import แสดง preview และ error ก่อน commit
- [ ] ปุ่มล้างข้อมูลต้องผ่าน 2-step confirmation

---

## 3. คุณสมบัติที่ไม่ใช่หน้าที่หลัก (Non-Functional Requirements)

### NFR-01: Performance
- หน้า Dashboard โหลดภายใน **3 วินาที** (network ปกติ)
- การสแกน QR และบันทึกฐานข้อมูลภายใน **1 วินาที**

### NFR-02: Usability
- อ่านง่ายบน Projector ระยะ 3-5 เมตร
- ใช้งานได้โดยไม่ต้องฝึกอบรม (Intuitive UI)
- ทุก action ที่รอนาน ต้องมี Loading Spinner
- หน้าที่ไม่มีข้อมูล ต้องมี Empty State พร้อมคำแนะนำ

### NFR-03: Compatibility
- Browser: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- รองรับ HTTPS (จำเป็นสำหรับ Camera API)

### NFR-04: Security
- QR Code payload ใช้ UUID token ไม่ใช่ข้อมูลส่วนตัวโดยตรง
- Sanitize input ทุก field ก่อนบันทึกฐานข้อมูล
- ใช้ Parameterized Query / ORM เพื่อป้องกัน SQL Injection

---

## 4. UI/UX Requirements

### 4.1 Design System
| Element | Specification |
|---------|--------------|
| Color Scheme | Light Mode: White / Gray-50 background |
| Primary Color | Pink (pink-500, pink-600) |
| Secondary Color | Gray (gray-500, gray-600) |
| Card Style | border rounded-xl shadow-sm |
| Max Content Width | `max-w-5xl mx-auto px-4` |
| Heading Size | ไม่เกิน `text-4xl` |
| Font | System font stack + รองรับภาษาไทย |

### 4.2 หน้าระบบ (Pages)
| Path | ชื่อหน้า | คำอธิบาย |
|------|---------|---------|
| `/` | Dashboard | สถิติ + กราฟ + รายการล่าสุด |
| `/scan` | สแกน QR Code | กล้อง + ผลสแกน |
| `/students` | จัดการนิสิต | ตาราง + CRUD |
| `/students/register` | ลงทะเบียนนิสิต | ฟอร์มเพิ่มนิสิต |
| `/students/[id]` | ข้อมูลนิสิต | รายละเอียด + QR + ประวัติ |
| `/history` | ประวัติการสแกน | ตาราง + filter |
| `/settings` | ตั้งค่า/Export/Import | จัดการข้อมูล |

---

## 5. Constraints & Assumptions

- ระบบใช้งานภายในองค์กร (Intranet) ไม่ใช่ Public Internet
- อุปกรณ์สแกนต้องมีกล้องและรองรับ HTTPS
- ฐานข้อมูล MySQL ต้องติดตั้งและพร้อมใช้งานก่อนเริ่มระบบ
- ไม่รองรับ Multi-event (v1.0 จัดการได้ 1 กิจกรรมต่อครั้ง)
