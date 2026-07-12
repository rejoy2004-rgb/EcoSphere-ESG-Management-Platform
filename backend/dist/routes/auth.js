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
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-key-38c21a4e';
router.post('/register', async (req, res) => {
    const { name, email, password, role, departmentId } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        const hash = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash: hash,
                role: role || 'EMPLOYEE',
                departmentId: departmentId || null
            }
        });
        const token = jwt.sign({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            departmentId: newUser.departmentId
        }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                pointsBalance: newUser.pointsBalance
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { department: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId
        }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                pointsBalance: user.pointsBalance
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/me', auth_1.authenticateJWT, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const profile = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { department: true }
        });
        if (!profile) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            department: profile.department,
            pointsBalance: profile.pointsBalance
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
