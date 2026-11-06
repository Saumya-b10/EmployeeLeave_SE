# Swiftly — Leave & Reimbursement Portal

> A full-stack enterprise web portal for employee leave tracking, expense reimbursement management, and hierarchical approvals.

---

## ⚡ Quick Start (Single Command)

From the project directory, run:

```bash
npm run dev
```

*This single command starts both the **Backend API (port 3000)** and the **Frontend Client (port 5173)** concurrently.*

* Open in browser: 👉 **`http://localhost:5173`**

---

## 🔑 All Login Credentials

> **All passwords for all accounts are set to: `123456`**

| Name | Role | Email | Password | Department |
|:---|:---:|:---|:---:|:---:|
| **System Administrator** | `admin` | `admin@swiftly.local` | **`123456`** | Administration |
| **Arya** | `manager` | `arya12@gmail.com` | **`123456`** | Engineering |
| **Rohan Sharma** | `employee` | `rohan.sharma@swiftly.in` | **`123456`** | Engineering |
| **Priya Patel** | `employee` | `priya.patel@swiftly.in` | **`123456`** | Finance |
| **Test Employee** | `employee` | `employee_test@example.com` | **`123456`** | Engineering |

---

## 🧩 Features & What Each Does

### 1. Authentication & Role-Based Access Control (RBAC)
* **JWT Tokens & Salted Bcrypt**: 2-hour session expiry, passwords hashed with 10 salt rounds.
* **Self-Bootstrapping**: First registered account becomes Admin; subsequent signups enter `Approval-Pending` until an Admin approves them.

### 2. Smart Leave Management Engine
* **Leave Application**: Employees apply specifying `From Date`, `To Date`, and `Reason`.
* **Automated Validations**: Prevents date overlap, rejects inverted date ranges, and checks requested days against annual balance (default: 20 days).
* **Quota Tracking**: Remaining days deduct dynamically upon approval.

### 3. Expense Reimbursement & Bill Viewer
* **Claim Submission**: Submit expense claims with amount (₹ INR), date, and description.
* **Document Attachment**: Attached receipts (Ola trips, IndiGo flights, Airtel broadband, Barbeque Nation dining) viewable directly in-app with zero external dependencies.
* **Pending Controls**: Employees can preview, replace, or delete attached receipts until the claim is reviewed.

### 4. Hierarchical Approvals & Anti-Conflict Rules
* **Manager Role**: Reviews, approves, or rejects team members' leave and reimbursement claims.
* **Admin Role**: Approves manager requests, manages all user accounts, promotes/demotes roles, and deletes users.
* **Self-Approval Guard**: The system strictly blocks managers and admins from approving their own leaves or claims.

### 5. Analytics & Reporting
* **Donut Charts**: Interactive status breakdowns (Approved, Pending, Rejected) powered by Recharts.
* **Instant Export**: Download filtered leave and expense tables as formatted **PDFs** (jsPDF) or standard **CSV** spreadsheets.
* **Modern UI**: Full Dark/Light mode theme switch and real-time toast notifications.

---

## 📁 Clean Project Structure

```text
EmployeeLeave_SE/
├── dev.js              # Single-command concurrent launcher
├── package.json        # Root scripts (npm run dev)
├── README.md           # Complete documentation
├── client/             # React 19 + Vite 7 frontend
│   ├── public/bills/   # Authentic vector invoice & receipt assets
│   └── src/            # Components, pages, contexts, styles
└── server/             # Node.js + Express 5 backend
    ├── config/         # MongoDB connection & configurations
    ├── controllers/    # Auth, Leave, Reimbursement & User logic
    ├── models/         # Mongoose schemas (User, Leave, Reimbursement)
    ├── routes/         # Express REST API routes
    └── scripts/        # Seeding scripts (seedMockData.js, seedAdmin.js)
```

---

## 🛠️ Tech Stack

* **Frontend**: React 19, Vite 7, TailwindCSS v4, Recharts, jsPDF, React Hot Toast
* **Backend**: Node.js, Express 5, Mongoose 9, JWT, Bcrypt.js, Multer
* **Database**: MongoDB Local / Compass (`mongodb://127.0.0.1:27017/employee_leave`)
