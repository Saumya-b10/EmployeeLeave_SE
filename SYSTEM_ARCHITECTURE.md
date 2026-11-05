# 🏛️ System Architecture & Engineering Documentation
## Swiftly — Employee Leave & Reimbursement Portal

---

## 1. 📌 System Overview

### 1.1 Executive Summary
**Swiftly** is a secure, full-stack enterprise web portal engineered to modernize and automate core human resource operations—specifically **Employee Leave Management** and **Expense Reimbursement Processing**. 

In conventional organizational setups, leave requests and operational expense reimbursements are managed through fragmented communication channels (email threads, paper slips, or shared spreadsheets). This causes severe operational overhead: untracked leave balances, lost receipts, delayed approvals, lack of audit trails, and financial governance risks.

**Swiftly resolves these challenges by introducing:**
* Centralized, role-based workflows for **Employees**, **Managers**, and **System Administrators**.
* An automated **Leave Quota Engine** that enforces overlap prevention, date validity, and real-time balance deductions.
* An integrated **Digital Receipt Management System** capable of hosting and verifying proof-of-payment documents (tax invoices, flight itineraries, cab receipts).
* Dynamic analytics (status donut charts) and one-click data extraction (**CSV spreadsheets** and **PDF reports**).

---

## 2. 🏗️ High-Level System Architecture

Swiftly is built using a modern **Decoupled Multi-Tier Architecture** consisting of a React Single-Page Application (SPA) on the client side, a RESTful Node.js/Express service on the backend, and a document-oriented MongoDB database for persistence.

```mermaid
flowchart TD
    subgraph ClientLayer ["1. Presentation Layer (Client - Port 5173)"]
        UI["React 19 + TailwindCSS v4 SPA"]
        Router["React Router DOM (Protected Routes)"]
        State["Auth Context & Theme Context"]
        Charts["Recharts Visual Engine"]
        ExportEngine["jsPDF & AutoTable Report Generator"]
        UI --> Router
        Router --> State
        Router --> Charts
        Router --> ExportEngine
    end

    subgraph APILayer ["2. Application & API Gateway Layer (Server - Port 3000)"]
        Express["Express.js Server Engine"]
        CORS["CORS & Body Parser"]
        StaticServer["Static Asset Server (/bills/*.svg)"]
        AuthMiddleware["JWT Authentication Middleware"]
        RBAC["Role Authorization Guard (checkRole)"]
        ZodValidator["Zod Input Schema Validation"]
        Controllers["Controllers (Auth, Leave, Reimbursement, User)"]
        
        Express --> CORS
        Express --> StaticServer
        CORS --> AuthMiddleware
        AuthMiddleware --> RBAC
        RBAC --> ZodValidator
        ZodValidator --> Controllers
    end

    subgraph DataLayer ["3. Data & Persistence Layer (MongoDB - Port 27017)"]
        Mongoose["Mongoose 9 ODM"]
        UsersCol[("Users Collection")]
        LeavesCol[("Leaves Collection")]
        ReimbursementsCol[("Reimbursements Collection")]
        
        Mongoose --> UsersCol
        Mongoose --> LeavesCol
        Mongoose --> ReimbursementsCol
    end

    UI -- "HTTPS / JSON REST API" --> Express
    Controllers -- "Async Queries" --> Mongoose
```

### Architectural Highlights:
1. **Stateless Authorization**: Client sessions are maintained via JSON Web Tokens (JWT) signed with HMAC-SHA256. The server does not maintain server-side session stores, enabling horizontal scalability.
2. **Client-Side Protected Routing**: Route transitions on the frontend check the decoded JWT role in `AuthContext` before rendering restricted views (Employee, Manager, Admin).
3. **Decoupled Static Asset Hosting**: Vector receipts and bills are hosted via Express static routing and client asset pipelines, eliminating third-party CDN downtime and external 404 errors.

---

## 3. 🧩 Core Functional Modules

```mermaid
graph LR
    A["Swiftly System"] --> B["1. Auth & RBAC"]
    A --> C["2. Smart Leave Engine"]
    A --> D["3. Reimbursement Module"]
    A --> E["4. User Administration"]
    A --> F["5. Analytics & Exports"]
```

### 3.1 Authentication & Role-Based Access Control (RBAC) Module
* **Password Encryption**: Sensitive passwords are salted and hashed using **bcryptjs** with 10 salt rounds.
* **JWT Token Issuance**: On successful credential verification, an encrypted JWT with a 2-hour validity window is issued.
* **RBAC Enforcement**: API routes are gated by `checkRole(['employee', 'manager', 'admin'])`.
* **Self-Bootstrapping Mechanism**: When the system is initialized on a clean database, the very first user who registers is automatically granted the `admin` role. All subsequent registrations are placed into an `Approval-Pending` state.

