"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCO2e = calculateCO2e;
exports.deriveGoalStatus = deriveGoalStatus;
function calculateCO2e(quantity, co2eFactor) {
    return quantity * co2eFactor;
}
function deriveGoalStatus(currentValue, targetValue, startDate, targetDate, now) {
    if (currentValue >= targetValue) {
        return 'ACHIEVED';
    }
    if (now > targetDate) {
        return 'MISSED';
    }
    const totalTime = targetDate.getTime() - startDate.getTime();
    if (totalTime <= 0) {
        return 'MISSED';
    }
    const elapsed = now.getTime() - startDate.getTime();
    if (elapsed <= 0) {
        return 'ON_TRACK';
    }
    const expectedProgress = elapsed / totalTime;
    const actualProgress = currentValue / targetValue;
    if (actualProgress >= expectedProgress) {
        return 'ON_TRACK';
    }
    return 'AT_RISK';
}
