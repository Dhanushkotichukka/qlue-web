import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { Env } from '@/config/env';
import { auth } from './firebase';

/**
 * Shared axios client — mirrors DioClient:
 *  - baseURL from env, 15s connect / 60s receive style timeout
 *  - attaches Firebase ID token as `Authorization: Bearer`
 *  - on 401, force-refreshes the token and retries the request once
 */
function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: Env.apiBaseUrl.replace(/\/+$/, ''),
    timeout: 60_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const user = auth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      return config;
    },
  );

  client.interceptors.response.use(
    (r) => r,
    async (error) => {
      const status = error.response?.status;
      const original = error.config as
        | (InternalAxiosRequestConfig & { _retry?: boolean })
        | undefined;
      if (status === 401 && original && !original._retry) {
        original._retry = true;
        const user = auth().currentUser;
        if (user) {
          try {
            const token = await user.getIdToken(true);
            original.headers.set('Authorization', `Bearer ${token}`);
            return client(original);
          } catch {
            /* fall through to reject */
          }
        }
      }
      return Promise.reject(error);
    },
  );

  return client;
}

let instance: AxiosInstance | null = null;

export function api(): AxiosInstance {
  if (!instance) instance = createClient();
  return instance;
}
