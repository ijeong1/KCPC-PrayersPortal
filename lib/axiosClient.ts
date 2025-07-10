// lib/axiosClient.ts
import axios from 'axios';
import { signOut } from 'next-auth/react'; 

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

const axiosClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let jwtToken: string | null = null;

// 토큰 설정 함수 (외부에서 토큰 넣어주는 용도)
export const setAuthToken = (token: string | null) => {
  jwtToken = token;
};


axiosClient.interceptors.request.use(
  (config) => {
    if (jwtToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      console.warn('⛔️ 401 detected → signing out');
      signOut({ callbackUrl: '/' });
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
