# API Testing Guide - Quick Start

## Prerequisites

1. **Start the server:**
```bash
cd node-backend
npm run dev
```

Server will run on: `http://localhost:5000`

2. **Ensure database is seeded:**
```bash
npm run seed
```

## Testing Tools

You can use any of these:
- **Postman** (recommended for GUI)
- **Thunder Client** (VS Code extension)
- **cURL** (command line)
- **Browser** (for GET requests)

## Test Credentials

```
Admin:
  Email: admin@example.com
  Password: admin123

HOD Academy:
  Email: hod.academy@example.com
  Password: pass123

HOD Intensive:
  Email: hod.intensive@example.com
  Password: pass123

HOD NIAT:
  Email: hod.niat@example.com
  Password: pass123
```

---

## Quick Test Flow (5 Minutes)

### Step 1: Health Check

**Method:** GET  
**URL:** `http://localhost:5000/api/health`

**Expected Response:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2025-11-13T10:00:00.000Z",
  "database": "MongoDB Connected"
}
```

---

### Step 2: Login as Admin

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/login`  
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**⚠️ IMPORTANT: Copy the `token` value - you'll need it for all subsequent requests!**

---

### Step 3: Get Your Profile

**Method:** GET  
**URL:** `http://localhost:5000/api/auth/me`  
**Headers:** 
- `Authorization: Bearer YOUR_TOKEN_HERE`

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

### Step 4: Import Employees (CSV)

**Method:** POST  
**URL:** `http://localhost:5000/api/import/employees`  
**Headers:** 
- `Authorization: Bearer YOUR_TOKEN_HERE`
- `Content-Type: multipart/form-data`

**Body:** (form-data)
- Key: `file`
- Value: Select `sample-data/employees.csv`

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee import completed",
  "imported": 10,
  "updated": 0,
  "skipped": 0,
  "errors": []
}
```

---

### Step 5: Import Employee Submissions (CSV)

**Method:** POST  
**URL:** `http://localhost:5000/api/import/submissions`  
**Headers:** 
- `Authorization: Bearer YOUR_TOKEN_HERE`
- `Content-Type: multipart/form-data`

**Body:** (form-data)
- Key: `file`
- Value: Select `sample-data/employee_submissions.csv`

**Expected Response:**
```json
{
  "success": true,
  "message": "Employee submissions import completed",
  "imported": 16,
  "updated": 0,
  "errors": []
}
```

---

### Step 6: Login as HOD

**Method:** POST  
**URL:** `http://localhost:5000/api/auth/login`

**Body:**
```json
{
  "email": "hod.academy@example.com",
  "password": "pass123"
}
```

**⚠️ Save the HOD token separately!**

---

### Step 7: Get Department Submissions (HOD)

**Method:** GET  
**URL:** `http://localhost:5000/api/departments/DEPT_ID/submissions?period=2025-Q4`  
**Headers:** 
- `Authorization: Bearer HOD_TOKEN_HERE`

**Note:** You need the department ID. Get it from the login response under `user.department_id._id`

**Expected Response:**
```json
{
  "success": true,
  "department_id": "...",
  "period": "2025-Q4",
  "submissions": [
    {
      "submission_ref": "SUB001",
      "employee": {
        "emp_id": "EMP001",
        "name": "Arjun Sharma"
      },
      "items": [
        {"product": "Academy", "percentage": 60},
        {"product": "NIAT", "percentage": 40}
      ]
    }
  ]
}
```

---

### Step 8: Submit Department Aggregate (HOD)

**Method:** POST  
**URL:** `http://localhost:5000/api/departments/DEPT_ID/aggregate`  
**Headers:** 
- `Authorization: Bearer HOD_TOKEN_HERE`
- `Content-Type: application/json`

**Body (Option 1 - Auto Aggregate):**
```json
{
  "period": "2025-Q4",
  "auto_aggregate": true,
  "notes": "Auto-computed from employee submissions"
}
```

**Body (Option 2 - Manual):**
```json
{
  "period": "2025-Q4",
  "items": [
    {"product": "Academy", "percentage": 50},
    {"product": "Intensive", "percentage": 30},
    {"product": "NIAT", "percentage": 20}
  ],
  "notes": "Manually adjusted allocations"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Department submission created successfully",
  "dept_submission_ref": "D_SUB_001",
  "status": "submitted",
  "submitted_at": "2025-11-13T10:00:00.000Z"
}
```

---

### Step 9: Get Pending Submissions (Admin)

**Method:** GET  
**URL:** `http://localhost:5000/api/admin/pending?period=2025-Q4`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`

**Expected Response:**
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
      "items": [...]
    }
  ]
}
```

---

### Step 10: Approve Department Submission (Admin)

**Method:** PATCH  
**URL:** `http://localhost:5000/api/admin/department_submissions/SUBMISSION_ID`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`
- `Content-Type: application/json`

**Body:**
```json
{
  "status": "approved"
}
```

**Get SUBMISSION_ID from the pending submissions response (`id` field)**

**Expected Response:**
```json
{
  "success": true,
  "message": "Submission approved successfully",
  "submission": {
    "id": "...",
    "status": "approved",
    "approved_at": "2025-11-13T10:00:00.000Z"
  }
}
```

---

### Step 11: Preview Master Report (Admin)

**Method:** GET  
**URL:** `http://localhost:5000/api/admin/reports/master/2025-Q4`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`

