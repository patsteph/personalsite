/**
 * Input Validation and Sanitization
 * Comprehensive security for user inputs
 */

import { securityConfig } from "./security-config";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  type?: "string" | "number" | "email" | "url" | "boolean" | "array" | "object";
  sanitize?: boolean;
  allowHtml?: boolean;
  customValidator?: (value: any) => boolean;
}

export class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate a single field
   */
  validateField(
    value: any,
    rules: ValidationRules,
    fieldName: string = "field",
  ): ValidationResult {
    const errors: string[] = [];
    let sanitized = value;

    // Required check
    if (
      rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Skip further validation if field is not required and empty
    if (
      !rules.required &&
      (value === undefined || value === null || value === "")
    ) {
      return { isValid: true, errors: [], sanitized: value };
    }

    // Type validation
    if (rules.type) {
      const typeResult = this.validateType(value, rules.type, fieldName);
      if (!typeResult.isValid) {
        errors.push(...typeResult.errors);
      } else {
        sanitized = typeResult.sanitized;
      }
    }

    // String validations
    if (typeof sanitized === "string") {
      // Length validation
      if (rules.minLength && sanitized.length < rules.minLength) {
        errors.push(
          `${fieldName} must be at least ${rules.minLength} characters long`,
        );
      }

      if (rules.maxLength && sanitized.length > rules.maxLength) {
        errors.push(
          `${fieldName} must be no more than ${rules.maxLength} characters long`,
        );
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(sanitized)) {
        errors.push(`${fieldName} format is invalid`);
      }

      // Sanitization
      if (rules.sanitize !== false) {
        sanitized = this.sanitizeString(sanitized, rules.allowHtml || false);
      }

      // Security validation
      if (securityConfig.validation.blockSuspiciousPatterns) {
        const securityResult = this.validateSecurity(sanitized, fieldName);
        if (!securityResult.isValid) {
          errors.push(...securityResult.errors);
        }
      }
    }

    // Custom validator
    if (rules.customValidator && !rules.customValidator(sanitized)) {
      errors.push(`${fieldName} failed custom validation`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate multiple fields
   */
  validateObject(
    data: Record<string, any>,
    schema: Record<string, ValidationRules>,
  ): ValidationResult {
    const errors: string[] = [];
    const sanitized: Record<string, any> = {};

    for (const [fieldName, rules] of Object.entries(schema)) {
      const result = this.validateField(data[fieldName], rules, fieldName);

      if (!result.isValid) {
        errors.push(...result.errors);
      } else {
        sanitized[fieldName] = result.sanitized;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Type validation
   */
  private validateType(
    value: any,
    type: ValidationRules["type"],
    fieldName: string,
  ): ValidationResult {
    const errors: string[] = [];
    let sanitized = value;

    switch (type) {
      case "string":
        if (typeof value !== "string") {
          sanitized = String(value);
        }
        break;

      case "number":
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${fieldName} must be a valid number`);
        } else {
          sanitized = num;
        }
        break;

      case "email":
        if (typeof value !== "string") {
          errors.push(`${fieldName} must be a string`);
        } else {
          const emailResult = this.validateEmail(value);
          if (!emailResult.isValid) {
            errors.push(`${fieldName} must be a valid email address`);
          } else {
            sanitized = emailResult.sanitized;
          }
        }
        break;

      case "url":
        if (typeof value !== "string") {
          errors.push(`${fieldName} must be a string`);
        } else {
          const urlResult = this.validateUrl(value);
          if (!urlResult.isValid) {
            errors.push(`${fieldName} must be a valid URL`);
          } else {
            sanitized = urlResult.sanitized;
          }
        }
        break;

      case "boolean":
        if (typeof value === "boolean") {
          sanitized = value;
        } else if (typeof value === "string") {
          const lower = value.toLowerCase();
          if (lower === "true" || lower === "1") {
            sanitized = true;
          } else if (lower === "false" || lower === "0") {
            sanitized = false;
          } else {
            errors.push(`${fieldName} must be a valid boolean`);
          }
        } else {
          errors.push(`${fieldName} must be a boolean`);
        }
        break;

      case "array":
        if (!Array.isArray(value)) {
          errors.push(`${fieldName} must be an array`);
        }
        break;

      case "object":
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          errors.push(`${fieldName} must be an object`);
        }
        break;
    }

    return { isValid: errors.length === 0, errors, sanitized };
  }

  /**
   * Email validation
   */
  private validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return {
      isValid,
      errors: isValid ? [] : ["Invalid email format"],
      sanitized: email.toLowerCase().trim(),
    };
  }

  /**
   * URL validation
   */
  private validateUrl(url: string): ValidationResult {
    try {
      const urlObj = new URL(url);

      // Only allow http and https protocols
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return {
          isValid: false,
          errors: ["URL must use http or https protocol"],
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitized: urlObj.toString(),
      };
    } catch {
      return {
        isValid: false,
        errors: ["Invalid URL format"],
      };
    }
  }

  /**
   * String sanitization
   */
  private sanitizeString(str: string, allowHtml: boolean = false): string {
    if (!securityConfig.validation.sanitizeHtml || allowHtml) {
      return str.trim();
    }

    // Basic HTML escape
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .trim();
  }

  /**
   * Security validation for suspicious patterns
   */
  private validateSecurity(value: string, fieldName: string): ValidationResult {
    const errors: string[] = [];

    // Check for common injection patterns
    const dangerousPatterns = [
      { pattern: /<script/i, message: "Script tags not allowed" },
      { pattern: /javascript:/i, message: "JavaScript URLs not allowed" },
      { pattern: /vbscript:/i, message: "VBScript URLs not allowed" },
      { pattern: /on\w+\s*=/i, message: "Event handlers not allowed" },
      { pattern: /data:.*script/i, message: "Script data URLs not allowed" },
      { pattern: /eval\s*\(/i, message: "Eval expressions not allowed" },
      { pattern: /exec\s*\(/i, message: "Exec expressions not allowed" },
      {
        pattern: /union.*select/i,
        message: "SQL injection patterns not allowed",
      },
      { pattern: /\.\./g, message: "Directory traversal patterns not allowed" },
      {
        pattern: /__proto__/i,
        message: "Prototype pollution patterns not allowed",
      },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(value)) {
        errors.push(`${fieldName}: ${message}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * File validation
   */
  validateFile(file: File, fieldName: string = "file"): ValidationResult {
    const errors: string[] = [];
    const config = securityConfig.validation;

    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(
        `${fieldName} size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`,
      );
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
      errors.push(`${fieldName} type '${file.type}' is not allowed`);
    }

    // Check file name for suspicious patterns
    const securityResult = this.validateSecurity(
      file.name,
      `${fieldName} name`,
    );
    if (!securityResult.isValid) {
      errors.push(...securityResult.errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate API request body
   */
  validateApiRequest(
    body: any,
    schema: Record<string, ValidationRules>,
  ): ValidationResult {
    // Check body size (basic check)
    const bodyStr = JSON.stringify(body);
    const bodySizeBytes = new Blob([bodyStr]).size;
    const maxSizeBytes =
      parseInt(securityConfig.validation.maxBodySize.replace("mb", "")) *
      1024 *
      1024;

    if (bodySizeBytes > maxSizeBytes) {
      return {
        isValid: false,
        errors: [
          `Request body size exceeds maximum allowed size of ${securityConfig.validation.maxBodySize}`,
        ],
      };
    }

    return this.validateObject(body, schema);
  }
}

// Common validation schemas
export const commonSchemas = {
  email: {
    type: "email" as const,
    required: true,
    maxLength: 254,
  },

  password: {
    type: "string" as const,
    required: true,
    minLength: securityConfig.auth.passwordMinLength,
    maxLength: 128,
    pattern: securityConfig.auth.passwordRequireSpecial
      ? /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      : undefined,
  },

  blogPost: {
    title: {
      type: "string" as const,
      required: true,
      minLength: 1,
      maxLength: 200,
      sanitize: true,
    },
    content: {
      type: "string" as const,
      required: true,
      minLength: 10,
      maxLength: 50000,
      allowHtml: true,
      sanitize: false, // Content will be sanitized by MDX
    },
    slug: {
      type: "string" as const,
      required: true,
      pattern: /^[a-z0-9-]+$/,
      maxLength: 100,
    },
  },

  contact: {
    name: {
      type: "string" as const,
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitize: true,
    },
    email: {
      type: "email" as const,
      required: true,
    },
    message: {
      type: "string" as const,
      required: true,
      minLength: 10,
      maxLength: 2000,
      sanitize: true,
    },
  },
};

// Singleton instance
export const inputValidator = InputValidator.getInstance();

export default InputValidator;
