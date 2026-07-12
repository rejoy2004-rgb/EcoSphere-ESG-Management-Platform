"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculations_1 = require("./calculations");
describe('calculateCO2e', () => {
    it('should correctly calculate CO2e emissions', () => {
        expect((0, calculations_1.calculateCO2e)(100, 2.5)).toBe(250);
        expect((0, calculations_1.calculateCO2e)(0, 1.8)).toBe(0);
        expect((0, calculations_1.calculateCO2e)(5.5, 0.4)).toBe(2.2);
    });
});
describe('deriveGoalStatus', () => {
    const start = new Date('2026-07-01T00:00:00.000Z');
    const target = new Date('2026-07-31T00:00:00.000Z');
    it('should return ACHIEVED if currentValue meets or exceeds targetValue', () => {
        expect((0, calculations_1.deriveGoalStatus)(100, 100, start, target, new Date('2026-07-15T00:00:00.000Z'))).toBe('ACHIEVED');
        expect((0, calculations_1.deriveGoalStatus)(120, 100, start, target, new Date('2026-07-15T00:00:00.000Z'))).toBe('ACHIEVED');
    });
    it('should return MISSED if targetDate has passed and currentValue is below targetValue', () => {
        expect((0, calculations_1.deriveGoalStatus)(50, 100, start, target, new Date('2026-08-01T00:00:00.000Z'))).toBe('MISSED');
    });
    it('should return ON_TRACK if progress is ahead of or equal to linear time progress', () => {
        expect((0, calculations_1.deriveGoalStatus)(50, 100, start, target, new Date('2026-07-15T00:00:00.000Z'))).toBe('ON_TRACK');
        expect((0, calculations_1.deriveGoalStatus)(60, 100, start, target, new Date('2026-07-15T00:00:00.000Z'))).toBe('ON_TRACK');
    });
    it('should return AT_RISK if progress is behind linear time progress', () => {
        expect((0, calculations_1.deriveGoalStatus)(30, 100, start, target, new Date('2026-07-16T00:00:00.000Z'))).toBe('AT_RISK');
    });
    it('should handle boundary cases safely', () => {
        expect((0, calculations_1.deriveGoalStatus)(0, 100, start, target, new Date('2026-06-30T00:00:00.000Z'))).toBe('ON_TRACK');
        expect((0, calculations_1.deriveGoalStatus)(50, 100, start, start, new Date('2026-07-15T00:00:00.000Z'))).toBe('MISSED');
    });
});
