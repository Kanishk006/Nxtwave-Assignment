# API Testing Guide

Complete guide to test all endpoints using cURL, Postman, or any HTTP client.

## Prerequisites

1. Start the server: `npm run dev`
2. Seed the database: `npm run seed`
3. Server should be running on `http://localhost:5000`

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

## Testing Flow

### Step 1: Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**Save the token from response!**

### Step 2: Test Health Check

```bash
curl http://localhost:5000/api/health
```

### Step 3: Get Current User Profile

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 4: Import Employees (Admin)

Create `employees.csv`:
```csv
emp_id,first_name,last_name,email,department,role,location,status
EMP100,John,Doe,john.doe@example.com,Academy,Senior Dev,Bangalore,active
EMP101,Jane,Smith,jane.smith@example.com,Intensive,Manager,Mumbai,active
EMP102,Bob,Johnson,bob.j@example.com,NIAT,Consultant,Delhi,active
```

```bash
curl -X POST http://localhost:5000/api/import/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@employees.csv"
```

### Step 5: Import Employee Submissions (Admin)

Create `submissions.csv`:
```csv
emp_id,period,product,percentage,notes,source
EMP100,2025-Q4,Academy,70,Primary work,test_import
EMP100,2025-Q4,NIAT,30,Secondary,test_import
EMP101,2025-Q4,Intensive,100,Full time,test_import
EMP102,2025-Q4,NIAT,80,Main project,test_import
EMP102,2025-Q4,Academy,20,Support,test_import
```

```bash
curl -X POST http://localhost:5000/api/import/submissions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@submissions.csv"
```

### Step 6: Login as HOD

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hod.academy@example.com",
    "password": "pass123"
  }'
```

**Save the HOD token!**

### Step 7: Get Department Submissions (HOD)

First, get the department ID from the login response, or use MongoDB to find it.

```bash
curl "http://localhost:5000/api/departments/DEPARTMENT_ID/submissions?period=2025-Q4" \
  -H "Authorization: Bearer HOD_TOKEN_HERE"
```

### Step 8: Update Employee Submission (HOD)

```bash
curl -X PATCH http://localhost:5000/api/departments/employee_submissions/SUBMISSION_ID \
  -H "Authorization: Bearer HOD_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "percentage": 75,
    "notes": "Adjusted after review",
    "approved": true
  }'
```

### Step 9: Submit Department Aggregate (HOD)

Option A - Manual items:
```bash
curl -X POST http://localhost:5000/api/departments/DEPARTMENT_ID/aggregate \
  -H "Authorization: Bearer HOD_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "items": [
      {"product": "Academy", "percentage": 45, "notes": "Primary focus"},
      {"product": "Intensive", "percentage": 30},
      {"product": "NIAT", "percentage": 25}
    ],
    "notes": "Q4 department allocation"
  }'
```

Option B - Auto-aggregate:
```bash
curl -X POST http://localhost:5000/api/departments/DEPARTMENT_ID/aggregate \
  -H "Authorization: Bearer HOD_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "auto_aggregate": true,
    "notes": "Auto-computed from approved employee submissions"
  }'
```

### Step 10: Get Pending Submissions (Admin)

```bash
curl "http://localhost:5000/api/admin/pending?period=2025-Q4" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Step 11: Approve Department Submission (Admin)

```bash
curl -X PATCH http://localhost:5000/api/admin/department_submissions/SUBMISSION_ID \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

Or reject:
```bash
curl -X PATCH http://localhost:5000/api/admin/department_submissions/SUBMISSION_ID \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "rejection_reason": "Numbers dont add up to 100"
  }'
```

### Step 12: Preview Master Report (Admin)

```bash
curl http://localhost:5000/api/admin/reports/master/2025-Q4 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### Step 13: Publish Master Report (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/publish \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "target": "google_sheet",
    "overwrite": true
  }'
```

### Step 14: Get Audit Logs (Admin)

```bash
curl http://localhost:5000/api/admin/audit/department_submission/ENTITY_ID \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Employee Submissions API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"admin123\"\n}"
            },
            "url": {"raw": "{{base_url}}/api/auth/login"}
          }
        },
        {
          "name": "Get Profile",
          "request": {
            "method": "GET",
            "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
            "url": {"raw": "{{base_url}}/api/auth/me"}
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "base_url", "value": "http://localhost:5000"},
    {"key": "token", "value": ""}
  ]
}
```

## Common Errors

### 401 Unauthorized
- Token is missing or invalid
- Token has expired (24 hours)
- Solution: Login again and get a new token

### 403 Forbidden
- User doesn't have permission for this action
- HOD trying to access another department
- Solution: Check user role and department

### 400 Bad Request
- Invalid input data
- Missing required fields
- Invalid period format (must be YYYY-Q[1-4])
- Percentage out of range (0-100)

### 404 Not Found
- Entity doesn't exist
- Wrong ID in URL
- Employee not found during submission import

### 409 Conflict
- Duplicate entry (email, emp_id, etc.)
- Department submission already exists for period
- Master report already published (use overwrite: true)

## Tips

1. **Save tokens**: Use Postman environment variables or export to shell
   ```bash
   export ADMIN_TOKEN="your-token-here"
   curl -H "Authorization: Bearer $ADMIN_TOKEN" ...
   ```

2. **Get IDs**: After creating entities, save their IDs from the response

3. **Period format**: Always use YYYY-Q[1-4] format (e.g., 2025-Q1, 2025-Q4)

4. **CSV files**: Ensure no extra spaces, correct column names, and UTF-8 encoding

5. **Google Sheets**: Configure credentials in .env for publish to work

## Success Responses

All successful responses include:
```json
{
  "success": true,
  ...
}
```

Failed responses include:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev mode only)"
}
```

