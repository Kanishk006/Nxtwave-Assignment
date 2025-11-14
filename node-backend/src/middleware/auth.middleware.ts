import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';

/**
 * Extended Request interface with user
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * JWT Payload Interface
 */
interface JWTPayload {
  id: string;
  email: string;
  role: 'hod' | 'admin';
}

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be in format: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Get user from database
    const user = await User.findById(decoded.id).populate('department_id');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found. Token may be invalid.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token expired',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Department Authorization Middleware
 * Ensures HOD can only access their own department
 */
export const authorizeDepartment = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
    return;
  }

  // Admin can access all departments
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // HOD can only access their own department
  const departmentId = req.params.id || req.params.departmentId;
  
  if (!req.user.department_id) {
    res.status(403).json({
      success: false,
      message: 'User has no department assigned',
    });
    return;
  }

  // Handle both ObjectId and populated department_id
  let userDepartmentId: string;
  const deptId: any = req.user.department_id;
  
  if (deptId && typeof deptId === 'object') {
    // If populated (has _id property), use _id
    if ('_id' in deptId && deptId._id) {
      userDepartmentId = String(deptId._id);
    } else {
      // If it's an ObjectId directly
      userDepartmentId = String(deptId);
    }
  } else if (deptId) {
    // If it's already a string or ObjectId
    userDepartmentId = String(deptId);
  } else {
    res.status(403).json({
      success: false,
      message: 'User has no department assigned',
    });
    return;
  }

  // Compare both as strings (normalize departmentId from params)
  const normalizedDepartmentId = String(departmentId);
  
  if (userDepartmentId !== normalizedDepartmentId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own department',
    });
    return;
  }

  next();
};

