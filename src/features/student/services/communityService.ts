import axios from 'axios';

const API_URL = '/api/student/community';

export interface Comment {
    id: string;
    author: {
        name: string;
        role: string;
    };
    content: string;
    timestamp: string;
}

export interface Post {
    id: string;
    author: {
        name: string;
        avatar?: string;
        role: string;
    };
    content: string;
    likes: number;
    comments: number;
    timestamp: string;
    tags: string[];
}

export const communityService = {
    getPosts: async (): Promise<Post[]> => {
        const response = await axios.get(API_URL);
        return response.data;
    },

    createPost: async (content: string, authorName: string, authorRole: string): Promise<string> => {
        const response = await axios.post(API_URL, {
            content,
            author: {
                name: authorName,
                role: authorRole
            },
            tags: ['General'] // Default tag for now
        });
        return response.data.id;
    },

    likePost: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/${id}/like`);
    },

    getComments: async (postId: string): Promise<Comment[]> => {
        const response = await axios.get(`${API_URL}/${postId}/comments`);
        return response.data;
    },

    addComment: async (postId: string, content: string, authorName: string, authorRole: string): Promise<{ id: string }> => {
        const response = await axios.post(`${API_URL}/${postId}/comments`, {
            content,
            author: {
                name: authorName,
                role: authorRole
            }
        });
        return response.data;
    }
};
