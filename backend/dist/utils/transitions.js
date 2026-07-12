"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedTransitions = void 0;
exports.isValidTransition = isValidTransition;
exports.allowedTransitions = {
    DRAFT: ['ACTIVE', 'ARCHIVED'],
    ACTIVE: ['UNDER_REVIEW', 'ARCHIVED'],
    UNDER_REVIEW: ['COMPLETED', 'ARCHIVED'],
    COMPLETED: ['ARCHIVED'],
    ARCHIVED: []
};
function isValidTransition(from, to) {
    if (from === to) {
        return true;
    }
    const targets = exports.allowedTransitions[from];
    return targets ? targets.includes(to) : false;
}
