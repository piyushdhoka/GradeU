import React, { useState } from 'react';
import { Lock, Shield, ArrowRight, Settings } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { AuthLayout } from '@components/auth/AuthLayout';
import { useNavigate } from 'react-router-dom';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await (login as (email: string, password: string, role: 'admin') => Promise<boolean>)(email, password, 'admin');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Sign in as Admin"
      className="max-w-md"
    >
      <div className="bg-[#0A0F0A] border border-red-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.05)] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-red-500/10 border border-red-500/40 p-4 rounded-full">
              <Shield className="h-10 w-10 text-red-500" />
            </div>
            <div className="absolute -top-1 -right-1 bg-black border border-red-500/40 rounded-full p-1">
              <Settings className="h-4 w-4 text-red-500 animate-spin-slow" />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
            <p className="text-red-500 text-xs font-mono uppercase tracking-widest text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@email.com"
              leftIcon={<Shield className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              showPasswordToggle={true}
            />
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-12 bg-red-600 text-white hover:bg-red-500 font-black rounded-xl transition-all group border border-red-500/50"
          >
            {isLoading ? 'Logging in...' : (
              <span className="flex items-center justify-center gap-2">
                Login <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-[10px] text-red-500/60 font-mono leading-tight">
              Admin access only.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};