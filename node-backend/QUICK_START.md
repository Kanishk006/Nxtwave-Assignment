# Quick Start Guide

Get the Employee Submissions Management System up and running in 5 minutes!

## ⚡ Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

The `.env` file is already configured with MongoDB connection. You can modify if needed:

```env
PORT=5000
MONGO_URI=mongodb+srv://kanishkpodichetty_db_user:kanni2006@cluster0.myadidm.mongodb.net/employee_submissions
JWT_SECRET=your-secret-key
```

### 3. Seed the Database

```bash
npm run seed
```

This creates:
- ✅ 4 Departments (Academy, Intensive, NIAT, HR)
- ✅ 4 Users (1 Admin + 3 HODs)
- ✅ 7 Employees
- ✅ 11 Employee Submissions

### 4. Start the Server

```bash
npm run dev
```

Server runs on: **http://localhost:5000**

## 🎯 Test the API

### Login as Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

**Copy the token from the response!**

### Import More Employees

```bash
curl -X POST http://localhost:5000/api/import/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample-data/employees.csv"
```

### Import More Submissions

```bash
curl -X POST http://localhost:5000/api/import/submissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample-data/employee_submissions.csv"
```

## 🔐 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| HOD Academy | hod.academy@example.com | pass123 |
| HOD Intensive | hod.intensive@example.com | pass123 |
| HOD NIAT | hod.niat@example.com | pass123 |

## 📚 API Endpoints

### Base URL: `http://localhost:5000`

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Get profile | All |
| POST | /api/import/employees | Import employees CSV | Admin |
| POST | /api/import/submissions | Import submissions CSV | Admin |
| GET | /api/departments/:id/submissions | Get dept submissions | HOD/Admin |
| POST | /api/departments/:id/aggregate | Submit dept aggregate | HOD |
| GET | /api/admin/pending | Get pending submissions | Admin |
| PATCH | /api/admin/department_submissions/:id | Approve/reject | Admin |
| POST | /api/admin/publish | Publish to Google Sheets | Admin |

## 🔄 Complete Workflow Example

### Step 1: Admin Imports Data

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | jq -r '.token')

# Import employees
curl -X POST http://localhost:5000/api/import/employees \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample-data/employees.csv"

# Import submissions
curl -X POST http://localhost:5000/api/import/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@sample-data/employee_submissions.csv"
```

### Step 2: HOD Reviews and Submits

```bash
# Login as HOD
HOD_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "hod.academy@example.com", "password": "pass123"}' \
  | jq -r '.token')

# Get department ID from profile
DEPT_ID=$(curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $HOD_TOKEN" \
  | jq -r '.user.department_id._id')

# View submissions
curl "http://localhost:5000/api/departments/$DEPT_ID/submissions?period=2025-Q4" \
  -H "Authorization: Bearer $HOD_TOKEN"

# Submit department aggregate (auto-compute)
curl -X POST "http://localhost:5000/api/departments/$DEPT_ID/aggregate" \
  -H "Authorization: Bearer $HOD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "auto_aggregate": true,
    "notes": "Auto-computed from employee submissions"
  }'
```

### Step 3: Admin Approves and Publishes

```bash
# Get pending submissions
curl "http://localhost:5000/api/admin/pending?period=2025-Q4" \
  -H "Authorization: Bearer $TOKEN"

# Approve submission (use ID from previous response)
curl -X PATCH "http://localhost:5000/api/admin/department_submissions/SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'

# Preview master report
curl "http://localhost:5000/api/admin/reports/master/2025-Q4" \
  -H "Authorization: Bearer $TOKEN"

# Publish to Google Sheets (if configured)
curl -X POST http://localhost:5000/api/admin/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "target": "google_sheet",
    "overwrite": true
  }'
```

## 🎨 Frontend Integration

Connect your React frontend:

```typescript
// Login
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const { token, user } = await response.json();

// Store token
localStorage.setItem('token', token);

// Make authenticated requests
const data = await fetch('http://localhost:5000/api/admin/pending', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check your `MONGO_URI` in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas
- Verify network connectivity

### Import Fails
- Check CSV format matches expected columns
- Ensure file encoding is UTF-8
- Verify department names exist

### Authentication Fails
- Verify email/password are correct
- Run `npm run seed` to recreate users
- Check JWT_SECRET is set in `.env`

### Google Sheets Fails
- Configure Google Service Account credentials
- Share the spreadsheet with service account email
- Check API is enabled in Google Cloud Console

## 📖 Full Documentation

- [Complete API Documentation](./README.md)
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Sample CSV Files](./sample-data/)

## 🚀 Production Deployment

```bash
# Build
npm run build

# Start production server
npm start
```

Set `NODE_ENV=production` and configure secure JWT_SECRET!

## 💡 Tips

1. **Use Postman**: Import the collection from API_TESTING_GUIDE.md
2. **Check Logs**: Server logs all requests with duration
3. **Audit Trail**: All actions are logged in audit_log collection
4. **Test Data**: Use `npm run seed` to reset database

## ✅ Checklist

- [ ] Dependencies installed
- [ ] MongoDB connected
- [ ] Database seeded
- [ ] Server running on port 5000
- [ ] Can login as admin
- [ ] Can import CSV files
- [ ] Frontend connects successfully

## 🎉 You're Ready!

The backend is fully operational. Start building your React frontend or use the API directly!

**Need Help?** Check the full [README.md](./README.md) for detailed documentation.

