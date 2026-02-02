// Utility to manage lab completion status in localStorage

const COMPLETED_LABS_KEY = 'completed_labs';

export const getCompletedLabs = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(COMPLETED_LABS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const markLabAsCompleted = (labId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const completed = getCompletedLabs();
    if (!completed.includes(labId)) {
      completed.push(labId);
      localStorage.setItem(COMPLETED_LABS_KEY, JSON.stringify(completed));
    }
  } catch {
    console.error('Failed to mark lab as completed');
  }
};

export const isLabCompleted = (labId: string): boolean => {
  return getCompletedLabs().includes(labId);
};

export const clearLabCompletion = (labId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const completed = getCompletedLabs();
    const filtered = completed.filter(id => id !== labId);
    localStorage.setItem(COMPLETED_LABS_KEY, JSON.stringify(filtered));
  } catch {
    console.error('Failed to clear lab completion');
  }
};
