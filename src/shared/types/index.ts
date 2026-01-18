// Re-export all types from the main types file
export * from "./types";

// Additional types not in types.ts
export interface Lab {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tools: string[];
  instructions: string;
  completed: boolean;
}

export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
}
