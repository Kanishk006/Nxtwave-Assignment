import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';

// Import routes
import authRoutes from './routes/auth.routes';
import importRoutes from './routes/import.routes';
import hodRoutes from './routes/hod.routes';
import adminRoutes from './routes/admin.routes';

/**
 * Load environment variables
 */
dotenv.config();

/**
 * Initialize Express app
 */
const app: Application = express();
const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB
 */
connectDB();

/**
 * Middleware
 */
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
});

/**
 * Routes
 */

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Employee Submissions Management System API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      import: '/api/import',
      departments: '/api/departments',
      admin: '/api/admin',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Connected',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/import', importRoutes);
app.use('/api/departments', hodRoutes);
app.use('/api/admin', adminRoutes);

/**
 * Error handling middleware
 */
// Handle JSON parsing errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Check for JSON parsing errors (from body-parser)
  if (err instanceof SyntaxError || err.type === 'entity.parse.failed' || err.message?.includes('JSON')) {
    console.error('❌ JSON Parse Error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      error: 'Malformed JSON or empty body. Please ensure your request body is valid JSON. If you don\'t need a body, remove the Content-Type: application/json header.',
    });
  }
  
  // Handle other errors
  console.error('❌ Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Employee Submissions Management System');
  console.log('='.repeat(50));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Configured' : 'Not configured'}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;

