# Employee Submissions Management System - Backend

A comprehensive backend system for managing employee submissions, department aggregations, and master reports with Google Sheets integration.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Business Logic](#business-logic)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)

## 🏗️ Architecture

### High-Level Overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   React     │────▶│   Express    │────▶│  MongoDB   │
│  Frontend   │     │   API Server │     │  Database  │
└─────────────┘     └──────────────┘     └────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Google      │
                    │  Sheets API  │
                    └──────────────┘
```

### System Components

1. **API Server** - Express.js with TypeScript
2. **Database** - MongoDB with Mongoose ODM
3. **Authentication** - JWT-based auth with role-based access control
4. **File Processing** - CSV import with validation
5. **External Integration** - Google Sheets for report publishing
6. **Audit System** - Comprehensive audit logging

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Upload**: Multer
- **CSV Parsing**: fast-csv
- **Google Sheets**: googleapis
- **Job Queue**: BullMQ (optional, for background jobs)
- **Dev Tools**: Nodemon, ts-node

## 📁 Project Structure

```
node-backend/
├── src/
│   ├── config/
│   │   └── database.ts           # MongoDB connection
│   ├── models/
│   │   ├── User.model.ts         # User schema (HOD/Admin)
│   │   ├── Department.model.ts   # Department schema
│   │   ├── Employee.model.ts     # Employee master data
│   │   ├── EmployeeSubmission.model.ts  # Employee submissions
│   │   ├── DepartmentSubmission.model.ts # HOD aggregates
│   │   ├── MasterReport.model.ts # Published reports
│   │   └── AuditLog.model.ts     # Audit trail
│   ├── controllers/
│   │   ├── auth.controller.ts    # Authentication logic
│   │   ├── import.controller.ts  # CSV import logic
│   │   ├── hod.controller.ts     # HOD operations
│   │   └── admin.controller.ts   # Admin operations
│   ├── routes/
│   │   ├── auth.routes.ts        # Auth endpoints
│   │   ├── import.routes.ts      # Import endpoints
│   │   ├── hod.routes.ts         # HOD endpoints
│   │   └── admin.routes.ts       # Admin endpoints
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT & RBAC
│   │   └── validation.middleware.ts # Input validation
│   ├── services/
│   │   ├── audit.service.ts      # Audit logging
│   │   ├── csv.service.ts        # CSV processing
│   │   ├── googleSheets.service.ts # Sheets integration
│   │   └── reference.service.ts  # ID generation
│   ├── scripts/
│   │   └── seed.ts              # Database seeding
│   └── index.ts                 # Main application
├── .env                         # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
Create `.env` file in the root:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/employee_submissions
JWT_SECRET=your-super-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
```

3. **Seed the database** (optional):
```bash
npm run seed
```

This creates:
- 4 departments (Academy, Intensive, NIAT, HR)
- 4 users (1 admin, 3 HODs)
- 7 sample employees
- 11 sample submissions

4. **Start development server**:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication

#### POST /api/auth/login
Login and get JWT token

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### GET /api/auth/me
Get current user profile (requires auth)

**Headers:** `Authorization: Bearer <token>`

### Import (Admin Only)

#### POST /api/import/employees
Import employees from CSV

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: CSV file

**CSV Format:**
```
emp_id,first_name,last_name,email,department,role,location,status
EMP001,Arjun,Sharma,arjun@example.com,Academy,Developer,Bangalore,active
```

**Response:**
```json
{
  "success": true,
  "imported": 50,
  "updated": 10,
  "skipped": 0,
  "errors": []
}
```

#### POST /api/import/submissions
Import employee submissions from CSV

**CSV Format:**
```
emp_id,period,product,percentage,notes,source
EMP001,2025-Q4,Academy,60,Working on project,csv_import
EMP001,2025-Q4,NIAT,40,Training,csv_import
```

**Response:**
```json
{
  "success": true,
  "imported": 120,
  "updated": 5,
  "errors": []
}
```

### HOD Operations

#### GET /api/departments/:id/submissions?period=2025-Q4
Get all employee submissions for review

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "department_id": "507f1f77bcf86cd799439011",
  "period": "2025-Q4",
  "submissions": [
    {
      "submission_ref": "SUB001",
      "employee": {
        "emp_id": "EMP001",
        "name": "Arjun Sharma",
        "email": "arjun@example.com"
      },
      "items": [
        { "product": "Academy", "percentage": 60, "notes": "..." },
        { "product": "NIAT", "percentage": 40 }
      ],
      "status": "pending"
    }
  ]
}
```

#### POST /api/departments/:id/aggregate
Submit department-level aggregate

**Request:**
```json
{
  "period": "2025-Q4",
  "items": [
    { "product": "Academy", "percentage": 45 },
    { "product": "Intensive", "percentage": 35 },
    { "product": "NIAT", "percentage": 20 }
  ],
  "notes": "Based on verified submissions"
}
```

OR with auto-aggregation:
```json
{
  "period": "2025-Q4",
  "auto_aggregate": true,
  "notes": "Auto-computed from approved submissions"
}
```

**Response:**
```json
{
  "success": true,
  "dept_submission_ref": "D_SUB_001",
  "status": "submitted",
  "submitted_at": "2025-11-13T10:00:00Z"
}
```

### Admin Operations

#### GET /api/admin/pending
Get pending department submissions

**Query Params:**
- `period` (optional): Filter by period
- `status` (optional): Filter by status (default: submitted)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "submissions": [
    {
      "dept_submission_ref": "D_SUB_001",
      "department": "Academy",
      "period": "2025-Q4",
      "status": "submitted",
      "items": [...],
      "submitted_by": { "name": "HOD Academy" },
      "submitted_at": "2025-11-13T10:00:00Z"
    }
  ]
}
```

#### PATCH /api/admin/department_submissions/:id
Approve or reject submission

**Request:**
```json
{
  "status": "approved"
}
```

OR

```json
{
  "status": "rejected",
  "rejection_reason": "Percentages don't add up correctly"
}
```

#### POST /api/admin/publish
Publish master report to Google Sheets

**Request:**
```json
{
  "period": "2025-Q4",
  "target": "google_sheet",
  "overwrite": true
}
```

**Response:**
```json
{
  "success": true,
  "published": true,
  "sheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "masterReportId": "507f1f77bcf86cd799439011",
  "period": "2025-Q4",
  "submission_count": 3
}
```

#### GET /api/admin/reports/master/:period
Preview master report before publishing

## 💼 Business Logic

### Workflow

```
1. ADMIN IMPORTS DATA
   ├─ Upload employees CSV
   ├─ Upload submissions CSV
   └─ System validates and stores in MongoDB

