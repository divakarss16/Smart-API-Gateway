import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE 1 — Node.js backend (Express on port 5000)
//   Proxied by Vite: /api/* → http://localhost:5000/api/*
// ─────────────────────────────────────────────────────────────────────────────
const nodeApi = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every node request
nodeApi.interceptors.request.use((config) => {
  const info = _getUserInfo();
  if (info?.token) config.headers.Authorization = `Bearer ${info.token}`;
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// INSTANCE 2 — Java Servlet backend (Tomcat on port 8080)
//   Proxied by Vite: /java-api/* → http://localhost:8080/*
//   e.g.  POST /java-api/api/request  →  http://localhost:8080/api/request
// ─────────────────────────────────────────────────────────────────────────────
const javaApi = axios.create({
  baseURL: '/java-api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach X-API-Key header from the stored user profile on every Java request
javaApi.interceptors.request.use((config) => {
  const info = _getUserInfo();
  if (info?.apiKey) {
    config.headers['X-API-Key'] = info.apiKey;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED — Response error interceptor applied to both instances
// Maps HTTP errors to a clean error.userMessage string
// ─────────────────────────────────────────────────────────────────────────────
const errorInterceptor = (error) => {
  const status  = error?.response?.status;
  const data    = error?.response?.data;

  const userMessage =
    data?.message          ? data.message :
    status === 429         ? 'Rate limit exceeded — slow down your requests.' :
    status === 401         ? 'Authentication failed. Check your API key or log in again.' :
    status === 403         ? 'Access denied: insufficient permissions.' :
    !error.response        ? 'Network error — is the backend server running?' :
    `Server error (${status})`;

  // Auto-logout only for JWT 401 (Node), not for API key 401 (Java)
  if (status === 401 && error.config?.baseURL === '/api') {
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  }

  return Promise.reject({ ...error, status, userMessage, responseData: data });
};

nodeApi.interceptors.response.use((r) => r, errorInterceptor);
javaApi.interceptors.response.use((r) => r, errorInterceptor);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────
function _getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo'));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API  (Node.js backend — JWT-based)
// ─────────────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (email, password)         => nodeApi.post('/auth/login',    { email, password }),
  register: (name, email, password)   => nodeApi.post('/auth/register', { name, email, password }),
};

// ─────────────────────────────────────────────────────────────────────────────
// JAVA AUTH API  (Java Servlet — MySQL-based)
//   POST /java-api/api/auth/login    → { email, password }
//   POST /java-api/api/auth/register → { email, password, name? }
//
//   Success response: { status, message, email, name, role, id }
//   Error response:   { status:"error", message }
// ─────────────────────────────────────────────────────────────────────────────
export const javaAuthAPI = {
  /**
   * Login against Java/MySQL backend.
   * Returns { email, name, role, id } on success.
   */
  login: (email, password) =>
    javaApi.post('/api/auth/login', { email, password }),

  /**
   * Register a new user in MySQL via Java backend.
   */
  register: (email, password, name) =>
    javaApi.post('/api/auth/register', { email, password, name: name || email }),
};

// ─────────────────────────────────────────────────────────────────────────────
// GATEWAY API  (Node.js backend — rate limit stats, profile)
// ─────────────────────────────────────────────────────────────────────────────
export const gatewayAPI = {
  getProfile:  () => nodeApi.get('/v1/profile'),
  fireRequest: () => nodeApi.get('/v1/resource'),
};

// ─────────────────────────────────────────────────────────────────────────────
// JAVA GATEWAY API  (Java Servlet on Tomcat:8080)
//   Sends X-API-Key from localStorage automatically via interceptor.
//
//   Response shape (success):
//     { status, code, message, remaining_requests, rate_limit, reset_in_seconds }
//   Response shape (rate limited):
//     { status, code, message, remaining_requests:0, rate_limit, retry_after_seconds }
//   Response shape (error):
//     { status, code, message }
// ─────────────────────────────────────────────────────────────────────────────
export const javaGatewayAPI = {
  /**
   * Fire a request through the Java Token Bucket gateway.
   * @param {string} [apiKey]  — override the key from localStorage
   */
  fireRequest: (apiKey = null) => {
    const config = apiKey ? { headers: { 'X-API-Key': apiKey } } : {};
    return javaApi.get('/api/request', config);
  },

  /**
   * POST variant for form-based requests
   */
  firePostRequest: (apiKey = null, body = {}) => {
    const config = apiKey ? { headers: { 'X-API-Key': apiKey } } : {};
    return javaApi.post('/api/request', body, config);
  },

  /**
   * Generate a new API Key for the user via the Java Servlet
   */
  generateKey: (username) => {
    return javaApi.post('/api/generate-key', { username });
  },

  /**
   * Check Java Gateway and DB health
   */
  checkHealth: () => {
    return javaApi.get('/api/health');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN API  (Node.js backend)
// ─────────────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getUsers:       ()                        => nodeApi.get('/admin/users'),
  getStats:       ()                        => nodeApi.get('/admin/stats'),
  updateRateLimit:(userId, rateLimit)       => nodeApi.put(`/admin/users/${userId}/rate-limit`, { rateLimit }),
};

export { nodeApi, javaApi };
export default nodeApi;
