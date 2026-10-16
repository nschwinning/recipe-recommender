import axios from 'axios';

/**
 * Single shared axios instance for all backend calls.
 *
 * `baseURL` defaults to an empty string so requests are same-origin and
 * relative, which lets the Vite dev proxy forward `/api` and `/health` to the
 * backend without CORS. Set `VITE_API_URL` to target an absolute backend origin.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});
