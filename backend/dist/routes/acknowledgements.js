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
router.post('/:id/acknowledge', (0, errors_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const employeeId = getEmployeeId(req);
    const ack = await prisma_1.prisma.policyAcknowledgement.findUnique({ where: { id } });
    if (!ack) {
        throw new errors_1.AppError(404, 'NOT_FOUND', 'Policy acknowledgement record not found');
    }
    if (ack.employeeId !== employeeId) {
        throw new errors_1.AppError(403, 'FORBIDDEN', 'You are not authorized to acknowledge this policy on behalf of this employee');
    }
    const updated = await prisma_1.prisma.policyAcknowledgement.update({
        where: { id },
        data: {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: new Date()
        }
    });
    res.json(updated);
}));
exports.default = router;
