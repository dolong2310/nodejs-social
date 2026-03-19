/*
 * BaseService class for common service functionality.
 * This class provides methods for error handling, field validation, string sanitization,
 * and email validation. It is intended to be extended by specific service classes.
 * It uses a custom AppError class for error management.
 */

import { ObjectId } from 'mongodb';

export abstract class BaseService {
  /**
   * Replace ObjectId to string in the object
   */
  protected replaceObjectIdToString<T>(obj: any): T {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, value instanceof ObjectId ? value.toString() : value])
    ) as T;
  }

  // Method to handle errors
  // protected handleError(error: unknown) {}

  /*
   * Validates required fields in the provided data object.
   * Throws an AppError if any required field is missing.
   */
  // protected validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {}

  /*
   * Sanitizes a string by trimming whitespace and replacing multiple spaces with a single space.
   * Returns the sanitized string.
   */
  protected sanitizeString(str: string): string {
    return str.trim().replace(/\s+/g, ' ');
  }

  /*
   * Validates an email address format.
   * Returns true if valid, false otherwise.
   */
  protected isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