**Expected Response:**
```json
{
  "success": true,
  "period": "2025-Q4",
  "count": 3,
  "data": [
    {
      "department": "Academy",
      "items": [...]
    }
  ]
}
```

---

### Step 12: Publish Master Report (Admin)

**Method:** POST  
**URL:** `http://localhost:5000/api/admin/publish`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`
- `Content-Type: application/json`

**Body:**
```json
{
  "period": "2025-Q4",
  "overwrite": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Master report published successfully to files",
  "published": true,
  "files": {
    "json": "C:\\...\\reports\\master_report_2025-Q4_2025-11-13.json",
    "csv": "C:\\...\\reports\\master_report_2025-Q4_2025-11-13.csv"
  },
  "data": { /* Full report */ }
}
```

---

### Step 13: List Report Files (Admin)

**Method:** GET  
**URL:** `http://localhost:5000/api/admin/reports/files`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "files": [
    "master_report_2025-Q4_2025-11-13.json",
    "master_report_2025-Q4_2025-11-13.csv"
  ]
}
```

---

### Step 14: View Report File (Admin)

**Method:** GET  
**URL:** `http://localhost:5000/api/admin/reports/file/master_report_2025-Q4_2025-11-13.json`  
**Headers:** 
- `Authorization: Bearer ADMIN_TOKEN_HERE`

**Expected Response:**
```json
{
  "success": true,
  "fileName": "master_report_2025-Q4_2025-11-13.json",
  "content": { /* Full report data */ }
}
```

---

## Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import** → **Raw text**
3. Paste this collection:

```json
{
  "info": {
    "name": "Employee Submissions API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    },
    {
      "key": "admin_token",
      "value": ""
    },
    {
      "key": "hod_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "1. Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/health"
      }
    },
    {
      "name": "2. Login Admin",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
        },
        "url": "{{base_url}}/api/auth/login"
      }
    },
    {
      "name": "3. Get Profile",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{admin_token}}"}],
        "url": "{{base_url}}/api/auth/me"
      }
    }
  ]
}
```

4. After login, copy the token and set it in **Variables** → `admin_token`

---

## Testing with cURL (Command Line)

### Full Test Script

Save this as `test.sh` (or `test.ps1` for PowerShell):

```bash
#!/bin/bash

BASE_URL="http://localhost:5000"

echo "=== 1. Health Check ==="
curl $BASE_URL/api/health
echo "\n\n"

echo "=== 2. Login as Admin ==="
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

echo $RESPONSE
TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo "\n\n"

echo "=== 3. Get Profile ==="
curl $BASE_URL/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
echo "\n\n"

echo "=== 4. Import Employees ==="
curl -X POST $BASE_URL/api/import/employees \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample-data/employees.csv"
echo "\n\n"

echo "=== 5. Get Pending Submissions ==="
curl $BASE_URL/api/admin/pending \
  -H "Authorization: Bearer $TOKEN"
echo "\n\n"
```

---

## Common Issues & Solutions

### ❌ 401 Unauthorized
**Problem:** Token is missing or invalid  
**Solution:** 
- Ensure you're including the `Authorization: Bearer TOKEN` header
- Token expires after 24 hours - login again

### ❌ 403 Forbidden
**Problem:** User doesn't have permission  
**Solution:**
- HOD can only access their own department
- Some endpoints are admin-only
- Check user role in profile response

### ❌ 400 Bad Request
**Problem:** Invalid data  
**Solution:**
- Check period format: must be `YYYY-Q[1-4]` (e.g., `2025-Q4`)
- Percentage must be 0-100
- Product must be: Academy, Intensive, or NIAT

### ❌ 404 Not Found
**Problem:** Entity doesn't exist  
**Solution:**
- Verify IDs are correct
- Ensure data was imported/created first
- Check endpoint URL is correct

### ❌ 409 Conflict
**Problem:** Duplicate entry  
**Solution:**
- Use `overwrite: true` when publishing
- Department can only submit once per period
- Check for duplicate emp_id or email

---

## All API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/login` | None | Login |
| GET | `/api/auth/me` | All | Get profile |
| POST | `/api/import/employees` | Admin | Import employees CSV |
| POST | `/api/import/submissions` | Admin | Import submissions CSV |
| GET | `/api/departments/:id/submissions` | HOD/Admin | Get dept submissions |
| POST | `/api/departments/:id/aggregate` | HOD | Submit dept aggregate |
| PATCH | `/api/departments/employee_submissions/:id` | HOD | Update submission |
| GET | `/api/admin/pending` | Admin | Get pending submissions |
| PATCH | `/api/admin/department_submissions/:id` | Admin | Approve/reject |
| POST | `/api/admin/publish` | Admin | Publish to files |
| GET | `/api/admin/reports/master/:period` | Admin | Preview report |
| GET | `/api/admin/reports/files` | Admin | List report files |
| GET | `/api/admin/reports/file/:fileName` | Admin | Get report content |
| GET | `/api/admin/audit/:entity/:id` | Admin | Get audit logs |

---

## Video Tutorial Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Database is seeded (`npm run seed`)
- [ ] Postman or testing tool is ready
- [ ] Sample CSV files are available
- [ ] You have test credentials

## Need Help?

- Check server logs for errors
- Verify MongoDB connection
- Ensure all dependencies are installed: `npm install`
- Re-seed database: `npm run seed`
- Check port 5000 is not in use

**Happy Testing! 🚀**

