"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../prisma");
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
const getEmployeeId = (req) => {
    const headerId = req.headers['x-user-id'] || req.headers['x-employee-id'];
    const finalId = req.user?.id || (Array.isArray(headerId) ? headerId[0] : headerId);
    if (!finalId) {
        throw new errors_1.AppError(401, 'UNAUTHORIZED', 'Employee identification is required');
    }
    return finalId;
};
router.get('/', (0, errors_1.asyncHandler)(async (req, res) => {
    const employeeId = getEmployeeId(req);
    const redemptions = await prisma_1.prisma.redemption.findMany({
        where: { employeeId },
        include: { reward: true }
    });
    res.json(redemptions);
}));
exports.default = router;
