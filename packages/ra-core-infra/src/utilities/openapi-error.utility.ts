import { ApplicationError, getError } from './error.utility';

export function transformOpenApiError(error: unknown, response?: Response): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  const statusCode =
    response?.status || (error as any)?.status || (error as any)?.statusCode || 500;

  if (error && typeof error === 'object') {
    const errorObj = error as any;

    const message =
      errorObj.message ||
      errorObj.error ||
      errorObj.detail ||
      errorObj.title ||
      (typeof errorObj === 'string' ? errorObj : JSON.stringify(errorObj));

    const messageCode = errorObj.code || errorObj.errorCode || errorObj.type;

    return getError({
      statusCode,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      messageCode,
      payload: error,
    });
  }

  if (typeof error === 'string') {
    return getError({
      statusCode,
      message: error,
    });
  }

  return getError({
    statusCode,
    message: 'An unexpected API error occurred',
    payload: error,
  });
}
