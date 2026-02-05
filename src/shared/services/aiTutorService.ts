interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatContext {
  courseTitle: string;
  moduleTitle: string;
  moduleDescription: string;
  topicContent?: string;
}

class AiTutorService {
  async chat(messages: ChatMessage[], context: ChatContext) {
    try {
      const response = await fetch('/api/student/ai-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not understand that.';
    } catch (error) {
      console.error('AI Tutor Service Error:', error);
      throw error;
    }
  }
}

export const aiTutorService = new AiTutorService();
