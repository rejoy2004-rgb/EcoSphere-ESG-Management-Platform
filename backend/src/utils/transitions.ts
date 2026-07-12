export const allowedTransitions: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['UNDER_REVIEW', 'ARCHIVED'],
  UNDER_REVIEW: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: []
};

export function isValidTransition(from: string, to: string): boolean {
  if (from === to) {
    return true;
  }
  const targets = allowedTransitions[from];
  return targets ? targets.includes(to) : false;
}