2. HOD REVIEWS
   ├─ View employee submissions for their department
   ├─ Approve/adjust individual submissions (optional)
   └─ Submit department aggregate

3. ADMIN APPROVES
   ├─ Review pending department submissions
   ├─ Approve or reject with reason
   └─ Modify items during approval if needed

4. ADMIN PUBLISHES
   ├─ Trigger publish to Google Sheets
   ├─ System creates master report
   ├─ Writes to Google Sheets
   └─ Stores audit log
```

### Validation Rules

1. **Percentage Validation**
   - Must be between 0 and 100
   - Can enforce sum = 100 (optional)

2. **Period Format**
   - Must be YYYY-Q[1-4] (e.g., 2025-Q4)

3. **Product Values**
   - Must be one of: Academy, Intensive, NIAT

4. **Role-Based Access**
   - HOD can only access their own department
   - Admin can access everything

5. **Idempotency**
   - Duplicate imports are handled (upsert)
   - Human-readable references (SUB001, D_SUB_001)

## 💾 Database Schema

### Users
```typescript
{
  name: String,
  email: String (unique),
  password_hash: String,
  role: 'hod' | 'admin',
  department_id: ObjectId (ref: Department)
}
```

### Departments
```typescript
{
  name: String (unique),
  hod_user_id: ObjectId (ref: User)
}
```

### Employees
```typescript
{
  emp_id: String (unique),
  first_name: String,
  last_name: String,
  email: String,
  department_id: ObjectId (ref: Department),
  role: String,
  location: String,
  status: String
}
```

### Employee Submissions
```typescript
{
  submission_ref: String (unique),
  employee_id: ObjectId (ref: Employee),
  period: String,
  product: 'Academy' | 'Intensive' | 'NIAT',
  percentage: Number (0-100),
  notes: String,
  source: String,
  approved: Boolean
}
```

### Department Submissions
```typescript
{
  dept_submission_ref: String (unique),
  department_id: ObjectId (ref: Department),
  period: String,
  submitted_by: ObjectId (ref: User),
  status: 'submitted' | 'approved' | 'rejected',
  items: [{
    product: String,
    percentage: Number,
    notes: String
  }],
  notes: String,
  submitted_at: Date,
  approved_at: Date,
  rejection_reason: String
}
```

## 🔐 Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Auth
JWT_SECRET=your-secret-key-here

# CORS
CORS_ORIGIN=http://localhost:3000

# Google Sheets (Optional)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
# OR
GOOGLE_SERVICE_ACCOUNT_FILE=./service-account.json
# OR
GOOGLE_CLIENT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-spreadsheet-id
```

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 24-hour expiry
- Role-based access control (RBAC)
- Department-level authorization for HODs
- CSV input sanitization
- File upload size limits (10MB)
- CORS configuration

## 📊 Audit Logging

All critical actions are logged:
- User login
- CSV imports
- Submission updates
- Approvals/rejections
- Report publishing

Each log includes:
- Actor (user)
- Action type
- Entity affected
- Old/new values
- Timestamp
- IP address

## 🚀 Next Steps

1. ✅ Complete backend with all endpoints
2. ✅ Authentication & authorization
3. ✅ CSV import with validation
4. ✅ Audit logging
5. ✅ Google Sheets integration
6. Add background jobs (BullMQ) for async tasks
7. Add rate limiting
8. Add API documentation (Swagger)
9. Add unit tests
10. Deploy to production

## 📝 License

ISC
