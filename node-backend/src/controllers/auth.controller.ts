import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import auditService from '../services/audit.service';

/**
 * Authentication Controller
 * Handles login and user authentication
 */
class AuthController {
  /**
   * POST /api/auth/login
   * Login user and return JWT token
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() })
        .populate('department_id', 'name');
        console.log("User from DB:", user);
      console.log("password:", password);
      console.log("password_hash:", user?.password_hash);
      
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Generate JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const token = jwt.sign(
        {
          id: (user._id as string | undefined)?.toString?.() || '',
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: '24h' } // Token expires in 24 hours
      );

      // Log successful login
      await auditService.log({
        actor_id: (user._id as any).toString(),
        action_type: 'login',
        ip_address: req.ip || req.socket.remoteAddress,
        user_agent: req.get('user-agent'),
      });

      // Normalize department_id for response
      let normalizedDepartmentId: any = null;
      if (user.department_id) {
        if (typeof user.department_id === 'object' && '_id' in user.department_id) {
          // If populated, extract _id and create object with _id and name
          normalizedDepartmentId = {
            _id: (user.department_id as any)._id.toString(),
            name: (user.department_id as any).name || 'Unknown',
          };
        } else {
          // If it's an ObjectId, convert to string
          normalizedDepartmentId = {
            _id: String(user.department_id),
            name: 'Unknown',
          };
        }
      }

      // Return token and user info
      res.json({
        success: true,
        token,
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          department_id: normalizedDepartmentId,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
        return;
      }

      // Populate department if HOD
      await req.user.populate('department_id', 'name');

      // Normalize department_id for response
      let normalizedDepartmentId: any = null;
      if (req.user.department_id) {
        if (typeof req.user.department_id === 'object' && '_id' in req.user.department_id) {
          normalizedDepartmentId = {
            _id: (req.user.department_id as any)._id.toString(),
            name: (req.user.department_id as any).name || 'Unknown',
          };
        } else {
          normalizedDepartmentId = {
            _id: String(req.user.department_id),
            name: 'Unknown',
          };
        }
      }

      res.json({
        success: true,
        user: {
          id: (req.user._id as any).toString(),
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          department_id: normalizedDepartmentId,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/auth/register (Admin only - for creating users)
   * Create a new user
   */
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, role, department_id } = req.body;

      // Validate input
      if (!name || !email || !password || !role) {
        res.status(400).json({
          success: false,
          message: 'Name, email, password, and role are required',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists',
        });
        return;
      }

      // Create user
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password_hash: password, // Will be hashed by pre-save hook
        role,
        department_id: role === 'hod' ? department_id : undefined,
      });

      // Log user creation
      if (req.user) {
        await auditService.logFromRequest(
          req,
          'create_user',
          'user',
          (user._id as any).toString(),
          undefined,
          { email: user.email, role: user.role }
        );
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {

          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          department_id: user.department_id,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message,
      });
    }
  }
}

export default new AuthController();

