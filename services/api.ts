import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// For Android emulator use 10.0.2.2, for iOS simulator use localhost
// Change this to your machine's local IP if testing on a real device
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000/api'
  : 'http://localhost:8000/api';

const TOKEN_KEY = '@govassist_token';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, any> | FormData,
  isFormData = false,
): Promise<T> {
  const token = await getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
  };

  const res = await fetch(`${BASE_URL}${path}`, options);

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : {};

  if (!res.ok) {
    const msg = data.message || data.error || `Request failed (${res.status})`;
    throw { status: res.status, message: msg, errors: data.errors };
  }

  return data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>('POST', '/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string }>('POST', '/register', { name, email, password }),

  logout: () => request<{ message: string }>('POST', '/logout'),

  getUser: () => request<any>('GET', '/user'),

  updateProfile: (data: { name?: string; phone?: string; address?: string }) =>
    request<any>('PUT', '/profile', data),
};

// ─── Service Categories ───────────────────────────────────────────────────────

export const categoryApi = {
  getAll: () => request<any[]>('GET', '/service-categories'),
};

// ─── Service Requests ─────────────────────────────────────────────────────────

export const requestApi = {
  getAll: (params?: { status?: string; search?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== ''),
          ) as Record<string, string>,
        ).toString()
      : '';
    return request<any[]>('GET', `/service-requests${qs}`);
  },

  getOne: (id: number) => request<any>('GET', `/service-requests/${id}`),

  create: (formData: FormData) =>
    request<any>('POST', '/service-requests', formData as any, true),

  update: (id: number, data: Record<string, any>) =>
    request<any>('PUT', `/service-requests/${id}`, data),

  delete: (id: number) =>
    request<{ message: string }>('DELETE', `/service-requests/${id}`),
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const feedbackApi = {
  submit: (serviceRequestId: number, rating: number, comment?: string) =>
    request<any>('POST', `/service-requests/${serviceRequestId}/feedback`, {
      rating,
      comment,
    }),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageApi = {
  getConversations: () => request<any[]>('GET', '/messages'),

  getMessages: (userId: number, serviceRequestId?: number) => {
    const qs = serviceRequestId ? `?service_request_id=${serviceRequestId}` : '';
    return request<any>('GET', `/messages/${userId}${qs}`);
  },

  send: (receiverId: number, message: string, serviceRequestId?: number) =>
    request<any>('POST', '/messages', {
      receiver_id:         receiverId,
      message,
      service_request_id:  serviceRequestId,
    }),
};
