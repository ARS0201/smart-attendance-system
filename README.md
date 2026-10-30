# Smart Attendance & Digital On-Duty (OD) System

A modern, web-based, role-governed digital attendance platform engineered to eliminate paper sign-in friction, prevent proxy attendance through cryptographic rotating QR codes, and automate the On-Duty (OD) request lifecycle.

---

## 🌟 Key Features

### 1. Faculty Command Center
- **Dynamic QR Code Generation:** Real-time projected QR code backed by a signed HMAC-SHA256 token that rotates automatically every **10 seconds**.
- **Anti-Proxy Protection:** Rejects forwarded screenshots or old photos taken by students in class to prevent absent friends from marking proxy attendance.
- **Live Attendance Monitor:** Real-time polling stream showing check-ins as students scan their phones.
- **Manual Attendance Overrides:** 1-click fallback to mark students present if their mobile device runs out of battery.
- **Digital Session History & CSV Export:** Download comprehensive Excel/CSV attendance logs with a single click.

### 2. Student Mobile & Desktop Portal
- **WebRTC Camera QR Scanner:** Directly accesses the device camera via browser without requiring any native app store download.
- **Instant Confirmation:** Confetti celebration animation, verified green badge, lecture details, and timestamp feedback upon successful check-in.
- **Duplicate Prevention:** Strict database-level composite unique constraint on `(sessionId, studentId)` prevents double-submissions.
- **Course Standing & Low Attendance Warnings:** Visual percentage gauges across all enrolled subjects with alerts when attendance dips below 75%.
- **Digital On-Duty (OD) Applications:** Submit official event details, date ranges, and proof URLs for faculty review.

### 3. On-Duty (OD) Lifecycle & Auto-Credit Adjustment
- Multi-category support: `ACADEMIC`, `SPORTS`, `CULTURAL`, `MEDICAL`, `INTERNSHIP`.
- Faculty and Administrators review requests with remarks.
- **Automated Adjustment:** Once approved, absent records for lectures occurring within the OD date range automatically convert to `ON_DUTY` status.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 16+ (App Router) + TypeScript
- **Styling:** Tailwind CSS + Lucide Icons
- **Database & ORM:** SQLite / PostgreSQL + Prisma ORM
- **Security:** HMAC-SHA256 Dynamic Token Rotating Engine, HTTP-Only Signed Session Cookies, bcrypt password hashing
- **QR Engine:** `qrcode.react` (vector SVG) + `html5-qrcode` (camera WebRTC scanning)

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database & Seed Demo Data
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Demo Accounts

You can log in manually or use the **1-Click Instant Persona Switcher** on the login page:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Faculty** | `faculty@smartattend.edu` | `password123` | Dr. Alan Turing (CS Dept) |
| **Faculty** | `ada@smartattend.edu` | `password123` | Prof. Ada Lovelace (CS Dept) |
| **Student** | `student@smartattend.edu` | `password123` | John Doe (Roll: `21CS001`) |
| **Student** | `jane@smartattend.edu` | `password123` | Jane Smith (Roll: `21CS002`) |
| **Admin** | `admin@smartattend.edu` | `password123` | Dean of Academic Affairs |

---

## 🧪 Automated Verification Suite

Run the full end-to-end test suite:
```bash
npx tsx scripts/test-verification.ts
```

All 15 test scenarios verify:
1. Dynamic OTP rotating token generation
2. Anti-proxy screenshot rejection (> 10s expiration)
3. Instant check-in recording
4. Atomic duplicate submission prevention
5. OD approval and automatic attendance ledger reconciliation
