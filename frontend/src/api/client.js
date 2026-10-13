/**
 * Axios-based API client.
 * Always uses real AWS Cognito JWT for auth.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Cognito JWT before every request
apiClient.interceptors.request.use(async (config) => {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const token   = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Not authenticated — let the server reject if the route is protected
  }
  return config;
});

// ─── Challenges ───────────────────────────────────────────────────────────────
export const getChallenges   = (params) => apiClient.get('/challenges', { params });
export const getChallenge    = (id)     => apiClient.get(`/challenges/${id}`);
export const createChallenge = (data)   => apiClient.post('/challenges', data);
export const joinChallenge   = (id)     => apiClient.post(`/challenges/${id}/join`);

// ─── Posts ────────────────────────────────────────────────────────────────────
export const getPosts   = (challengeId) => apiClient.get(`/challenges/${challengeId}/posts`);
export const createPost = (data)        => apiClient.post('/posts', data);
export const likePost   = (id)          => apiClient.post(`/posts/${id}/like`);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getProfile    = (userId) => apiClient.get(`/users/${userId}`);
export const updateProfile = (data)   => apiClient.put('/users/me', data);

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const getLeaderboard = () => apiClient.get('/leaderboard');

// ─── Upload ───────────────────────────────────────────────────────────────────
export const getUploadUrl = (filename, contentType) =>
  apiClient.post('/upload-url', { filename, contentType });

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const getVouchers         = ()   => apiClient.get('/vouchers');
export const redeemVoucher       = (id) => apiClient.post(`/vouchers/${id}/redeem`);
export const getRedeemedVouchers = ()   => apiClient.get('/vouchers/redeemed');

export default apiClient;
