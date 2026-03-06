import axios from "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let unauthorizedHandler: (() => void) | null = null;
export function onUnauthorized(handler: () => void) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let queuedRequests: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response || response.status !== 401 || config?._retry) {
      return Promise.reject(error);
    }

    if (config.url?.includes("/auth/refresh")) {
      unauthorizedHandler?.();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        queuedRequests.push((token: string) => {
          if (config.headers) config.headers.Authorization = `Bearer ${token}`;
          resolve(api(config));
        });
      });
    }

    config._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await refreshClient.post("/auth/refresh");
      const newToken: string | undefined = refreshResponse.data?.accessToken;
      if (!newToken) throw new Error("Falha ao renovar sessão");

      localStorage.setItem("token", newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      queuedRequests.forEach((cb) => cb(newToken));
      queuedRequests = [];

      if (config.headers) config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch (refreshErr) {
      queuedRequests = [];
      unauthorizedHandler?.();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
