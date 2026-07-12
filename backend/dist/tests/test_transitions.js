"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transitions_1 = require("../utils/transitions");
function assert(condition, message) {
    if (!condition) {
        console.error('Assertion failed:', message);
        process.exit(1);
    }
}
function runTests() {
    console.log('--- STARTING CHALLENGE STATE TRANSITIONS UNIT TEST ---');
    assert((0, transitions_1.isValidTransition)('DRAFT', 'ACTIVE') === true, 'DRAFT -> ACTIVE should be allowed');
    assert((0, transitions_1.isValidTransition)('DRAFT', 'ARCHIVED') === true, 'DRAFT -> ARCHIVED should be allowed');
    assert((0, transitions_1.isValidTransition)('ACTIVE', 'UNDER_REVIEW') === true, 'ACTIVE -> UNDER_REVIEW should be allowed');
    assert((0, transitions_1.isValidTransition)('ACTIVE', 'ARCHIVED') === true, 'ACTIVE -> ARCHIVED should be allowed');
    assert((0, transitions_1.isValidTransition)('UNDER_REVIEW', 'COMPLETED') === true, 'UNDER_REVIEW -> COMPLETED should be allowed');
    assert((0, transitions_1.isValidTransition)('UNDER_REVIEW', 'ARCHIVED') === true, 'UNDER_REVIEW -> ARCHIVED should be allowed');
    assert((0, transitions_1.isValidTransition)('COMPLETED', 'ARCHIVED') === true, 'COMPLETED -> ARCHIVED should be allowed');
    assert((0, transitions_1.isValidTransition)('DRAFT', 'DRAFT') === true, 'DRAFT -> DRAFT should be allowed');
    assert((0, transitions_1.isValidTransition)('ARCHIVED', 'ARCHIVED') === true, 'ARCHIVED -> ARCHIVED should be allowed');
    assert((0, transitions_1.isValidTransition)('COMPLETED', 'ACTIVE') === false, 'COMPLETED -> ACTIVE should be blocked');
    assert((0, transitions_1.isValidTransition)('ARCHIVED', 'DRAFT') === false, 'ARCHIVED -> DRAFT should be blocked');
    assert((0, transitions_1.isValidTransition)('ACTIVE', 'COMPLETED') === false, 'ACTIVE -> COMPLETED should be blocked');
    assert((0, transitions_1.isValidTransition)('DRAFT', 'COMPLETED') === false, 'DRAFT -> COMPLETED should be blocked');
    assert((0, transitions_1.isValidTransition)('ARCHIVED', 'ACTIVE') === false, 'ARCHIVED -> ACTIVE should be blocked');
    console.log('--- UNIT TEST PASSED: STATE TRANSITION VERIFICATIONS COMPLETE ---');
}
runTests();
