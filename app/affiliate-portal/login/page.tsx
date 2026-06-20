// app/affiliate-portal/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth-api';
import { setAuthToken } from '@/lib/api';

export default function AffiliateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      if (res.error) throw new Error(res.error);
      if (res.data?.token) {
        setAuthToken(res.data.token);
        router.push('/apply');
      } else if (res.data?.requires2FA) {
        throw new Error('2FA is required. Please log in through the main GrowNest app first.');
      } else {
        throw new Error('Login failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Sign in to apply</h1>
          <p className="text-sm text-gray-500 mt-1">Use your GrowNest email and password</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 min-h-[44px]"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 min-h-[44px]"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full min-h-[44px] bg-green-600 hover:bg-green-700">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-400">
          {"Don't have a GrowNest account? "}
          <a href="https://grownest.africa/signup" className="text-green-600 hover:underline">
            Sign up on the app first
          </a>
        </p>
      </div>
    </div>
  );
}
