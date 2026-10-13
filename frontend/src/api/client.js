/**
 * Axios-based API client.
 * Automatically attaches auth info to every request.
 * In local mode (no real Cognito) uses the sessionStorage mock user.
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const IS_LOCAL = !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
  import.meta.env.VITE_COGNITO_USER_POOL_ID === 'us-east-1_PLACEHOLDER';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth info before every request
apiClient.interceptors.request.use(async (config) => {
  if (IS_LOCAL) {
    // Local mode — attach userId from session so the mock API knows who's calling
    try {
      const stored = sessionStorage.getItem('mock_user');
      if (stored) {
        const u = JSON.parse(stored);
        config.headers['X-User-Id']   = u.userId;
        config.headers['X-User-Name'] = u.name;
        config.headers.Authorization  = 'Bearer mock-jwt-token';
      }
    } catch { /* ignore */ }
    return config;
  }
  // Production — attach real Cognito JWT
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession();
    const token   = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* unauthenticated */ }
  return config;
});

// ─── Challenges ──────────────────────────────────────────────────────────────
export const getChallenges   = (params) => apiClient.get('/challenges', { params });
export const getChallenge    = (id)     => apiClient.get(`/challenges/${id}`);
export const createChallenge = (data)   => apiClient.post('/challenges', data);
export const joinChallenge   = (id)     => apiClient.post(`/challenges/${id}/join`);

// ─── Posts ────────────────────────────────────────────────────────────────────
export const getPosts  = (challengeId) => apiClient.get(`/challenges/${challengeId}/posts`);
export const createPost = (data) => {
  // Attach userId from session so the mock API awards points to the right user
  const stored = sessionStorage.getItem('mock_user');
  const userId = stored ? JSON.parse(stored).userId : undefined;
  return apiClient.post('/posts', { ...data, userId });
};
export const likePost  = (id) => apiClient.post(`/posts/${id}/like`);

// ─── Users ────────────────────────────────────────────────────────────────────
export const getProfile    = (userId) => apiClient.get(`/users/${userId}`);
export const updateProfile = (data)   => apiClient.put('/users/me', data);

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const getLeaderboard = () => apiClient.get('/leaderboard');

// ─── Upload ───────────────────────────────────────────────────────────────────
export const getUploadUrl = (filename, contentType) =>
  apiClient.post('/upload-url', { filename, contentType });

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export const getVouchers         = ()    => apiClient.get('/vouchers');
export const redeemVoucher       = (id)  => apiClient.post(`/vouchers/${id}/redeem`);
export const getRedeemedVouchers = ()    => apiClient.get('/vouchers/redeemed');

export default apiClient;
