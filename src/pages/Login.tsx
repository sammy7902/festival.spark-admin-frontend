import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { api } from '../lib/axios';
import { setAuth } from '../store/auth';
import { toast } from 'sonner';
import type { LoginResponse, ApiResponse } from '../types/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      try {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
        return response.data;
      } catch (error: any) {
        // Log error for debugging
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        setAuth(data.data.token, data.data.user);
        toast.success('Login successful!', {
          description: `Welcome back, ${data.data.user.name}`,
        });
        // Use setTimeout to ensure toast is visible before navigation
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        toast.error('Login failed', {
          description: 'Invalid response from server',
        });
      }
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Login failed';
      
      if (status === 401) {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password',
        });
      } else if (status === 403) {
        toast.error('Account inactive', {
          description: 'Your account has been deactivated. Please contact administrator.',
        });
      } else if (status === 400) {
        toast.error('Validation error', {
          description: message,
        });
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network')) {
        toast.error('Network error', {
          description: 'Unable to connect to server. Please check your connection.',
        });
      } else {
        toast.error('Login failed', {
          description: message,
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    loginMutation.mutate(formData);
  };

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Festival Spark" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Festival Spark</h1>
          <p className="text-sm sm:text-base text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              placeholder="Enter your email"
              className={errors.email ? 'border-red-500' : ''}
              aria-label="Email address"
              tabIndex={0}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              placeholder="Enter your password"
              className={errors.password ? 'border-red-500' : ''}
              aria-label="Password"
              tabIndex={0}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
            tabIndex={0}
            aria-label="Sign in"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center">
            Made with <span className="text-red-500">♥</span> by{' '}
            <span className="font-medium text-gray-500">Shivam Shah</span> for Festival Spark
          </p>
        </div>
      </Card>
    </div>
  );
};

