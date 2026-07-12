"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const validateBody = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const fields = {};
                for (const issue of error.issues) {
                    const path = issue.path.join('.');
                    fields[path] = issue.message;
                }
                return next(new errors_1.AppError(400, 'VALIDATION_ERROR', 'Validation failed', fields));
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
