/**
 * api.ts
 * ---------------------------------------------------------------------------
 * Single typed client for the pixstory backend. Every other file calls
 * functions defined here instead of using fetch() directly, so the
 * Authorization header, base URL, and error shape are handled in one place.
 *
 * The backend base URL comes from VITE_API_URL (see .env.example).
 */

import { auth } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption: string;
  location: string;
  activity: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface UploadTicket {
  uploadUrl: string;
  s3Key: string;
}

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = auth.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      void 0;
    }
    if (res.status === 401) auth.clear();
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  signup(body: { email: string; password: string; name: string }) {
    return request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  listMemories(q?: string) {
    const query = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return request<{ memories: Memory[] }>(`/api/memories${query}`);
  },

  createUploadUrl(body: { contentType: string; fileExtension: string }) {
    return request<UploadTicket>('/api/memories/upload-url', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  createMemory(body: {
    s3Key: string;
    caption: string;
    location: string;
    activity: string;
  }) {
    return request<{ memory: Memory }>('/api/memories', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  toggleLike(memoryId: string) {
    return request<{ memory: Memory }>(`/api/memories/${memoryId}/like`, {
      method: 'POST',
    });
  },

  addComment(memoryId: string, text: string) {
    return request<{ memory: Memory }>(`/api/memories/${memoryId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) {
      throw new ApiError(res.status, `S3 upload failed (${res.status})`);
    }
  },
};

export { ApiError };
