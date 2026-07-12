import { isValidTransition } from '../utils/transitions';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('Assertion failed:', message);
    process.exit(1);
  }
}

function runTests() {
  console.log('--- STARTING CHALLENGE STATE TRANSITIONS UNIT TEST ---');

  assert(isValidTransition('DRAFT', 'ACTIVE') === true, 'DRAFT -> ACTIVE should be allowed');
  assert(isValidTransition('DRAFT', 'ARCHIVED') === true, 'DRAFT -> ARCHIVED should be allowed');
  assert(isValidTransition('ACTIVE', 'UNDER_REVIEW') === true, 'ACTIVE -> UNDER_REVIEW should be allowed');
  assert(isValidTransition('ACTIVE', 'ARCHIVED') === true, 'ACTIVE -> ARCHIVED should be allowed');
  assert(isValidTransition('UNDER_REVIEW', 'COMPLETED') === true, 'UNDER_REVIEW -> COMPLETED should be allowed');
  assert(isValidTransition('UNDER_REVIEW', 'ARCHIVED') === true, 'UNDER_REVIEW -> ARCHIVED should be allowed');
  assert(isValidTransition('COMPLETED', 'ARCHIVED') === true, 'COMPLETED -> ARCHIVED should be allowed');

  assert(isValidTransition('DRAFT', 'DRAFT') === true, 'DRAFT -> DRAFT should be allowed');
  assert(isValidTransition('ARCHIVED', 'ARCHIVED') === true, 'ARCHIVED -> ARCHIVED should be allowed');

  assert(isValidTransition('COMPLETED', 'ACTIVE') === false, 'COMPLETED -> ACTIVE should be blocked');
  assert(isValidTransition('ARCHIVED', 'DRAFT') === false, 'ARCHIVED -> DRAFT should be blocked');
  assert(isValidTransition('ACTIVE', 'COMPLETED') === false, 'ACTIVE -> COMPLETED should be blocked');
  assert(isValidTransition('DRAFT', 'COMPLETED') === false, 'DRAFT -> COMPLETED should be blocked');
  assert(isValidTransition('ARCHIVED', 'ACTIVE') === false, 'ARCHIVED -> ACTIVE should be blocked');

  console.log('--- UNIT TEST PASSED: STATE TRANSITION VERIFICATIONS COMPLETE ---');
}

runTests();
