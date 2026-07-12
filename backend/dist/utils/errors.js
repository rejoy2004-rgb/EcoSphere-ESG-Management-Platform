"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = exports.asyncHandler = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    fields;
    constructor(statusCode, code, message, fields) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.fields = fields;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const globalErrorHandler = (err, req, res, next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                fields: err.fields
            }
        });
    }
    console.error(err);
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    });
};
exports.globalErrorHandler = globalErrorHandler;
