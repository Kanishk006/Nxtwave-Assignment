# File Export System Guide

## Overview

The system now exports master reports to **local files** instead of Google Sheets. Reports are saved in both **JSON** and **CSV** formats for flexibility.

## Changes Made

### ✅ Removed
- Google Sheets API integration
- `googleapis` package
- Google service account configuration
- `googleSheets.service.ts`

### ✅ Added
- File-based export system
- JSON report generation
- CSV report generation
- Report listing and viewing endpoints
- `fileExport.service.ts`

## Report Storage

### Directory Structure
```
node-backend/
└── reports/
    ├── master_report_2025-Q4_2025-11-13.json
    ├── master_report_2025-Q4_2025-11-13.csv
    ├── master_report_2025-Q3_2025-08-15.json
    └── master_report_2025-Q3_2025-08-15.csv
```

### File Naming Convention
- **Format**: `master_report_{PERIOD}_{DATE}.{FORMAT}`
- **Example**: `master_report_2025-Q4_2025-11-13.json`

## JSON Report Format

```json
{
  "metadata": {
    "period": "2025-Q4",
    "generatedAt": "2025-11-13T10:30:00.000Z",
    "totalDepartments": 3,
    "products": ["Academy", "Intensive", "NIAT"]
  },
  "departments": [
    {
      "department": "Academy",
      "Academy": 45,
      "Intensive": 30,
      "NIAT": 25,
      "status": "approved",
      "submittedAt": "2025-11-10T08:00:00.000Z",
      "approvedAt": "2025-11-12T14:00:00.000Z",
      "notes": "Q4 allocations"
    }
  ],
  "summary": {
    "totalDepartments": 3,
    "productTotals": {
      "Academy": 135,
      "Intensive": 90,
      "NIAT": 75
    },
    "productAverages": {
      "Academy": 45,
      "Intensive": 30,
      "NIAT": 25
    }
  }
}
```

## CSV Report Format

```csv
# Master Report
# Period: 2025-Q4
# Generated: 2025-11-13T10:30:00.000Z
# Total Departments: 3

Department,Academy,Intensive,NIAT,Status,Submitted At,Approved At,Notes
Academy,45,30,25,approved,2025-11-10T08:00:00.000Z,2025-11-12T14:00:00.000Z,Q4 allocations
Intensive,40,35,25,approved,2025-11-10T09:00:00.000Z,2025-11-12T15:00:00.000Z,
NIAT,50,25,25,approved,2025-11-10T10:00:00.000Z,2025-11-12T16:00:00.000Z,

# SUMMARY
Metric,Academy,Intensive,NIAT
Total,135,90,75
Average,45,30,25
```

## API Endpoints

### 1. Publish Report

**POST** `/api/admin/publish`

**Request:**
```json
{
  "period": "2025-Q4",
  "overwrite": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Master report published successfully to files",
  "published": true,
  "files": {
    "json": "C:\\...\\reports\\master_report_2025-Q4_2025-11-13.json",
    "csv": "C:\\...\\reports\\master_report_2025-Q4_2025-11-13.csv"
  },
  "masterReportId": "507f1f77bcf86cd799439011",
  "period": "2025-Q4",
  "submission_count": 3,
  "data": { /* Full report data */ }
}
```

### 2. List Report Files

**GET** `/api/admin/reports/files`

**Response:**
```json
{
  "success": true,
  "count": 4,
  "files": [
    "master_report_2025-Q4_2025-11-13.json",
    "master_report_2025-Q4_2025-11-13.csv",
    "master_report_2025-Q3_2025-08-15.json",
    "master_report_2025-Q3_2025-08-15.csv"
  ]
}
```

### 3. Get Specific Report File

**GET** `/api/admin/reports/file/:fileName`

**Example:** `GET /api/admin/reports/file/master_report_2025-Q4_2025-11-13.json`

**Response:**
```json
{
  "success": true,
  "fileName": "master_report_2025-Q4_2025-11-13.json",
  "content": { /* Report data */ }
}
```

## Usage Examples

### Publish a Report (cURL)

```bash
curl -X POST http://localhost:5000/api/admin/publish \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "2025-Q4",
    "overwrite": true
  }'
```

### List All Reports

```bash
curl http://localhost:5000/api/admin/reports/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Specific Report

```bash
curl "http://localhost:5000/api/admin/reports/file/master_report_2025-Q4_2025-11-13.json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Features

### ✅ Automatic Features

1. **Directory Creation**: `reports/` folder is created automatically
2. **File Naming**: Uses sanitized period names and timestamps
3. **Both Formats**: Generates JSON and CSV simultaneously
4. **Summary Statistics**: Includes totals and averages per product
5. **Metadata**: Period, generation time, department count

### ✅ Data Integrity

- CSV escaping for commas, quotes, newlines
- Proper timestamp formatting
- Handles missing/null values
- Preserves all department submission data

### ✅ File Management

- **List Reports**: View all generated reports
- **Read Reports**: Retrieve report content via API
- **Cleanup**: Optional method to delete old reports (90+ days)

## Cleanup Old Reports

To manually clean up reports older than 90 days, you can add this to your cron job or call it periodically:

```typescript
// In your code
import fileExportService from './services/fileExport.service';

// Delete reports older than 90 days
await fileExportService.deleteOldReports(90);
```

## Advantages Over Google Sheets

✅ **No External Dependencies** - No API keys, credentials, or internet required
✅ **Full Control** - Complete ownership of data
✅ **Multiple Formats** - JSON for APIs, CSV for Excel
✅ **Better Performance** - Faster than API calls
✅ **Offline Access** - Works without internet
✅ **Version Control** - Easy to track report history
✅ **No Rate Limits** - No API quotas or throttling
✅ **Simpler Setup** - No Google Cloud configuration needed

## Accessing Reports

### Via API
Use the endpoints above to list and retrieve reports programmatically.

### Via File System
Reports are stored in `node-backend/reports/` and can be:
- Opened directly in text editors (JSON)
- Imported into Excel/Google Sheets (CSV)
- Processed by scripts
- Backed up or archived
- Version controlled (if needed)

## Database Storage

The `master_reports` collection still stores:
- Report metadata
- File paths (JSON and CSV)
- Publishing status
- Export timestamp
- Full payload for quick access

## Migration Notes

No migration needed! The system:
- Repurposes `sheet_url` field for JSON file path
- Adds file paths to `payload` field
- Maintains backward compatibility
- Old reports remain in database

## Testing

```bash
# 1. Login as admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' \
  | jq -r '.token')

# 2. Approve some submissions (see main docs)

# 3. Publish report
curl -X POST http://localhost:5000/api/admin/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-Q4", "overwrite": true}'

# 4. List reports
curl http://localhost:5000/api/admin/reports/files \
  -H "Authorization: Bearer $TOKEN"

# 5. View a specific report
curl "http://localhost:5000/api/admin/reports/file/master_report_2025-Q4_2025-11-13.json" \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

**REMOVED** (no longer needed):
- ~~GOOGLE_SERVICE_ACCOUNT_JSON~~
- ~~GOOGLE_SERVICE_ACCOUNT_FILE~~
- ~~GOOGLE_CLIENT_EMAIL~~
- ~~GOOGLE_PRIVATE_KEY~~
- ~~GOOGLE_SHEET_ID~~

No additional configuration required! The system works out of the box.

## Summary

🎉 **Simpler, faster, and more reliable!**

The file export system provides all the functionality of Google Sheets without the complexity of external API integration. Reports are instantly available in both human-readable (CSV) and machine-readable (JSON) formats.

