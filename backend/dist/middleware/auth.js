"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
exports.authenticateJWT = authenticateJWT;
const jwt = __importStar(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-38c21a4e';
function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new errors_1.AppError(401, 'UNAUTHORIZED', 'Access token required'));
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return next(new errors_1.AppError(401, 'UNAUTHORIZED', 'Access token required'));
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new errors_1.AppError(403, 'FORBIDDEN', 'Invalid or expired token'));
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            departmentId: decoded.departmentId
        };
        next();
    });
}
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.headers['x-user-role'] || req.user?.role;
        if (!userRole) {
            return next(new errors_1.AppError(401, 'UNAUTHORIZED', 'Authentication credentials are required'));
        }
        const roleString = Array.isArray(userRole) ? userRole[0] : userRole;
        if (!allowedRoles.includes(roleString)) {
            return next(new errors_1.AppError(403, 'FORBIDDEN', 'Access is denied'));
        }
        next();
    };
};
exports.requireRole = requireRole;
