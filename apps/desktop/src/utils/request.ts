import axios, { AxiosResponse } from 'axios';
import { toast } from '@/components/ui/toast/use-toast';

// Create axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 500000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' },
});

// Request interceptor
service.interceptors.request.use(
  (config: any) => {
    if (!config.headers) {
      throw new Error(
        `Expected 'config' and 'config.headers' not to be undefined`
      );
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, msg } = response.data;
    if (code === 200) {
      return response;
    }
    else {
      // Handle binary data response (Excel export)
      if (response.data instanceof ArrayBuffer) {
        return response;
      }
      if (response.data instanceof Array) {
        return response;
      }

      toast({
        title: 'Error',
        description: msg || 'System error',
        variant: 'destructive'
      });
      return Promise.reject(new Error(msg || 'Error'));
    }
  },
  (error: any) => {
    if (error.response.data) {
      const { detail } = error.response.data;
      console.log('code:', error.response.data)
      toast({
        title: 'Error',
        description: detail || 'System error',
        variant: 'destructive'
      });
    }
    return Promise.reject(error.message);
  }
);

// Export axios instance
export default service;
