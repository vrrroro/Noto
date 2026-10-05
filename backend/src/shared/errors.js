// An error that is safe to show to the user. Anything that is not an
// AppError is treated as an internal error and replaced with a generic message.
export class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const badRequest = (code, message) => new AppError(400, code, message);
export const notFound = (code, message) => new AppError(404, code, message);
export const conflict = (code, message) => new AppError(409, code, message);
