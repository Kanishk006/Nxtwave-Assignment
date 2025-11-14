import { Request, Response, NextFunction } from 'express';
import { VALID_PRODUCTS } from '../models/EmployeeSubmission.model';

/**
 * Validation Middleware
 * Provides reusable validation functions
 */

/**
 * Validate Period Format (YYYY-Q[1-4])
 */
export const validatePeriod = (period: string): boolean => {
  const periodRegex = /^\d{4}-Q[1-4]$/;
  return periodRegex.test(period);
};

/**
 * Validate Percentage (0-100)
 */
export const validatePercentage = (percentage: number): boolean => {
  return typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
};

/**
 * Validate Product
 */
export const validateProduct = (product: string): boolean => {
  return VALID_PRODUCTS.includes(product as any);
};

/**
 * Validate Department Submission Items
 * Ensures percentages sum to valid total (optionally 100)
 * Allows auto_aggregate to bypass items requirement
 */
export const validateSubmissionItems = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { items, auto_aggregate } = req.body;

  // If auto_aggregate is true, skip items validation (controller will handle it)
  if (auto_aggregate) {
    next();
    return;
  }

  if (!items || !Array.isArray(items)) {
    res.status(400).json({
      success: false,
      message: 'Items array is required (or set auto_aggregate to true)',
    });
    return;
  }

  if (items.length === 0) {
    res.status(400).json({
      success: false,
      message: 'At least one item is required',
    });
    return;
  }

  // Validate each item
  const errors: string[] = [];
  let totalPercentage = 0;

  items.forEach((item: any, index: number) => {
    if (!item.product) {
      errors.push(`Item ${index + 1}: Product is required`);
    } else if (!validateProduct(item.product)) {
      errors.push(
        `Item ${index + 1}: Invalid product. Must be one of: ${VALID_PRODUCTS.join(', ')}`
      );
    }

    if (item.percentage === undefined || item.percentage === null) {
      errors.push(`Item ${index + 1}: Percentage is required`);
    } else if (!validatePercentage(item.percentage)) {
      errors.push(`Item ${index + 1}: Percentage must be between 0 and 100`);
    } else {
      totalPercentage += item.percentage;
    }
  });

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Check if total percentage is exactly 100%
  if (Math.abs(totalPercentage - 100) > 0.01) {
    res.status(400).json({
      success: false,
      message: `Total percentage must equal 100%. Current total: ${totalPercentage.toFixed(2)}%`,
    });
    return;
  }

  next();
};

/**
 * Validate Query Period Parameter
 */
export const validatePeriodParam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { period } = req.query;

  if (!period) {
    res.status(400).json({
      success: false,
      message: 'Period query parameter is required',
    });
    return;
  }

  if (!validatePeriod(period as string)) {
    res.status(400).json({
      success: false,
      message: 'Invalid period format. Expected format: YYYY-Q[1-4] (e.g., 2025-Q4)',
    });
    return;
  }

  next();
};

/**
 * Sanitize CSV Input
 * Prevents injection attacks in CSV uploads
 */
export const sanitizeCSVValue = (value: string): string => {
  if (!value) return '';
  
  // Remove potentially dangerous characters
  let sanitized = value.toString().trim();
  
  // Remove leading characters that could be interpreted as formulas
  if (sanitized.match(/^[=+\-@]/)) {
    sanitized = "'" + sanitized;
  }
  
  return sanitized;
};