### 3.2 Smart Leave Management & Quota Engine
* **Date Normalization**: Dates are parsed to UTC midnight timestamps to prevent cross-timezone miscalculations.
* **Overlap Protection**: Queries the database to ensure an employee does not hold an active (`pending` or `approved`) leave request overlapping with the requested date range:
  $$\text{Query: } (\text{fromDate} \le \text{req.toDate}) \land (\text{toDate} \ge \text{req.fromDate})$$
* **Dynamic Quota Calculation**: Each employee starts with an annual pool (default: 20 days). Available days are dynamically evaluated:
  $$\text{Available Days} = \text{Total Allocated} - \text{Approved Days} - \text{Pending Days}$$
* If $\text{Requested Days} > \text{Available Days}$, the transaction is rejected with an explanatory message.

### 3.3 Expense Reimbursement & Digital Document Module
* **Expense Ingestion**: Accepts claims specifying amount in INR (₹), expense date, category description, and receipt file.
* **Document Management**: Locally hosts SVG/PDF invoices (Ola cab rides, IndiGo flights, Airtel broadband, Barbeque Nation team dinners).
* **Audit Locking**: While a claim is `pending`, the owner can replace or remove their receipt. Once `approved` or `rejected`, the record is locked to prevent tampering.

### 3.4 Governance & Conflict-of-Interest Safeguards
* **Anti-Self-Approval Guard**: Managers and administrators cannot approve or reject their own leave applications or reimbursement claims.
* **Account Deletion Protection**: Administrators cannot delete their own active account, and the last remaining administrator account cannot be deleted.

### 3.5 Visual Analytics & Report Generation Engine
* **Real-Time Donut Visualizations**: Uses `Recharts` to compute and render SVG status distributions (Approved vs. Pending vs. Rejected).
* **Client-Side Document Compilation**: Leverages `jspdf` and `jspdf-autotable` to generate formatted PDF summary tables directly in the browser without server CPU overhead.

---

## 4. 🔄 End-to-End User Flows

### 4.1 User Registration & Admin Onboarding Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as New Staff Member
    participant FE as Frontend Client
    participant API as Express API
    participant DB as MongoDB
    actor Admin as System Administrator

    User->>FE: Fill Registration Form (Name, Email, Dept, Password)
    FE->>API: POST /api/auth/register
    API->>DB: Check if email exists
    alt Email already registered
        API-->>FE: 400 Bad Request ("User already exists")
    else First User in Database
        API->>DB: Save User with Role = "admin"
        API-->>FE: 201 Created (Assigned Administrator Role)
    else Regular Staff User
        API->>DB: Save User with Role = "Approval-Pending"
        API-->>FE: 201 Created ("Wait for Admin approval")
    end

    Note over Admin, FE: Admin approves pending staff
    Admin->>FE: Open Admin Dashboard -> Users Tab
    Admin->>FE: Select Role from Dropdown ("Employee" / "Manager")
    FE->>API: PUT /api/user/updateRole/:id { role: "employee" }
    API->>DB: Update user role in database
    API-->>FE: 200 OK ("User role updated")
    User->>FE: Login with Email & Password -> Access Granted!
```

---

### 4.2 Leave Application & Approval Flow
```mermaid
sequenceDiagram
    autonumber
    actor Emp as Employee
    participant FE as Frontend
    participant API as Express API
    participant DB as MongoDB
    actor Mgr as Manager / Admin

    Emp->>FE: Select From Date, To Date & Reason
    FE->>API: POST /api/leave/applyLeave (JWT Attached)
    API->>API: Validate Dates (ToDate >= FromDate)
    API->>DB: Check Overlapping Leaves
    alt Overlap Detected
        API-->>FE: 400 Bad Request ("Overlapping leave exists")
    else Overlap Clear
        API->>DB: Calculate Leave Balance (20 - Approved - Pending)
        alt Insufficient Days Remaining
            API-->>FE: 400 Bad Request ("Insufficient leave balance")
        else Balance Valid
            API->>DB: Insert Leave with status = "pending"
            API-->>FE: 201 Created ("Leave applied successfully")
        end
    end

    Mgr->>FE: Open Team Leaves Dashboard
    Mgr->>FE: Click "Approve" or "Reject"
    FE->>API: PUT /api/leave/updateLeave/:id { status: "approved" }
    API->>API: Verify Approver is NOT Applicant (Anti-Conflict)
    API->>DB: Update Leave Status
    API-->>FE: 200 OK ("Leave status updated")
    FE-->>Mgr: Update Donut Chart & Status Badge
