export function calculateCO2e(quantity: number, co2eFactor: number): number {
  return quantity * co2eFactor;
}

export function deriveGoalStatus(
  currentValue: number,
  targetValue: number,
  startDate: Date,
  targetDate: Date,
  now: Date
): 'ON_TRACK' | 'AT_RISK' | 'ACHIEVED' | 'MISSED' {
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
