import axios from 'axios';
import { supabase } from '@shared/lib/supabase';

const API_URL = '/api/student/community';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export interface Comment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  content: string;
  timestamp: string;
  userId?: string;
  edited?: string;
  editedAt?: string;
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
  likedByUser?: boolean;
  userId?: string;
  edited?: string;
  editedAt?: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const communityService = {
  getPosts: async (
    userId?: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'newest' | 'mostLiked' | 'mostCommented' = 'newest',
    search?: string
  ): Promise<PostsResponse> => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    params.append('sortBy', sortBy);
    if (search) params.append('search', search);

    const response = await axios.get(`${API_URL}?${params.toString()}`);
    return response.data;
  },

  createPost: async (
    content: string,
    authorName: string,
    authorRole: string,
    authorAvatar?: string
  ): Promise<string> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      API_URL,
      {
        content,
        author: {
          name: authorName,
          role: authorRole,
          avatar: authorAvatar,
        },
        tags: ['General'],
      },
      { headers }
    );
    return response.data.id;
  },

  deletePost: async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/${id}`, { headers });
  },

  updatePost: async (id: string, content: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.patch(`${API_URL}/${id}`, { content }, { headers });
  },

  toggleLike: async (id: string): Promise<{ likes: number; liked: boolean }> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_URL}/${id}/like`, {}, { headers });
    return response.data;
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await axios.get(`${API_URL}/${postId}/comments`);
    return response.data;
  },

  addComment: async (
    postId: string,
    content: string,
    authorName: string,
    authorRole: string,
    authorAvatar?: string
  ): Promise<{ id: string }> => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_URL}/${postId}/comments`,
      {
        content,
        author: {
          name: authorName,
          role: authorRole,
          avatar: authorAvatar,
        },
      },
      { headers }
    );
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_URL}/${postId}/comments/${commentId}`, { headers });
  },

  updateComment: async (postId: string, commentId: string, content: string): Promise<void> => {
    const headers = await getAuthHeaders();
    await axios.patch(`${API_URL}/${postId}/comments/${commentId}`, { content }, { headers });
  },
};