```

---

### 4.3 Expense Reimbursement & Receipt Audit Flow
```mermaid
flowchart TD
    Start([Employee Submits Claim]) --> Form[Enter Amount ₹, Date, Description & Attach Receipt]
    Form --> API[POST /api/reimbursement/applyReimbursement]
    API --> Validate{Amount > 0 and Valid Date?}
    Validate -- No --> Err[Return 400 Error]
    Validate -- Yes --> Save[Store Claim with Status: 'pending']
    
    Save --> MgrReview{Manager / Admin Reviews Claim}
    MgrReview --> ViewBill[Click 'View' -> Preview Receipt in Modal]
    ViewBill --> Decision{Approver Decision}
    Decision -- Approve --> Appr[Status: 'approved' -> Record Locked]
    Decision -- Reject --> Rej[Status: 'rejected' -> Record Locked]
    
    Appr --> Export[Available in Monthly PDF / CSV Financial Export]
    Rej --> Export
```

---

## 5. ⚙️ Engineering Methodology & Design Patterns

| Pattern / Principle | Implementation in Swiftly | Benefit |
|:---|:---|:---|
| **MVC Separation** | Mongoose Models (`models/`), Express Routes (`routes/`), Business Controllers (`controllers/`) | Clean separation of business logic from transport layers |
| **Stateless Client-Server** | JSON Web Tokens passed in `Authorization: Bearer <token>` headers | Zero server session memory leaks; easily clusterable |
| **Defensive Validation** | Zod schemas validate payload types before hitting database controllers | Rejects malformed requests with granular validation error lists |
| **Anti-Conflict Guards** | Checks `applicant.id !== approver.id` inside leave and expense handlers | Prevents fraud and self-approval of claims |
| **Concurrency Orchestration** | Node child process spawner ([`dev.js`](file:///D:/Work%20Folder/college/College%20Labs/SE/EmployeeLeave_SE/dev.js)) | One-command execution of both Vite and Express pipelines |

---

## 6. 💻 Comprehensive Technology Stack

### 6.1 Frontend Technologies
| Tool / Library | Version | Role in Architecture |
|:---|:---:|:---|
| **React** | 19.2.0 | Declarative component-based user interface |
| **Vite** | 7.3.1 | Next-generation frontend build tool and hot-module replacement |
| **TailwindCSS** | 4.2.1 | Utility-first styling engine with native dark-mode tokens |
| **React Router DOM** | 7.15.0 | Client-side routing with role-guarded route boundaries |
| **Recharts** | 3.7.0 | Declarative SVG donut/pie charts for approval analytics |
| **jsPDF & AutoTable** | 4.2.1 / 5.0.8 | In-browser PDF report rendering and document formatting |
| **React Hot Toast** | 2.6.0 | Non-blocking real-time feedback notifications |
| **Axios** | 1.13.5 | Promise-based HTTP client with automatic auth headers |

### 6.2 Backend Technologies
| Tool / Library | Version | Role in Architecture |
|:---|:---:|:---|
| **Node.js** | 24.18.0 | High-performance asynchronous JavaScript runtime |
| **Express.js** | 5.2.1 | REST API routing and middleware framework |
| **Mongoose** | 9.2.1 | Schema-based Object Data Modeling (ODM) for MongoDB |
| **JSON Web Token** | 9.0.3 | Cryptographic token creation and signature verification |
| **bcryptjs** | 3.0.3 | One-way password salt generation and hashing |
| **Zod** | 4.4.3 | Runtime data schema validation |
| **Multer** | 2.0.2 | Multipart/form-data handler for binary bill uploads |
| **Nodemon** | 3.1.14 | Development auto-restart monitor |

### 6.3 Database & Storage
| Component | Specification | Description |
|:---|:---:|:---|
| **MongoDB** | v8.2+ | Document database storing Users, Leaves, and Reimbursements |
| **Local Vector CDN** | `/bills/*.svg` | Locally served, zero-dependency, high-res invoice assets |

---

## 7. 🚀 Execution & Verification

### Unified Development Command
From the project directory, run:

```bash
npm run dev
```

* **Frontend UI**: `http://localhost:5173`
* **Backend API**: `http://localhost:3000`
* **Default Database Port**: `127.0.0.1:27017`
* **All Pre-Configured Passwords**: `123456`

