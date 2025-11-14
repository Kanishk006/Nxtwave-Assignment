# Full Stack Project

A full-stack application with React + TypeScript frontend and Node.js + TypeScript backend.

## 📁 Project Structure

```
nxtwaveproject/
├── react-frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   ├── public/
│   └── package.json
├── node-backend/            # Node.js + Express + TypeScript
│   ├── src/
│   ├── dist/
│   └── package.json
└── README.md
```

## 🚀 Tech Stack

### Frontend
- ⚛️ **React** - UI library
- 📘 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Utility-first CSS framework

### Backend
- 🟢 **Node.js** - JavaScript runtime
- 📘 **TypeScript** - Type safety
- ⚡ **Express.js** - Web framework
- 🍃 **MongoDB** - NoSQL database with Mongoose
- 🔒 **CORS** - Cross-origin resource sharing

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd react-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd node-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## 📋 Available Scripts

### Frontend (react-frontend)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend (node-backend)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build

## 🔗 API Endpoints

### Base URL: `http://localhost:5000`

- `GET /` - API information
- `GET /api/health` - Health check

### User CRUD Operations (MongoDB)
- `GET /api/users` - Get all users from database
- `GET /api/users/:id` - Get single user by ID
- `POST /api/users` - Create a new user in database
- `PUT /api/users/:id` - Update user by ID
- `DELETE /api/users/:id` - Delete user by ID

## 🎯 Project Status

1. ✅ React frontend with TypeScript and Tailwind CSS
2. ✅ Node.js backend with TypeScript and Express
3. ✅ MongoDB database connected with Mongoose (Atlas)
4. ✅ Complete Employee Submissions Management System
5. ✅ JWT Authentication with role-based access control
6. ✅ CSV import for employees and submissions
7. ✅ HOD workflow (review & aggregate submissions)
8. ✅ Admin workflow (approve & publish to Google Sheets)
9. ✅ Complete audit logging system
10. ✅ 13 API endpoints fully implemented
11. Connect frontend to backend API
12. Deploy to production

## 📝 Notes

- Make sure both frontend and backend servers are running for full functionality
- The backend runs on port 5000, frontend on port 3000
- CORS is configured to allow cross-origin requests

## 🤝 Contributing

Feel free to contribute to this project!

## 📄 License

ISC

