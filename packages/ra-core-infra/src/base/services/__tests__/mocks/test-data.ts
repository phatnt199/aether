import type { User, ErrorResponse } from './api-schema';

export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

export const mockUser: User = mockUsers[0];

export const mockAuthToken = {
  type: 'Bearer',
  value: 'test-token-12345',
  provider: 'custom',
};

export const mockErrorResponse: ErrorResponse = {
  error: 'Bad Request',
  message: 'Validation failed',
  statusCode: 400,
  code: 'VALIDATION_ERROR',
};

export const mockUnauthorizedError: ErrorResponse = {
  error: 'Unauthorized',
  message: 'Missing or invalid authentication token',
  statusCode: 401,
  code: 'AUTH_ERROR',
};

export const mockNotFoundError: ErrorResponse = {
  error: 'Not Found',
  message: 'User not found',
  statusCode: 404,
  code: 'NOT_FOUND',
};
