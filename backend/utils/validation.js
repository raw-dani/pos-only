/**
 * Input Validation using Joi
 * Centralized validation schemas for all API endpoints
 */

const Joi = require('joi');

// Common validation patterns
// Allow both string and number for IDs
const objectId = Joi.alternatives().try(
  Joi.string().pattern(/^[0-9]+$/),
  Joi.number().integer().positive()
).messages({
  'string.pattern.base': 'ID must be a valid number',
  'number.base': 'ID must be a valid number'
});

const username = Joi.string().alphanum().min(3).max(30).messages({
  'string.alphanum': 'Username must only contain alphanumeric characters',
  'string.min': 'Username must be at least 3 characters',
  'string.max': 'Username must not exceed 30 characters'
});

const password = Joi.string().min(6).max(100).messages({
  'string.min': 'Password must be at least 6 characters',
  'string.max': 'Password must not exceed 100 characters'
});

const name = Joi.string().min(1).max(100).messages({
  'string.min': 'Name is required',
  'string.max': 'Name must not exceed 100 characters'
});

const email = Joi.string().email().max(100).messages({
  'string.email': 'Invalid email format',
  'string.max': 'Email must not exceed 100 characters'
});

const price = Joi.number().positive().precision(2).messages({
  'number.positive': 'Price must be a positive number',
  'number.precision': 'Price must have at most 2 decimal places'
});

const quantity = Joi.number().integer().positive().messages({
  'number.integer': 'Quantity must be an integer',
  'number.positive': 'Quantity must be a positive number'
});

// Validation Schemas

// Login validation
const loginSchema = Joi.object({
  username: username.required(),
  password: Joi.string().required()
});

// Category validation
const categorySchema = Joi.object({
  name: name.required(),
  description: Joi.string().max(500).allow('', null)
});

const categoryUpdateSchema = Joi.object({
  name: name,
  description: Joi.string().max(500).allow('', null)
}).min(1);

// Product validation
const productSchema = Joi.object({
  name: name.required(),
  categoryId: objectId.required(),
  price: price.required(),
  description: Joi.string().max(1000).allow('', null),
  image: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Image must be a valid URL'
  }),
  isActive: Joi.boolean()
});

const productUpdateSchema = Joi.object({
  name: name,
  categoryId: objectId,
  price: price,
  description: Joi.string().max(1000).allow('', null),
  image: Joi.string().uri().allow('', null).messages({
    'string.uri': 'Image must be a valid URL'
  }),
  isActive: Joi.boolean()
}).min(1);

// Invoice item validation - allow zero for price/total, support both product and productId
const invoiceItemSchema = Joi.object({
  product: objectId,
  productId: objectId,
  name: name.required(),
  quantity: quantity.required(),
  price: Joi.number().min(0).required(),
  total: Joi.number().min(0).required()
}).or('product', 'productId');

// Invoice validation - simplified for frontend compatibility
const invoiceSchema = Joi.object({
  items: Joi.array().items(invoiceItemSchema).min(1).required(),
  cashierId: objectId.allow(null, ''),
  subtotal: Joi.number().min(0).allow(null),
  discount: Joi.number().min(0).default(0),
  tax: Joi.number().min(0).default(0),
  total: Joi.number().min(0).allow(null),
  paymentMethodId: objectId.allow(null, ''),
  paymentAmount: Joi.number().min(0).allow(null)
});

// Payment validation - allow zero and flexible amount
const paymentSchema = Joi.object({
  paymentMethodId: objectId.required(),
  amount: Joi.number().min(0).required()
});

// User validation
const userSchema = Joi.object({
  username: username.required(),
  password: password.required(),
  name: name.required(),
  email: email.allow('', null),
  roleId: objectId.required(),
  isActive: Joi.boolean()
});

const userUpdateSchema = Joi.object({
  username: username,
  password: password,
  name: name,
  email: email.allow('', null),
  roleId: objectId,
  isActive: Joi.boolean()
}).min(1);

// Report query validation
const reportQuerySchema = Joi.object({
  startDate: Joi.date().iso().allow(null),
  endDate: Joi.date().iso().allow(null),
  cashierId: objectId.allow(null)
});

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errorDetails
      });
    }

    // Replace request data with validated and sanitized data
    req[property] = value;
    next();
  };
};

// Optional validation middleware (for query params)
const validateQuery = (schema) => validate(schema, 'query');

module.exports = {
  // Schemas
  loginSchema,
  categorySchema,
  categoryUpdateSchema,
  productSchema,
  productUpdateSchema,
  invoiceSchema,
  paymentSchema,
  userSchema,
  userUpdateSchema,
  reportQuerySchema,
  
  // Middleware
  validate,
  validateQuery,
  
  // Common patterns
  objectId
};
