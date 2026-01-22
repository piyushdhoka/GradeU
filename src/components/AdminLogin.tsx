import React, { useState } from 'react';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { useNavigate } from 'react-router-dom';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [identity, setIdentity] = useState('');
  const [secret, setSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await (login as (email: string, password: string, role: 'admin') => Promise<boolean>)(identity, secret, 'admin');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/admin');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Access verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {error && (
          <div className="bg-white/5 border border-white/10 rounded p-3 text-center">
            <p className="text-white text-xs font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            required
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="Email"
            className="bg-transparent border-white/20 text-white placeholder:text-white/30 h-10 rounded-none focus-visible:ring-0 focus-visible:border-white/50"
          />

          <Input
            type="password"
            required
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Password"
            className="bg-transparent border-white/20 text-white placeholder:text-white/30 h-10 rounded-none focus-visible:ring-0 focus-visible:border-white/50"
            showPasswordToggle={false}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full h-10 bg-white text-black hover:bg-white/90 rounded-none font-medium transition-colors"
          >
            {isLoading ? '...' : 'Authenticate'}
          </Button>
        </form>
      </div>
    </div>
  );
};
