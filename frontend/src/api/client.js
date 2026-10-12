/**
 * Axios-based API client.
 * Automatically attaches the Cognito JWT to every request.
 */
import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token before every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // unauthenticated — let the server reject if needed
  }
  return config;
});

// ─── Challenges ──────────────────────────────────────────────────────────────
export const getChallenges   = (params) => apiClient.get('/challenges', { params });
export const getChallenge    = (id)     => apiClient.get(`/challenges/${id}`);
export const createChallenge = (data)   => apiClient.post('/challenges', data);
export const joinChallenge   = (id)     => apiClient.post(`/challenges/${id}/join`);

// ─── Posts ────────────────────────────────────────────────────────────────────
export const getPosts        = (challengeId) => apiClient.get(`/challenges/${challengeId}/posts`);
export const createPost      = (data)        => apiClient.post('/posts', data);
export const likePost        = (id)          => apiClient.post(`/posts/${id}/like`);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getProfile      = (userId)  => apiClient.get(`/users/${userId}`);
export const updateProfile   = (data)    => apiClient.put('/users/me', data);

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const getLeaderboard  = ()        => apiClient.get('/leaderboard');

// ─── File upload: get presigned S3 URL ───────────────────────────────────────
export const getUploadUrl    = (filename, contentType) =>
  apiClient.post('/upload-url', { filename, contentType });

export default apiClient;
