// Lab completion model and types
export interface LabCompletion {
  id: string;
  studentId: string;
  labId: string;
  completedAt: string;
  createdAt: string;
}

export interface LabStats {
  totalLabs: number;
  completedLabs: number;
  completionPercentage: number;
  completedLabIds: string[];
}
