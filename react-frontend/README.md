# Employee Submissions Management System - Frontend

A modern React + TypeScript + Tailwind CSS frontend for the Employee Submissions Management System.

## 🚀 Features

- ✅ **Authentication** - JWT-based login with role-based access
- ✅ **Admin Dashboard** - Import data, review submissions, publish reports
- ✅ **HOD Dashboard** - View employee submissions, create department aggregates
- ✅ **CSV Import** - Upload and import employees and submissions
- ✅ **Real-time Updates** - Live data fetching and updates
- ✅ **Responsive Design** - Works on all devices
- ✅ **Beautiful UI** - Modern design with Tailwind CSS

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend server running on `http://localhost:5000`

## 🛠️ Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API URL** (optional):
Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

3. **Start development server:**
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📁 Project Structure

```
react-frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── Layout.tsx        # Main layout with navigation
│   │   └── ProtectedRoute.tsx # Route protection
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── pages/
│   │   ├── Login.tsx         # Login page
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── admin/            # Admin pages
│   │   │   ├── ImportPage.tsx
│   │   │   ├── PendingPage.tsx
│   │   │   └── ReportsPage.tsx
│   │   └── hod/              # HOD pages
│   │       └── SubmissionsPage.tsx
│   ├── services/
│   │   └── api.ts            # API service layer
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   ├── App.tsx               # Main app component
│   └── index.tsx             # Entry point
├── public/
└── package.json
```

## 🎨 Pages & Features

### Login Page (`/login`)
- Email/password authentication
- Test credentials displayed
- Error handling

### Dashboard (`/dashboard`)
- Role-based dashboard
- Quick access to features
- User profile information

### Admin Pages

#### Import Data (`/admin/import`)
- Upload employees CSV
- Upload submissions CSV
- View import results and errors

#### Pending Reviews (`/admin/pending`)
- View all pending department submissions
- Approve or reject submissions
- Filter by period

#### Reports (`/admin/reports`)
- Preview master reports
- Publish reports to files
- View and download published reports

### HOD Pages

#### My Submissions (`/hod/submissions`)
- View employee submissions for department
- Auto-aggregate or manual aggregate
- Submit department-level allocations

## 🔐 Authentication

The app uses JWT tokens stored in localStorage. Tokens are automatically included in API requests.

### Test Credentials

```
Admin:
  Email: admin@example.com
  Password: admin123

HOD Academy:
  Email: hod.academy@example.com
  Password: pass123
```

## 🔌 API Integration

All API calls are handled through the `api.ts` service layer:

- Automatic token injection
- Error handling
- Response interceptors
- Type-safe requests

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Responsive Design** - Mobile-first approach
- **Custom Components** - Reusable UI components

## 📦 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🔄 Workflow

### Admin Workflow
1. Login as admin
2. Import employees CSV
3. Import submissions CSV
4. Review pending department submissions
5. Approve submissions
6. Publish master report

### HOD Workflow
1. Login as HOD
2. View employee submissions for department
3. Review individual submissions
4. Create department aggregate (auto or manual)
5. Submit for admin review

## 🐛 Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:5000`
- Check `.env` file for correct API URL
- Verify CORS settings in backend

### Authentication Issues
- Clear localStorage and login again
- Check token expiration (24 hours)
- Verify user exists in database

### Build Issues
- Delete `node_modules` and reinstall
- Clear npm cache: `npm cache clean --force`
- Check Node.js version compatibility

## 📝 Notes

- All API endpoints require authentication except `/api/auth/login`
- Tokens expire after 24 hours
- Auto-redirect to login on 401 errors
- Protected routes based on user role

## 🚀 Production Build

```bash
npm run build
```

Build output will be in the `build/` directory.

## 📄 License

ISC
